"use client";

import type { EndingResult, StoryRunState } from "@/lib/story-types";
import { areSignaturesSimilar } from "@/lib/story-signature";

export const STORY_STATE_KEY = "direct-your-life:story-state";
export const STORY_ENDING_KEY = "direct-your-life:ending";
export const STORY_SIGNATURES_KEY = "direct-your-life:story-signatures";
export const STORY_TEXT_HISTORY_KEY = "direct-your-life:story-text-history";

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
      recentChoiceTexts: parsed.recentChoiceTexts ?? parsed.choices?.slice(-12).map((choice) => choice.choiceText) ?? [],
      chaosUsed: parsed.chaosUsed ?? false,
      chaosEvents: parsed.chaosEvents ?? [],
      memories: parsed.memories ?? [],
      secretScenesFound: parsed.secretScenesFound ?? [],
      miniGamesCompleted: parsed.miniGamesCompleted ?? [],
      rareMomentsTriggered: parsed.rareMomentsTriggered ?? [],
      missedMoments: parsed.missedMoments ?? [],
      relationshipMoments: parsed.relationshipMoments ?? [],
      emotionalConsequences: parsed.emotionalConsequences ?? [],
      generatedTextHistory: parsed.generatedTextHistory ?? [],
      storySignature: parsed.storySignature ?? "",
      replayCount: parsed.replayCount ?? getStorySignatures().length
    } satisfies StoryRunState;
  } catch {
    return null;
  }
}

export function getStorySignatures() {
  const raw = localStorage.getItem(STORY_SIGNATURES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function hasSimilarStorySignature(signature: string) {
  return getStorySignatures().some((saved) => areSignaturesSimilar(saved, signature));
}

export function saveStorySignature(signature: string) {
  if (!signature) return;
  const signatures = getStorySignatures();
  const next = [signature, ...signatures.filter((saved) => saved !== signature)].slice(0, 12);
  localStorage.setItem(STORY_SIGNATURES_KEY, JSON.stringify(next));
}

export function getStoryTextHistory() {
  const raw = localStorage.getItem(STORY_TEXT_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveStoryTextHistory(lines: string[]) {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (!cleaned.length) return;
  const previous = getStoryTextHistory();
  const next = Array.from(new Set([...cleaned, ...previous])).slice(0, 220);
  localStorage.setItem(STORY_TEXT_HISTORY_KEY, JSON.stringify(next));
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
