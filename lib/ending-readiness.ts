import type { StoryRunState } from "@/lib/story-types";

export function calculateEndingReadiness(storyState: StoryRunState) {
  const scenes = storyState.sceneHistory.length;
  if (scenes < 6) return 0;
  if (scenes >= 25) return 100;

  let score = 0;
  score += Math.min(28, storyState.choices.length * 3);
  score += storyState.repeatedPatterns.length ? 18 : 0;
  score += storyState.consequenceThreads.some((thread) => thread.status !== "open") ? 18 : 0;
  score += storyState.consequenceThreads.some((thread) => thread.status === "open") ? 8 : 0;
  score += storyState.memories.length ? 14 : 0;
  score += storyState.endingSeeds.length ? 18 : 0;
  score += storyState.turningPoints.length ? 16 : 0;
  score += storyState.traits.regret > 60 || storyState.traits.momentum > 75 ? 10 : 0;
  if (scenes >= 10) score += 14;
  if (scenes >= 18) score += 22;
  return Math.max(0, Math.min(100, score));
}
