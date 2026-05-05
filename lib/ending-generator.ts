import { firstName, goalLanguage } from "@/lib/personalization";
import { createStorySignature } from "@/lib/story-signature";
import type { EndingResult, StoryRunState } from "@/lib/story-types";

export function generateEnding(state: StoryRunState): EndingResult {
  const name = firstName(state.profile);
  const identity = pickIdentity(state);
  const outcome = pickOutcome(state);
  const tradeoff = pickTradeoff(state);
  const memoryCallback = buildMemoryCallback(state);
  const finalObject = pickFinalObject(state);
  const finalLine = pickFinalLine(state);
  const signature = state.storySignature || createStorySignature(state);

  return {
    title: pickEndingTitle(state, identity),
    identity,
    outcome,
    tradeoff,
    reflection: buildReflection(name, state, identity, outcome, tradeoff, memoryCallback, finalObject),
    finalLine,
    finalObject,
    hints: buildHints(state),
    quote: finalLine,
    discoveredCount: getDiscoveredCount(state),
    totalMoments: 18,
    memories: state.memories,
    secretScenesFound: state.secretScenesFound,
    rareMomentsTriggered: state.rareMomentsTriggered,
    signature,
    isRepeatShape: state.replayCount > 0,
    environment: pickEnvironment(state),
    mood: pickMood(state)
  };
}

function pickIdentity(state: StoryRunState) {
  if (countChoiceIds(state, ["do_nothing", "skip_today", "repeat_pattern", "scroll_late"]) >= 3) return "The One Who Kept Leaving";
  if (state.flags.includes("returned_after_failure")) return "The One Who Came Back";
  if (state.flags.includes("sent_unfinished")) return "The Person Who Finally Sent It";
  if (countChoiceIds(state, ["start_over_again", "make_big_return"]) >= 2) return "The Restless Starter";
  if (state.flags.includes("almost_finished") && !state.flags.includes("finished_badly")) return "The Almost Finisher";
  if (state.traits.consistency > 72) return "The Quiet Builder";
  if (state.flags.includes("burned_out") && state.traits.confidence > 45) return "The Tired Winner";
  if (state.profile.age > 24 && state.flags.includes("stayed_consistent")) return "The Late Beginner";
  return "The Unfinished Version";
}

function pickOutcome(state: StoryRunState) {
  const language = goalLanguage(state.profile.goal);
  if (state.flags.includes("someone_noticed")) return `one person remembered the ${language.work}`;
  if (state.flags.includes("lucky_event_seen")) return "a door opened at the strangest time";
  if (state.flags.includes("finished_badly")) return `the ${language.work} finally existed outside your head`;
  if (state.traits.consistency > 74) return "the small days started to add up";
  if (state.flags.includes("ignored_opportunity")) return "one chance passed, and another kind of honesty stayed";
  return "the story stayed unfinished, but not empty";
}

function pickTradeoff(state: StoryRunState) {
  if (state.flags.includes("ignored_message") || state.traits.social < 42) return "some messages stayed unanswered";
  if (state.flags.includes("burned_out")) return "your body asked for more than ambition";
  if (state.flags.includes("took_big_risk")) return "peace got interrupted";
  if (state.flags.includes("did_nothing")) return "time moved even when you didn't";
  return "comfort became harder to trust";
}

function pickEndingTitle(state: StoryRunState, identity: string) {
  if (state.replayCount > 0) return "The Version That Changed";
  if (state.secretScenesFound.some((scene) => scene.id === "night_everything_changes")) return "The Night Everything Changes";
  if (state.secretScenesFound.some((scene) => scene.id === "quiet_breakthrough")) return "The Quiet Breakthrough";
  if (state.flags.includes("ignored_message")) return "The Message You Remembered";
  if (state.flags.includes("someone_noticed")) return "When One Person Saw It";
  return identity;
}

function buildReflection(name: string, state: StoryRunState, identity: string, outcome: string, tradeoff: string, memoryCallback: string, finalObject: string) {
  const past = state.profile.doneSoFar || "You had already lived some of this before the story started.";
  const goal = state.profile.goals || state.profile.goal || "You wanted something to feel real.";
  const lines = [
    `${name} started in a normal room.`,
    past,
    `The goal was simple when you said it: ${goal}`,
    "Then real life did what it does. Messages waited. Sleep got weird. Small wins looked too small.",
    memoryCallback,
    `By the end, you became ${identity}.`,
    `What happened: ${outcome}.`,
    `What it cost: ${tradeoff}.`,
    `The final scene keeps one thing in frame: the ${finalObject}.`
  ];

  if (state.flags.includes("ignored_message")) lines.splice(5, 0, "You remember the message you didn't answer.");
  if (countChoiceIds(state, ["do_nothing", "skip_today", "repeat_pattern", "scroll_late"]) >= 2) lines.splice(5, 0, "You did nothing more than once. It still shaped the room.");
  if (state.flags.includes("sent_unfinished")) lines.splice(5, 0, "You sent it before it felt safe.");
  if (state.flags.includes("stayed_consistent")) lines.splice(5, 0, "It wasn't dramatic. It just started to add up.");
  if (state.replayCount > 0) lines.push("You were here again. The ending noticed.");

  return lines.join("\n\n");
}

function buildMemoryCallback(state: StoryRunState) {
  if (!state.memories.length) return "No object came with you. The ending feels cleaner, and a little colder.";
  const last = state.memories[state.memories.length - 1];
  return `The ${last.name.toLowerCase()} comes back at the end. Not because it is special. Because you remember where it was.`;
}

function pickFinalLine(state: StoryRunState) {
  if (state.flags.includes("returned_after_failure")) return "You left. Then you came back.";
  if (state.flags.includes("finished_badly")) return "It was not perfect. It was outside of you.";
  if (state.flags.includes("ignored_message")) return "One unanswered message stayed in the room.";
  if (state.flags.includes("stayed_consistent")) return "Nobody noticed every day. You did.";
  return "This was one version of your life.";
}

function pickFinalObject(state: StoryRunState) {
  const memory = state.memories[state.memories.length - 1];
  if (memory) return memory.name.toLowerCase();
  if (state.flags.includes("ignored_message")) return "phone";
  if (state.flags.includes("burned_out")) return "alarm clock";
  if (state.flags.includes("sent_unfinished")) return "open laptop";
  return "coffee cup";
}

function pickEnvironment(state: StoryRunState) {
  if (state.flags.includes("burned_out")) return "bedroom";
  if (state.flags.includes("someone_noticed")) return "city";
  if (state.traits.consistency > 72) return "sunrise";
  if (state.traits.creativity > 70) return "studio";
  return "bedroom";
}

function pickMood(state: StoryRunState) {
  if (state.flags.includes("burned_out")) return "tired";
  if (state.flags.includes("ignored_message")) return "tense";
  if (state.flags.includes("someone_noticed") || state.flags.includes("stayed_consistent")) return "hopeful";
  return "focused";
}

function buildHints(state: StoryRunState) {
  const hints = [
    "There is a version where you answer the message.",
    "There is a path where one rough send changes the room.",
    "There is a quieter ending if you come back sooner.",
    "There is a scene that only appears after repeated avoidance.",
    "There is a version where one person noticing is enough."
  ];

  if (!state.flags.includes("sent_unfinished")) return [hints[1], hints[4], hints[2]];
  if (!state.flags.includes("ignored_message")) return [hints[0], hints[3], hints[2]];
  if (!state.flags.includes("returned_after_failure")) return [hints[2], hints[3], hints[4]];
  return [hints[3], hints[0], hints[4]];
}

function getDiscoveredCount(state: StoryRunState) {
  const unique = new Set<string>();
  state.memories.forEach((memory) => unique.add(`memory:${memory.id}`));
  state.secretScenesFound.forEach((scene) => unique.add(`secret:${scene.id}`));
  state.rareMomentsTriggered.forEach((moment) => unique.add(`rare:${moment.id}`));
  state.chaosEvents.forEach((event) => unique.add(`chaos:${event.id}`));
  state.wildcardsUsed.forEach((event) => unique.add(`wild:${event.id}`));
  state.miniGamesCompleted.forEach((miniGame) => unique.add(`mini:${miniGame}`));
  return Math.min(18, unique.size);
}

function countChoiceIds(state: StoryRunState, choiceIds: string[]) {
  const wanted = new Set(choiceIds);
  return state.choices.filter((choice) => wanted.has(choice.choiceId)).length;
}
