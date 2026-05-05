import { buildRewritePrompt } from "@/lib/ai-prompts";
import { callAIWriter } from "@/lib/ai-writer";
import { isTooSimilar } from "@/lib/ai-safety";
import type { StoryRunState } from "@/lib/story-types";

export const isTextTooSimilar = isTooSimilar;

export function filterRepeatedChoices<T extends { text: string }>(choices: T[], previousChoices: string[]) {
  return choices.filter((choice) => !isTextTooSimilar(choice.text, previousChoices));
}

export function buildAvoidList(storyState: StoryRunState, previousRunText: string[] = []) {
  return {
    sceneTitles: storyState.sceneHistory,
    choiceTexts: [...storyState.recentChoiceTexts, ...storyState.choices.map((choice) => choice.choiceText)],
    phrases: [...storyState.generatedTextHistory, ...previousRunText].slice(-120)
  };
}

export async function rewriteIfTooSimilar<T>(value: T, extractText: (value: T) => string, previousTexts: string[], normalize: (raw: unknown) => T | null) {
  if (!isTextTooSimilar(extractText(value), previousTexts)) return value;
  const raw = await callAIWriter(buildRewritePrompt(JSON.stringify(value), previousTexts));
  if (!raw) return value;
  try {
    return normalize(JSON.parse(raw)) ?? value;
  } catch {
    return value;
  }
}
