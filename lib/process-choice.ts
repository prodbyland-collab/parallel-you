import { applyTraitEffect } from "@/lib/random-engine";
import { createStorySignature } from "@/lib/story-signature";
import type { ChoiceRecord, ConsequenceThread, MemoryObject, StoryChoice, StoryFlag, StoryRunState, StoryScene } from "@/lib/story-types";

export function processChoice(choice: StoryChoice, storyState: StoryRunState, scene: StoryScene): StoryRunState {
  const effect = choice.effects ?? choice.effect;
  const flags = Array.from(new Set([...storyState.flags, ...(choice.flagsAdded ?? choice.flags ?? [])]));
  const choices: ChoiceRecord[] = [
    ...storyState.choices,
    {
      sceneId: scene.id,
      sceneTitle: scene.title,
      choiceId: choice.id,
      choiceText: choice.text,
      act: scene.act,
      year: scene.year
    }
  ];

  const next: StoryRunState = {
    ...storyState,
    traits: updateAdaptiveTraits(applyTraitEffect(storyState.traits, effect), choice),
    flags,
    choices,
    recentChoiceTexts: [...storyState.recentChoiceTexts, choice.text].slice(-24),
    sceneHistory: [...storyState.sceneHistory, `adaptive_${choices.length + 1}`],
    currentSceneId: `adaptive_${choices.length + 1}`,
    missedMoments: updateMissed(storyState.missedMoments, choice, scene),
    missedOpportunities: updateMissed(storyState.missedOpportunities ?? storyState.missedMoments, choice, scene),
    consequenceThreads: updateThreads(storyState.consequenceThreads, choice, scene),
    memories: updateMemoryObjects(storyState.memories, choice, scene),
    turningPoints: updateTurningPoints(storyState.turningPoints, choice, choices.length),
    repeatedPatterns: detectPatterns(choices, flags),
    endingSeeds: updateEndingSeeds(storyState.endingSeeds, choice, flags),
    emotionalConsequences: [...storyState.emotionalConsequences, choice.consequenceHint ?? inferConsequence(choice)].filter(Boolean).slice(-20),
    generatedTextHistory: [...storyState.generatedTextHistory, scene.title, scene.narration, choice.text].slice(-120)
  };

  return { ...next, storySignature: createStorySignature(next) };
}

function updateAdaptiveTraits(traits: StoryRunState["traits"], choice: StoryChoice) {
  const flags = new Set(choice.flagsAdded ?? choice.flags ?? []);
  return {
    ...traits,
    fatigue: clamp(traits.fatigue + (flags.has("burned_out") ? 12 : flags.has("stayed_consistent") ? 4 : flags.has("did_nothing") ? -2 : 0)),
    regret: clamp(traits.regret + (flags.has("ignored_message") || flags.has("ignored_opportunity") || flags.has("did_nothing") ? 9 : flags.has("returned_after_failure") ? -5 : 0)),
    momentum: clamp(traits.momentum + (flags.has("stayed_consistent") || flags.has("sent_unfinished") || flags.has("finished_badly") ? 9 : flags.has("avoided_work") ? -6 : 1))
  };
}

function updateThreads(threads: ConsequenceThread[], choice: StoryChoice, scene: StoryScene) {
  let next = threads;
  if (choice.resolvesThread) {
    next = next.map((thread) => thread.id === choice.resolvesThread ? { ...thread, status: "resolved" as const, weight: thread.weight + 2 } : thread);
  }
  const theme = choice.createsThread ?? threadTheme(choice);
  if (theme) {
    const id = `${theme}_${scene.id}_${threads.length}`;
    next = [...next, { id, theme, createdBy: choice.text, status: "open", weight: 5 }];
  }
  return next.slice(-12);
}

function updateMemoryObjects(memories: MemoryObject[], choice: StoryChoice, scene: StoryScene) {
  if (scene.memoryObject && !memories.some((memory) => memory.id === scene.memoryObject?.id)) return [...memories, scene.memoryObject];
  if (!choice.endingInfluence) return memories;
  return memories;
}

function updateMissed(items: string[], choice: StoryChoice, scene: StoryScene) {
  const flags = new Set(choice.flagsAdded ?? choice.flags ?? []);
  if (!flags.has("ignored_message") && !flags.has("ignored_opportunity") && !flags.has("did_nothing") && !flags.has("avoided_work")) return items;
  return [...items, `${scene.title}: ${choice.text}`].slice(-16);
}

function updateTurningPoints(items: string[], choice: StoryChoice, count: number) {
  const flags = new Set(choice.flagsAdded ?? choice.flags ?? []);
  if (count < 5) return items;
  if (flags.has("sent_unfinished") || flags.has("finished_badly") || flags.has("returned_after_failure")) return [...items, choice.text].slice(-8);
  return items;
}

function updateEndingSeeds(items: string[], choice: StoryChoice, flags: StoryFlag[]) {
  const seeds = [...items];
  if (choice.endingInfluence) seeds.push(choice.endingInfluence);
  if (flags.includes("stayed_consistent")) seeds.push("kept showing up");
  if (flags.includes("ignored_message")) seeds.push("unanswered message");
  if (flags.includes("returned_after_failure")) seeds.push("came back after leaving");
  return Array.from(new Set(seeds)).slice(-12);
}

function detectPatterns(choices: ChoiceRecord[], flags: StoryFlag[]) {
  const patterns: string[] = [];
  const texts = choices.map((choice) => choice.choiceText.toLowerCase()).join(" ");
  if ((flags.filter((flag) => flag === "started_over_again").length || (texts.match(/start/g)?.length ?? 0)) >= 2) patterns.push("starts_not_finishes");
  if (flags.includes("ignored_message")) patterns.push("avoids_messages");
  if (flags.includes("burned_out")) patterns.push("burns_out");
  if (flags.includes("stayed_consistent")) patterns.push("keeps_showing_up");
  if (flags.includes("did_nothing") || flags.includes("avoided_work")) patterns.push("delays_then_feels_it");
  return Array.from(new Set(patterns));
}

function threadTheme(choice: StoryChoice) {
  const flags = new Set(choice.flagsAdded ?? choice.flags ?? []);
  if (flags.has("ignored_message")) return "unanswered_message";
  if (flags.has("ignored_opportunity")) return "missed_opportunity";
  if (flags.has("sent_unfinished")) return "rough_work_in_public";
  if (flags.has("burned_out")) return "body_getting_tired";
  if (flags.has("started_over_again")) return "starting_without_finishing";
  return "";
}

function inferConsequence(choice: StoryChoice) {
  if (choice.consequenceHint) return choice.consequenceHint;
  if (choice.flags?.includes("did_nothing")) return "The day moved without permission.";
  if (choice.flags?.includes("sent_unfinished")) return "The rough thing left the room.";
  return "";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
