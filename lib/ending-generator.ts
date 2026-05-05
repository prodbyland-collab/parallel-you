import { firstName, goalLanguage } from "@/lib/personalization";
import type { EndingResult, StoryRunState } from "@/lib/story-types";

export function generateEnding(state: StoryRunState): EndingResult {
  const name = firstName(state.profile);
  const flags = new Set(state.flags);
  const traits = state.traits;
  const language = goalLanguage(state.profile.goal);

  const identity = pickIdentity(state);
  const outcome = pickOutcome(state);
  const tradeoff = pickTradeoff(state);
  const environment = traits.creativity > 72 ? "studio" : traits.risk > 72 ? "city" : traits.consistency > 70 ? "sunrise" : flags.has("burned_out") ? "void" : "spotlight";
  const mood = flags.has("breakthrough_seen") || traits.consistency > 76 ? "breakthrough" : flags.has("burned_out") ? "tired" : traits.risk > 72 ? "tense" : "hopeful";
  const discoveredCount = getDiscoveredCount(state);

  return {
    title: pickEndingTitle(state),
    identity,
    outcome,
    tradeoff,
    environment,
    mood,
    reflection: buildReflection(name, state, identity, outcome, tradeoff, language.work),
    finalLine: pickFinalLine(state),
    hints: buildHints(state),
    quote: pickShareQuote(state),
    discoveredCount,
    totalMoments: 18,
    memories: state.memories,
    secretScenesFound: state.secretScenesFound,
    rareMomentsTriggered: state.rareMomentsTriggered
  };
}

function pickEndingTitle(state: StoryRunState) {
  if (state.secretScenesFound.some((scene) => scene.id === "secret-night-changes")) return "The Night That Changed Things";
  if (state.chaosEvents.length && state.flags.includes("lucky_event_seen")) return "The Good Wrong Turn";
  if (state.memories.length >= 5) return "The Life You Remembered";
  if (state.traits.consistency > 80) return "The Quiet Breakthrough";
  if (state.flags.includes("burned_out")) return "The Reset After The Fire";
  return "The Life You Chose";
}

function pickIdentity(state: StoryRunState) {
  const { traits, flags } = state;
  if (traits.consistency > 76 && traits.creativity > 64 && traits.social > 52) return "Steady Creator";
  if (traits.consistency > 78 && traits.discipline > 72) return "Quiet Builder";
  if (traits.risk > 76 && flags.includes("took_big_risk")) return "Risk-Taker";
  if (traits.creativity > 78 && flags.includes("burned_out")) return "Tired Creator";
  if (traits.creativity > 72) return "Dreamer";
  if (flags.includes("returned_after_failure") && traits.consistency > 58) return "Late Bloomer";
  if (flags.includes("quit_once") && !flags.includes("returned_after_failure")) return "Drifter";
  if (flags.includes("burned_out")) return "Survivor";
  if (traits.consistency > 58) return "Builder";
  return "Almost There";
}

function pickOutcome(state: StoryRunState) {
  const { traits, flags } = state;
  if (flags.includes("lucky_event_seen") && traits.risk > 62) return "messy success";
  if (flags.includes("breakthrough_seen") && traits.creativity > 62) return "people noticing your work";
  if (traits.consistency > 74) return "steady growth";
  if (flags.includes("returned_after_failure")) return "a late win";
  if (flags.includes("ignored_opportunity") && traits.risk < 50) return "a missed chance";
  if (flags.includes("burned_out")) return "emotional reset";
  return "quiet meaningful progress";
}

function pickTradeoff(state: StoryRunState) {
  const { traits, flags } = state;
  if (flags.includes("isolated_self") || traits.social < 42) return "closeness";
  if (flags.includes("burned_out")) return "peace";
  if (traits.risk > 76) return "stability";
  if (traits.discipline > 76) return "spontaneity";
  if (flags.includes("ignored_opportunity")) return "opportunity";
  return "comfort";
}

function buildReflection(name: string, state: StoryRunState, identity: string, outcome: string, tradeoff: string, work: string) {
  const goal = state.profile.goal;
  const whatIf = state.profile.whatIf;
  const wild = state.wildcardsUsed[0];
  const chaos = state.chaosEvents[0];
  const memoryLine = buildMemoryLine(state);
  const wildLine = wild ? `Then ${wild.title.toLowerCase()} changed the story in a surprising way.` : "No single miracle fixed everything. The small choices did most of the work.";
  const chaosLine = chaos ? `Also, ${chaos.title.toLowerCase()} arrived out of nowhere and made the story more fun.` : "";
  const returnLine = state.flags.includes("returned_after_failure")
    ? `${name} stepped away from the dream once, then came back without needing a big announcement.`
    : `${name} kept hearing the old question, but answered it by doing something instead of only thinking about it.`;

  return [
    `${name} did not become ${identity.toLowerCase()} all at once.`,
    `It happened through small moments: the tired night, the visible ${work}, and the choice to move when this question showed up again: ${whatIf}.`,
    wildLine,
    chaosLine,
    memoryLine,
    returnLine,
    `By the end, ${goal} became more than a wish. It became ${outcome}, and it asked for some ${tradeoff} in return.`
  ].filter(Boolean).join("\n\n");
}

function pickFinalLine(state: StoryRunState) {
  if (state.flags.includes("stayed_consistent")) return "Your life did not change in one big moment. It changed because you kept showing up.";
  if (state.flags.includes("took_big_risk")) return "The future did not open because you felt ready. It opened because you moved anyway.";
  if (state.flags.includes("returned_after_failure")) return "The version of you that came back became stronger than the version that never fell.";
  return "Some endings are not answers. They are a reason to try the next scene differently.";
}

function buildHints(state: StoryRunState) {
  const hints = [
    "There is a version where you ask for help earlier.",
    "There is a moment where one risky yes changes everything.",
    "There is a path where consistency pays off later.",
    "There is a calmer ending hidden behind rest instead of pressure.",
    "There is a lucky scene that is hard to find."
  ];

  if (!state.flags.includes("took_big_risk")) return [hints[1], hints[2], hints[4]];
  if (!state.flags.includes("asked_for_help")) return [hints[0], hints[3], hints[4]];
  if (!state.flags.includes("stayed_consistent")) return [hints[2], hints[1], hints[3]];
  return [hints[4], hints[3], hints[0]];
}

function buildMemoryLine(state: StoryRunState) {
  if (!state.memories.length) return "No memory objects reached the ending, so the final scene felt a little quieter.";
  const names = state.memories.slice(0, 3).map((memory) => memory.name.toLowerCase()).join(", ");
  const extra = state.memories.length > 3 ? `, and ${state.memories.length - 3} more small object${state.memories.length - 3 === 1 ? "" : "s"}` : "";
  return `The ending remembered the ${names}${extra}. Small things can carry a lot of feeling.`;
}

function pickShareQuote(state: StoryRunState) {
  const memoryQuote = state.memories[state.memories.length - 1]?.quote;
  if (memoryQuote) return memoryQuote;
  if (state.chaosEvents.length) return "The wrong turn helped me.";
  if (state.secretScenesFound.length) return "I found a scene I almost missed.";
  return pickFinalLine(state);
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
