import { generateChoices } from "@/lib/choice-generator";
import { normalizeProfile, personalizeScene } from "@/lib/personalization";
import { applyTraitEffect, createInitialTraits, createSeed, maybeCreateWildCard, pickWeighted, seededRandom, selectSceneVariation } from "@/lib/random-engine";
import { baseStoryScenes, type SceneTemplate } from "@/lib/story-scenes";
import { createStorySignature } from "@/lib/story-signature";
import type { ChaosEvent, ChoiceRecord, MemoryObject, MovieMoment, PlayerProfile, SecretSceneRecord, StoryChoice, StoryFlag, StoryRunState, StoryScene } from "@/lib/story-types";

const chaosEvents: ChaosEvent[] = [
  {
    id: "old-friend-text",
    title: "Old Friend Texts",
    kind: "unexpected message",
    narration: "An old friend texts out of nowhere. Nothing huge. Just enough to change the room.",
    effect: { social: 5, confidence: 3, luck: 3 },
    flags: ["asked_for_help"]
  },
  {
    id: "opportunity-email",
    title: "Unexpected Email",
    kind: "strange opportunity",
    narration: "An email lands while you are doing something normal. It sounds real, which makes it harder to answer.",
    effect: { risk: 4, luck: 5, social: 2 },
    flags: ["lucky_event_seen"]
  },
  {
    id: "sudden-expense",
    title: "Sudden Expense",
    kind: "risky shortcut",
    narration: "Money leaves faster than expected. The week gets smaller, but not over.",
    effect: { discipline: 2, risk: -3, luck: -4 },
    flags: ["returned_after_failure"]
  },
  {
    id: "random-compliment",
    title: "Random Compliment",
    kind: "unexpected message",
    narration: "Someone says one kind thing and keeps walking. You pretend it did not matter. It did.",
    effect: { confidence: 5, creativity: 2, social: 2 },
    flags: ["someone_noticed"]
  },
  {
    id: "notes-app-idea",
    title: "Notes App Idea",
    kind: "sudden creative idea",
    narration: "A useful idea arrives while you are half distracted. You type it before it disappears.",
    effect: { creativity: 6, consistency: 1, luck: 2 },
    flags: ["breakthrough_seen"]
  }
];

export function createInitialRun(profile: PlayerProfile): StoryRunState {
  const normalized = normalizeProfile(profile);
  const seed = createSeed();
  const initial: StoryRunState = {
    profile: normalized,
    traits: createInitialTraits(normalized, seed),
    flags: [],
    currentSceneId: "opening_room",
    sceneHistory: ["opening_room"],
    choices: [],
    recentChoiceTexts: [],
    wildcardsUsed: [],
    chaosUsed: false,
    chaosEvents: [],
    memories: [],
    secretScenesFound: [],
    miniGamesCompleted: [],
    rareMomentsTriggered: [],
    missedMoments: [],
    relationshipMoments: [],
    emotionalConsequences: [],
    generatedTextHistory: [],
    storySignature: "",
    replayCount: 0,
    seed
  };

  return { ...initial, storySignature: createStorySignature(initial) };
}

export function getScene(state: StoryRunState): StoryScene {
  const template = baseStoryScenes.find((scene) => scene.id === state.currentSceneId) ?? baseStoryScenes[0];
  return hydrateScene(template, state);
}

export function getAllScenes(state: StoryRunState) {
  return baseStoryScenes.map((template) => hydrateScene(template, state));
}

export function chooseSceneOption(state: StoryRunState, choice: StoryChoice): StoryRunState {
  const scene = getScene(state);
  const nextId = choice.nextScene ?? getNextSceneId(state);
  const choices: ChoiceRecord[] = [
    ...state.choices,
    {
      sceneId: scene.id,
      sceneTitle: scene.title,
      choiceId: choice.id,
      choiceText: choice.text,
      act: scene.act,
      year: scene.year
    }
  ];

  let nextState: StoryRunState = {
    ...state,
    traits: applyTraitEffect(state.traits, choice.effect),
    flags: mergeFlags(state.flags, choice.flags ?? []),
    choices,
    recentChoiceTexts: [...(state.recentChoiceTexts ?? []), choice.text].slice(-12),
    missedMoments: updateMissedMoments(state, scene, choice),
    emotionalConsequences: updateEmotionalConsequences(state, choice),
    generatedTextHistory: updateGeneratedTextHistory(state, scene, choice),
    currentSceneId: nextId,
    sceneHistory: nextId === "ending" ? state.sceneHistory : appendUnique(state.sceneHistory, nextId)
  };

  nextState = recordSceneDiscoveries(nextState, nextId);

  const wildcard = maybeCreateWildCard(nextState, choices.length);
  if (wildcard) {
    nextState = {
      ...nextState,
      traits: applyTraitEffect(nextState.traits, wildcard.effect),
      flags: mergeFlags(nextState.flags, wildcard.flags),
      wildcardsUsed: [...nextState.wildcardsUsed, wildcard]
    };
  }

  return { ...nextState, storySignature: createStorySignature(nextState) };
}

export function applyGeneratedConsequence(state: StoryRunState, lines: string[], delayedFlag?: StoryFlag): StoryRunState {
  const nextState = {
    ...state,
    flags: delayedFlag ? mergeFlags(state.flags, [delayedFlag]) : state.flags,
    emotionalConsequences: [...(state.emotionalConsequences ?? []), lines.join(" ")].slice(-12),
    generatedTextHistory: [...(state.generatedTextHistory ?? []), ...lines].slice(-80)
  };
  return { ...nextState, storySignature: createStorySignature(nextState) };
}

export function isEnding(state: StoryRunState) {
  return state.currentSceneId === "ending";
}

export function triggerChaosEvent(state: StoryRunState): StoryRunState {
  if (state.chaosUsed) return state;
  const random = seededRandom(state.seed + state.choices.length * 313 + state.currentSceneId.length * 17);
  const flags = new Set(state.flags);
  const event = pickWeighted(
    random,
    chaosEvents.map((item) => ({
      item,
      weight:
        10 +
        (item.id === "opportunity-email" && state.traits.luck > 60 ? 7 : 0) +
        (item.id === "random-compliment" && flags.has("sent_unfinished") ? 7 : 0) +
        (item.id === "old-friend-text" && flags.has("ignored_message") ? 5 : 0) +
        (item.id === "notes-app-idea" && state.traits.creativity > 62 ? 6 : 0)
    }))
  );

  const nextState: StoryRunState = {
    ...state,
    traits: applyTraitEffect(state.traits, event.effect),
    flags: mergeFlags(state.flags, event.flags),
    chaosUsed: true,
    chaosEvents: [...state.chaosEvents, event]
  };

  return { ...nextState, storySignature: createStorySignature(nextState) };
}

export function collectMemoryObject(state: StoryRunState, memory: MemoryObject): StoryRunState {
  if (state.memories.some((item) => item.id === memory.id)) return state;
  const nextState: StoryRunState = {
    ...state,
    traits: applyTraitEffect(state.traits, memory.effect),
    memories: [...state.memories, memory]
  };
  return { ...nextState, storySignature: createStorySignature(nextState) };
}

export function completeMiniGame(state: StoryRunState, miniGameId: string): StoryRunState {
  if (state.miniGamesCompleted.includes(miniGameId)) return state;
  const nextState: StoryRunState = {
    ...state,
    traits: applyTraitEffect(state.traits, { consistency: 2, luck: 1, confidence: 1 }),
    miniGamesCompleted: [...state.miniGamesCompleted, miniGameId]
  };
  return { ...nextState, storySignature: createStorySignature(nextState) };
}

function getNextSceneId(state: StoryRunState) {
  const index = baseStoryScenes.findIndex((scene) => scene.id === state.currentSceneId);
  return baseStoryScenes[index + 1]?.id ?? "ending";
}

function recordSceneDiscoveries(state: StoryRunState, sceneId: string) {
  const template = baseStoryScenes.find((scene) => scene.id === sceneId);
  if (!template) return state;

  const rareMoment = getRareMoment(template, state);
  return {
    ...state,
    secretScenesFound: collectSecretScene(state.secretScenesFound, template, state),
    rareMomentsTriggered: rareMoment && !state.rareMomentsTriggered.some((moment) => moment.id === rareMoment.id)
      ? [...state.rareMomentsTriggered, rareMoment]
      : state.rareMomentsTriggered
  };
}

function hydrateScene(template: SceneTemplate, state: StoryRunState): StoryScene {
  const narration = addDelayedCallbacks(selectSceneVariation(template, state), state, template.id);
  const personalized = personalizeScene(
    {
      ...template,
      narration,
      choices: template.choices
    },
    state.profile
  );

  return {
    ...personalized,
    choices: generateChoices(personalized, state.profile, state)
  };
}

function addDelayedCallbacks(narration: string, state: StoryRunState, sceneId: string) {
  const lines = [narration];
  const didNothingCount = countChoiceIds(state, ["do_nothing", "scroll_late", "skip_today", "repeat_pattern"]);

  if (sceneId === "old_pattern" && state.flags.includes("ignored_message")) {
    lines.push("You remember the message you didn’t answer.");
  }
  if (sceneId === "pressure_scene" && didNothingCount >= 2) {
    lines.push("You did nothing again. It still counted.");
  }
  if (sceneId === "return_scene" && state.flags.includes("stayed_consistent")) {
    lines.push("It wasn’t dramatic. It just started to add up.");
  }
  if (sceneId === "someone_notices" && state.flags.includes("sent_unfinished")) {
    lines.push("You sent it before it felt safe.");
  }
  if (sceneId === "final_night" && state.flags.includes("burned_out")) {
    lines.push("You were not failing. You were just tired.");
  }
  if (sceneId === "ending_setup" && state.wildcardsUsed[0]) {
    lines.push(state.wildcardsUsed[0].narration);
  }

  return lines.join(" ");
}

function collectSecretScene(current: SecretSceneRecord[], template: SceneTemplate, state: StoryRunState) {
  const secret = getSecretRecord(template.id, state);
  if (!secret || current.some((scene) => scene.id === secret.id)) return current;
  return [...current, secret];
}

function getSecretRecord(sceneId: string, state: StoryRunState): SecretSceneRecord | null {
  if (sceneId === "old_pattern" && countChoiceIds(state, ["do_nothing", "skip_today", "repeat_pattern", "scroll_late"]) >= 2) {
    return { id: "the_room_gets_smaller", title: "The Room Gets Smaller", unlockedBy: "You kept avoiding the work." };
  }
  if (sceneId === "breakthrough_or_not" && state.flags.includes("stayed_consistent")) {
    return { id: "quiet_breakthrough", title: "The Quiet Breakthrough", unlockedBy: "You stayed with the small work." };
  }
  if (sceneId === "final_night" && state.flags.includes("took_big_risk")) {
    return { id: "night_everything_changes", title: "The Night Everything Changes", unlockedBy: "You took the risk before it felt safe." };
  }
  return null;
}

function getRareMoment(template: SceneTemplate, state: StoryRunState): MovieMoment | undefined {
  if (!template.movieMoment) return undefined;
  const random = seededRandom(state.seed + state.choices.length * 97 + template.id.length);
  if (template.movieMoment.rarity === "secret") return template.movieMoment;
  return random() < 0.08 + state.traits.luck / 1200 ? template.movieMoment : undefined;
}

function countChoiceIds(state: StoryRunState, choiceIds: string[]) {
  const wanted = new Set(choiceIds);
  return state.choices.filter((choice) => wanted.has(choice.choiceId)).length;
}

function mergeFlags(current: StoryFlag[], incoming: StoryFlag[]) {
  return Array.from(new Set([...current, ...incoming]));
}

function appendUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function updateMissedMoments(state: StoryRunState, scene: StoryScene, choice: StoryChoice) {
  const missed = [...(state.missedMoments ?? [])];
  const rejected = scene.choices.filter((item) => item.id !== choice.id).map((item) => item.text).slice(0, 2);
  if (choice.flags?.some((flag) => ["ignored_message", "ignored_opportunity", "did_nothing", "avoided_work"].includes(flag))) {
    missed.push(`In ${scene.title}, you chose "${choice.text}" instead of ${rejected.join(" / ")}.`);
  }
  return missed.slice(-12);
}

function updateEmotionalConsequences(state: StoryRunState, choice: StoryChoice) {
  const hint = choice.consequenceHint || consequenceFromFlags(choice);
  return hint ? [...(state.emotionalConsequences ?? []), hint].slice(-12) : state.emotionalConsequences ?? [];
}

function updateGeneratedTextHistory(state: StoryRunState, scene: StoryScene, choice: StoryChoice) {
  return [...(state.generatedTextHistory ?? []), scene.title, scene.narration, choice.text].slice(-80);
}

function consequenceFromFlags(choice: StoryChoice) {
  if (choice.flags?.includes("ignored_message")) return "The unanswered message stayed in the room.";
  if (choice.flags?.includes("did_nothing")) return "Doing nothing still changed the day.";
  if (choice.flags?.includes("sent_unfinished")) return "The rough version was no longer private.";
  if (choice.flags?.includes("stayed_consistent")) return "The small work started to stack quietly.";
  return "";
}
