"use client";

import type { EndingResult, StoryRunState } from "@/lib/story-types";

export const STORY_STATE_KEY = "direct-your-life:story-state";
export const STORY_ENDING_KEY = "direct-your-life:ending";

export function saveStoryState(state: StoryRunState) {
  localStorage.setItem(STORY_STATE_KEY, JSON.stringify(state));
}

export function loadStoryState() {
  const raw = localStorage.getItem(STORY_STATE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoryRunState;
    return {
      ...parsed,
      chaosUsed: parsed.chaosUsed ?? false,
      chaosEvents: parsed.chaosEvents ?? [],
      memories: parsed.memories ?? [],
      secretScenesFound: parsed.secretScenesFound ?? [],
      miniGamesCompleted: parsed.miniGamesCompleted ?? [],
      rareMomentsTriggered: parsed.rareMomentsTriggered ?? []
    } satisfies StoryRunState;
  } catch {
    return null;
  }
}

export function clearStoryState() {
  localStorage.removeItem(STORY_STATE_KEY);
  localStorage.removeItem(STORY_ENDING_KEY);
}

export function saveEnding(ending: EndingResult) {
  localStorage.setItem(STORY_ENDING_KEY, JSON.stringify(ending));
}

export function loadEnding() {
  const raw = localStorage.getItem(STORY_ENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EndingResult;
  } catch {
    return null;
  }
}
