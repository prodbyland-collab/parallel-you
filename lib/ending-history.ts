"use client";

import type { EndingResult, PlayerProfile, StoryRunState } from "@/lib/story-types";

const ENDING_HISTORY_KEY = "direct-your-life-ending-history";

export function getEndingHistory(): EndingResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENDING_HISTORY_KEY);
    return raw ? JSON.parse(raw) as EndingResult[] : [];
  } catch {
    return [];
  }
}

export function saveEndingHistory(ending: EndingResult) {
  if (typeof window === "undefined") return;
  const history = [ending, ...getEndingHistory()].slice(0, 12);
  window.localStorage.setItem(ENDING_HISTORY_KEY, JSON.stringify(history));
}

export function isEndingTooSimilar(newEnding: EndingResult, previousEndings = getEndingHistory()) {
  return previousEndings.some((ending) => {
    const checks = [
      ending.title === newEnding.title,
      ending.identity === newEnding.identity,
      ending.quote === newEnding.quote,
      ending.finalLine === newEnding.finalLine,
      ending.finalObject === newEnding.finalObject
    ];
    return checks.filter(Boolean).length >= 3;
  });
}

export function regenerateEndingVariant(ending: EndingResult, profile: PlayerProfile, state: StoryRunState): EndingResult {
  const name = profile.name || "you";
  const object = state.memories[state.memories.length - 1]?.name.toLowerCase() ?? pickObject(state);
  const title = pickTitleVariant(ending, state);
  const finalLine = pickLineVariant(state);

  return {
    ...ending,
    title,
    finalObject: object,
    quote: finalLine,
    finalLine,
    reflection: `${ending.reflection}\n\nThis version does not end the same way. ${name} notices the ${object}, and the room feels slightly different.`
  };
}

function pickTitleVariant(ending: EndingResult, state: StoryRunState) {
  const options = [
    "The Version That Stayed",
    "The Small Return",
    "The Almost Morning",
    "The Room After",
    "The Part You Kept"
  ];
  return options[(state.seed + ending.title.length + state.choices.length) % options.length];
}

function pickLineVariant(state: StoryRunState) {
  const lines = [
    "You did not become new. You became honest.",
    "The day stayed normal. You did not.",
    "You left less of yourself behind this time.",
    "It was still hard. You still came back.",
    "The small thing was the whole story."
  ];
  return lines[(state.seed + state.flags.length + state.memories.length) % lines.length];
}

function pickObject(state: StoryRunState) {
  const objects = ["phone", "notebook", "coffee cup", "open laptop", "alarm clock"];
  return objects[(state.seed + state.choices.length) % objects.length];
}
