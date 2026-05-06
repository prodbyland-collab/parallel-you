import { getButterflies } from "@/lib/butterfly-engine";
import type { StoryRunState } from "@/lib/story-types";

export type EmotionalPattern =
  | "keeps_avoiding"
  | "keeps_returning"
  | "avoids_honesty"
  | "chooses_connection"
  | "isolates_self"
  | "starts_not_finishes"
  | "perfectionism_loop"
  | "risks_without_grounding"
  | "consistent_small_actions"
  | "waits_for_permission"
  | "does_nothing_often";

export function detectPatterns(state: StoryRunState): EmotionalPattern[] {
  const choices = state.choices.map((choice) => choice.choiceText.toLowerCase());
  const butterflies = getButterflies(state);
  const patterns = new Set<EmotionalPattern>();

  const avoidanceCount = butterflies.filter((effect) => effect.theme === "avoidance").length;
  const returningCount = butterflies.filter((effect) => effect.theme === "returning").length;
  const perfectionismCount = butterflies.filter((effect) => effect.theme === "perfectionism").length;
  const connectionCount = butterflies.filter((effect) => effect.theme === "connection").length;
  const isolationCount = butterflies.filter((effect) => effect.theme === "isolation").length;
  const riskCount = butterflies.filter((effect) => effect.theme === "risk").length;
  const consistencyCount = butterflies.filter((effect) => effect.theme === "consistency").length;

  if (avoidanceCount >= 3 || choices.filter((choice) => /ignore|tomorrow|later|close|nothing/.test(choice)).length >= 3) {
    patterns.add("keeps_avoiding");
  }

  if (returningCount >= 2 || choices.filter((choice) => /come back|return|again/.test(choice)).length >= 2) {
    patterns.add("keeps_returning");
  }

  if (choices.filter((choice) => /truth|honest|tell/.test(choice)).length === 0 && avoidanceCount >= 2) {
    patterns.add("avoids_honesty");
  }

  if (connectionCount >= 2) {
    patterns.add("chooses_connection");
  }

  if (isolationCount >= 2 || choices.filter((choice) => /pretend|hide|alone/.test(choice)).length >= 2) {
    patterns.add("isolates_self");
  }

  if (perfectionismCount >= 2 || choices.filter((choice) => /start over|new version|again/.test(choice)).length >= 3) {
    patterns.add("starts_not_finishes");
    patterns.add("perfectionism_loop");
  }

  if (riskCount >= 3 && consistencyCount <= 1) {
    patterns.add("risks_without_grounding");
  }

  if (consistencyCount >= 3) {
    patterns.add("consistent_small_actions");
  }

  if (choices.filter((choice) => /ready|permission|safe/.test(choice)).length >= 2) {
    patterns.add("waits_for_permission");
  }

  if (choices.filter((choice) => /do nothing/.test(choice)).length >= 2) {
    patterns.add("does_nothing_often");
  }

  return Array.from(patterns);
}

export function strongestPattern(state: StoryRunState): EmotionalPattern | null {
  const patterns = detectPatterns(state);
  return patterns[0] ?? null;
}

export function patternInsight(pattern: EmotionalPattern) {
  return ({
    keeps_avoiding: "You kept making the room smaller to avoid the hard thing.",
    keeps_returning: "Coming back mattered more than getting it perfect.",
    avoids_honesty: "You protected yourself by hiding the real answer.",
    chooses_connection: "One honest connection changed the direction quietly.",
    isolates_self: "You confused silence with safety.",
    starts_not_finishes: "You were not afraid of starting. You were afraid of finishing where people could see it.",
    perfectionism_loop: "Perfection kept the work invisible.",
    risks_without_grounding: "You chased movement harder than stability.",
    consistent_small_actions: "The small things kept adding up after you stopped looking for dramatic proof.",
    waits_for_permission: "You waited for a version of yourself that never arrived.",
    does_nothing_often: "Doing nothing still shaped the story."
  })[pattern];
}
