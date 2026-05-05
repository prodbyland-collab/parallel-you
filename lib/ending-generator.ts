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

  return {
    title: "The Life You Directed",
    identity,
    outcome,
    tradeoff,
    environment,
    mood,
    reflection: buildReflection(name, state, identity, outcome, tradeoff, language.work),
    finalLine: pickFinalLine(state),
    hints: buildHints(state)
  };
}

function pickIdentity(state: StoryRunState) {
  const { traits, flags } = state;
  if (traits.consistency > 76 && traits.creativity > 64 && traits.social > 52) return "Balanced Creator";
  if (traits.consistency > 78 && traits.discipline > 72) return "Quiet Winner";
  if (traits.risk > 76 && flags.includes("took_big_risk")) return "Risk-Taker";
  if (traits.creativity > 78 && flags.includes("burned_out")) return "Burned Genius";
  if (traits.creativity > 72) return "Dreamer";
  if (flags.includes("returned_after_failure") && traits.consistency > 58) return "Late Bloomer";
  if (flags.includes("quit_once") && !flags.includes("returned_after_failure")) return "Drifter";
  if (flags.includes("burned_out")) return "Survivor";
  if (traits.consistency > 58) return "Builder";
  return "Almost There";
}

function pickOutcome(state: StoryRunState) {
  const { traits, flags } = state;
  if (flags.includes("lucky_event_seen") && traits.risk > 62) return "chaotic success";
  if (flags.includes("breakthrough_seen") && traits.creativity > 62) return "creative recognition";
  if (traits.consistency > 74) return "stable growth";
  if (flags.includes("returned_after_failure")) return "late breakthrough";
  if (flags.includes("ignored_opportunity") && traits.risk < 50) return "missed potential";
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
  const wildLine = wild ? `Then ${wild.title.toLowerCase()} changed the lighting of the story.` : "No single miracle saved the story. The small scenes did most of the work.";
  const returnLine = state.flags.includes("returned_after_failure")
    ? `${name} quit a version of the dream once, then came back without needing applause.`
    : `${name} kept hearing the old question, but answered it through motion instead of explanation.`;

  return [
    `${name} did not become ${identity.toLowerCase()} in one clean montage.`,
    `It happened through small scenes: the tired night, the visible ${work}, the choice to move when ${whatIf} tried to become the whole script.`,
    wildLine,
    returnLine,
    `By the end, ${goal} had become more than a wish. It had become ${outcome}, and it cost ${tradeoff}.`
  ].join("\n\n");
}

function pickFinalLine(state: StoryRunState) {
  if (state.flags.includes("stayed_consistent")) return "Your life did not change in one moment. It changed in the moments you almost ignored.";
  if (state.flags.includes("took_big_risk")) return "The future did not open because you were ready. It opened because you moved.";
  if (state.flags.includes("returned_after_failure")) return "The version of you that came back became stronger than the version that never fell.";
  return "Some endings are not answers. They are invitations to direct the next scene differently.";
}

function buildHints(state: StoryRunState) {
  const hints = [
    "There was a version where you asked for help earlier.",
    "There was a moment where one risky yes changed the entire third act.",
    "There was a path where consistency paid off much later than expected.",
    "There was a quieter ending hidden behind rest instead of force.",
    "There was a lucky scene you almost never see."
  ];

  if (!state.flags.includes("took_big_risk")) return [hints[1], hints[2], hints[4]];
  if (!state.flags.includes("asked_for_help")) return [hints[0], hints[3], hints[4]];
  if (!state.flags.includes("stayed_consistent")) return [hints[2], hints[1], hints[3]];
  return [hints[4], hints[3], hints[0]];
}
