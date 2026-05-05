import { isTextTooSimilar } from "@/lib/anti-repeat";
import { callAIWriter } from "@/lib/ai-writer";
import { generateEnding } from "@/lib/ending-generator";
import type { StoryState } from "@/lib/story-state";
import type { EndingResult, StoryRunState } from "@/lib/story-types";

type AdaptiveEndingDraft = {
  title: string;
  identity: string;
  whatHappened: string;
  whatItCost: string;
  memoryCallback: string;
  finalScene: string;
  finalLine: string;
};

export async function generateAdaptiveEnding(storyState: StoryState, runState: StoryRunState, previousEndings: EndingResult[] = []): Promise<EndingResult> {
  const fallback = generateEnding(runState);
  const raw = await callAIWriter(buildEndingPrompt(storyState, previousEndings));
  if (!raw) return fallback;
  try {
    const draft = normalizeDraft(JSON.parse(raw), storyState);
    const previousText = previousEndings.flatMap((ending) => [ending.title, ending.finalLine, ending.reflection]);
    if (isTextTooSimilar(`${draft.title} ${draft.finalLine}`, [...storyState.shownTexts, ...previousText])) return fallback;
    return {
      ...fallback,
      title: draft.title,
      identity: draft.identity,
      outcome: draft.whatHappened,
      tradeoff: draft.whatItCost,
      reflection: [draft.whatHappened, draft.whatItCost, draft.memoryCallback, draft.finalScene].join("\n\n"),
      finalLine: draft.finalLine,
      finalObject: draft.finalScene,
      quote: draft.finalLine
    };
  } catch {
    return fallback;
  }
}

function buildEndingPrompt(storyState: StoryState, previousEndings: EndingResult[]) {
  return `
Generate the ending for DIRECT YOUR LIFE.

Rules:
Write like real life.
Short lines.
No motivational tone.
No fake deep quotes.
No generic self-help.
No explaining emotions.
Show through action.
No good/bad labels.
No repeated endings.

Base it on:
- profile: ${storyState.profile.doneSoFar} / ${storyState.profile.goals || storyState.profile.goal}
- full choice history: ${storyState.choiceHistory.map((choice) => choice.choiceText).join(" -> ")}
- repeated patterns: ${storyState.repeatedPatterns.join(", ") || "none"}
- strongest threads: ${storyState.consequenceThreads.map((thread) => `${thread.theme}:${thread.status}:${thread.createdBy}`).join(" | ") || "none"}
- unresolved threads: ${storyState.consequenceThreads.filter((thread) => thread.status === "open").map((thread) => thread.theme).join(", ") || "none"}
- memory objects: ${storyState.memoryObjects.map((memory) => memory.name).join(", ") || "none"}
- ending seeds: ${storyState.endingSeeds.join(" | ") || "none"}
- real-life callback details: ${storyState.realLifeExamples.callbackDetails.join(" | ")}

Avoid previous endings:
${previousEndings.map((ending) => `${ending.title}: ${ending.finalLine}`).join("\n") || "none"}

Ending must mention one concrete object or moment from the run:
the unread message, unfinished file, cold coffee, clean desk, exported track, blank page, shoes by the door, or laptop left open.

Return strict JSON only:
{
  "title": "short title",
  "identity": "The ...",
  "whatHappened": "plain specific outcome",
  "whatItCost": "plain specific tradeoff",
  "memoryCallback": "callback to one object or missed moment",
  "finalScene": "ordinary final object or place",
  "finalLine": "one quiet final line"
}
`;
}

function normalizeDraft(value: Partial<AdaptiveEndingDraft>, storyState: StoryState): AdaptiveEndingDraft {
  const object = storyState.realLifeExamples.callbackDetails[0] ?? "the laptop left open";
  return {
    title: value.title || "The Ordinary Version",
    identity: value.identity || "The One Who Kept Going Anyway",
    whatHappened: value.whatHappened || "One small pattern finally told the truth.",
    whatItCost: value.whatItCost || "Something stayed unfinished on purpose.",
    memoryCallback: value.memoryCallback || `The ending keeps ${object} in the room.`,
    finalScene: value.finalScene || object,
    finalLine: value.finalLine || "The day did not change much. You did."
  };
}
