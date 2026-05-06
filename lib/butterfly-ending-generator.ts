import { getButterflies, getStrongestButterfly } from "@/lib/butterfly-engine";
import { patternInsight, strongestPattern } from "@/lib/pattern-engine";
import type { EndingResult, StoryEnvironment, StoryMood, StoryRunState } from "@/lib/story-types";

export function generateButterflyEnding(state: StoryRunState): EndingResult {
  const strongest = getStrongestButterfly(state);
  const pattern = strongestPattern(state);
  const butterflies = getButterflies(state);

  const identity = strongest?.endingWeight.identity?.[0] || "The Unfinished Version";
  const lesson = strongest?.endingWeight.lesson?.[0] || (pattern ? patternInsight(pattern) : "Something small changed the direction.");
  const cost = strongest?.endingWeight.cost?.[0] || "certainty";
  const finalObject = strongest?.endingWeight.finalObject?.[0] || "unfinished notebook";

  const resolved = butterflies.find((effect) => effect.status === "resolved");
  const unresolved = butterflies.find((effect) => effect.status === "ignored" || effect.status === "active");

  const reflection = [
    resolved ? `You changed something when you ${resolved.originChoiceText.toLowerCase()}.` : null,
    unresolved ? unresolved.delayedEffect : null,
    pattern ? patternInsight(pattern) : null
  ].filter(Boolean).join("\n\n");

  const finalLine = finalLineForPattern(pattern);

  return {
    title: identity,
    identity,
    outcome: strongest?.emotionalMeaning || "The story changed quietly.",
    tradeoff: `It cost you ${cost}.`,
    reflection,
    finalLine,
    finalObject,
    hints: [lesson],
    quote: finalLine,
    discoveredCount: state.memories.length,
    totalMoments: state.sceneHistory.length,
    memories: state.memories,
    secretScenesFound: state.secretScenesFound,
    rareMomentsTriggered: state.rareMomentsTriggered,
    signature: `${identity}_${pattern}_${state.storySignature}`,
    isRepeatShape: false,
    environment: endingEnvironment(pattern),
    mood: endingMood(pattern)
  };
}

function finalLineForPattern(pattern: ReturnType<typeof strongestPattern>) {
  switch (pattern) {
    case "keeps_avoiding":
      return "The message stayed unread. So did the part of you that wanted to answer.";
    case "starts_not_finishes":
      return "You were not afraid of starting. You were afraid of being seen finishing.";
    case "consistent_small_actions":
      return "Nothing changed all at once. The proof just got harder to ignore.";
    case "chooses_connection":
      return "One honest reply changed more than the perfect plan.";
    case "keeps_returning":
      return "Coming back counted more than leaving ruined.";
    case "waits_for_permission":
      return "You kept waiting for the right version of yourself. It never arrived.";
    default:
      return "Some lives change quietly first.";
  }
}

function endingEnvironment(pattern: ReturnType<typeof strongestPattern>): StoryEnvironment {
  switch (pattern) {
    case "keeps_avoiding":
    case "isolates_self":
      return "bedroom";
    case "consistent_small_actions":
    case "keeps_returning":
      return "sunrise";
    case "chooses_connection":
      return "city";
    case "starts_not_finishes":
      return "studio";
    default:
      return "spotlight";
  }
}

function endingMood(pattern: ReturnType<typeof strongestPattern>): StoryMood {
  switch (pattern) {
    case "keeps_avoiding":
    case "isolates_self":
      return "lost";
    case "consistent_small_actions":
    case "keeps_returning":
      return "breakthrough";
    case "chooses_connection":
      return "hopeful";
    default:
      return "focused";
  }
}
