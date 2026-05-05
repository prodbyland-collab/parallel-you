import { buildConsequencePrompt, buildEndingPrompt, buildRewritePrompt, buildScenePrompt } from "@/lib/ai-prompts";
import { cleanAIText, isTooSimilar, sanitizeLines, scoreHumanWriting } from "@/lib/ai-safety";
import { generateEnding } from "@/lib/ending-generator";
import { seededRandom } from "@/lib/random-engine";
import type { StoryMemory } from "@/lib/story-memory";
import type { AIConsequenceDraft, AIEndingDraft, AISceneDraft, StoryChoice, StoryScene } from "@/lib/story-types";

type AIProvider = "openai" | "generic" | "none";
const CLIENT_AI_TIMEOUT_MS = 9000;
const SERVER_AI_TIMEOUT_MS = 14000;

export async function callAIWriter(prompt: string) {
  if (typeof window !== "undefined") {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_AI_TIMEOUT_MS);
    try {
      const response = await fetch("/api/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });
      if (!response.ok) return null;
      const data = await response.json() as { text?: string };
      return data.text ?? null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const provider = getProvider();
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  if (provider === "none" || !key) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SERVER_AI_TIMEOUT_MS);
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          temperature: 1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a severe editor for grounded interactive fiction. Write connected scenes with plainspoken wit, concrete details, and strict cause-and-effect. Strict JSON only." },
            { role: "user", content: prompt }
          ]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) return null;
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? null;
    }

    const endpoint = process.env.AI_PROVIDER_URL;
    clearTimeout(timeout);
    if (!endpoint) return null;
    const genericController = new AbortController();
    const genericTimeout = setTimeout(() => genericController.abort(), SERVER_AI_TIMEOUT_MS);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ model, prompt }),
      signal: genericController.signal
    });
    clearTimeout(genericTimeout);
    if (!response.ok) return null;
    const data = await response.json() as { text?: string; content?: string };
    return data.text ?? data.content ?? null;
  } catch {
    return null;
  }
}

export async function generateNextSceneWithAI(memory: StoryMemory, fallbackScene: StoryScene): Promise<StoryScene> {
  const prompt = buildScenePrompt(memory);
  const draft = await askForJson<AISceneDraft>(prompt, (value) => normalizeSceneDraft(value, memory, fallbackScene));
  const checkedDraft = draft && (hasRepeatedSceneText(draft, memory) || scoreHumanWriting([draft.sceneTitle, ...draft.narrationLines, ...draft.choices.map((choice) => choice.text)]) < 2)
    ? await askForJson<AISceneDraft>(`${prompt}\n\n${buildRewritePrompt(JSON.stringify(draft), memory.previousGeneratedText)}`, (value) => normalizeSceneDraft(value, memory, fallbackScene))
    : draft;

  if (!checkedDraft) return fallbackScene;

  const narration = checkedDraft.narrationLines.join(" ");
  const aiScene: StoryScene = {
    ...fallbackScene,
    id: fallbackScene.id,
    title: checkedDraft.sceneTitle,
    narration,
    environment: checkedDraft.environment,
    mood: checkedDraft.mood,
    firstPersonCut: checkedDraft.firstPersonCutType ? {
      id: `ai-cut-${fallbackScene.id}`,
      title: checkedDraft.narrationLines[0] ?? fallbackScene.title,
      detail: checkedDraft.narrationLines[1] ?? "The moment stays quiet.",
      kind: checkedDraft.firstPersonCutType
    } : fallbackScene.firstPersonCut,
    choices: checkedDraft.choices.map((choice, index) => ({
      id: `ai_${fallbackScene.id}_${index}`,
      text: choice.text,
      effect: choice.effect,
      flags: choice.flags,
      nextScene: fallbackScene.choices[index]?.nextScene,
      consequenceHint: choice.consequenceHint,
      delayedCallbackPossible: choice.delayedCallbackPossible
    }))
  };

  return aiScene;
}

export async function generateConsequenceWithAI(choice: StoryChoice, memory: StoryMemory): Promise<AIConsequenceDraft> {
  const fallback = localConsequence(choice, memory);
  const draft = await askForJson<AIConsequenceDraft>(buildConsequencePrompt(choice, memory), normalizeConsequenceDraft);
  if (!draft) return fallback;
  return isTooSimilar(draft.consequenceLines.join(" "), memory.previousGeneratedText) || scoreHumanWriting(draft.consequenceLines) < 1 ? fallback : draft;
}

export async function generateEndingWithAI(memory: StoryMemory, fallbackState: Parameters<typeof generateEnding>[0]) {
  const fallback = generateEnding(fallbackState);
  const draft = await askForJson<AIEndingDraft>(buildEndingPrompt(memory), normalizeEndingDraft);
  if (!draft || isTooSimilar(`${draft.endingTitle} ${draft.finalLine}`, [...memory.previousEndingTitles, ...memory.previousFinalLines]) || scoreHumanWriting([draft.whatHappened, draft.whatItCost, draft.memoryCallback, draft.finalLine]) < 1) return fallback;

  return {
    ...fallback,
    title: draft.endingTitle,
    identity: draft.identity,
    outcome: draft.whatHappened,
    tradeoff: draft.whatItCost,
    reflection: [
      draft.whatHappened,
      draft.whatItCost,
      draft.memoryCallback
    ].filter(Boolean).join("\n\n"),
    finalLine: draft.finalLine,
    finalObject: draft.finalSceneObject,
    quote: draft.finalLine
  };
}

function getProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "openai") return "openai";
  if (provider && provider !== "none") return "generic";
  return "none";
}

async function askForJson<T>(prompt: string, normalize: (value: unknown) => T | null) {
  const raw = await callAIWriter(prompt);
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

function normalizeSceneDraft(value: unknown, memory: StoryMemory, fallbackScene: StoryScene): AISceneDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<AISceneDraft>;
  const choices = Array.isArray(draft.choices) ? draft.choices.slice(0, 3).map((choice, index) => normalizeChoiceDraft(choice, index)).filter(Boolean) as AISceneDraft["choices"] : [];
  if (choices.length < 2) return null;
  return {
    sceneTitle: cleanAIText(draft.sceneTitle || fallbackScene.title).slice(0, 60),
    narrationLines: sanitizeLines(draft.narrationLines ?? [], fallbackScene.narration.split(/(?<=[.!?])\s+/)).slice(0, 3),
    firstPersonCutType: draft.firstPersonCutType,
    environment: draft.environment ?? fallbackScene.environment,
    mood: draft.mood ?? fallbackScene.mood,
    choices: dedupeChoices(choices, memory.recentChoices)
  };
}

function normalizeChoiceDraft(value: unknown, index: number) {
  if (!value || typeof value !== "object") return null;
  const choice = value as Partial<AISceneDraft["choices"][number]>;
  if (!choice.text) return null;
  return {
    text: makeChoiceSpecific(cleanAIText(choice.text)).slice(0, 90),
    effect: choice.effect ?? {},
    flags: choice.flags ?? [],
    consequenceHint: cleanAIText(choice.consequenceHint ?? "This changes the next room."),
    delayedCallbackPossible: choice.delayedCallbackPossible ?? index === 0
  };
}

function normalizeConsequenceDraft(value: unknown): AIConsequenceDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<AIConsequenceDraft>;
  return {
    consequenceLines: sanitizeLines(draft.consequenceLines ?? [], ["You choose it.", "The room changes a little."]),
    updatedMood: draft.updatedMood ?? "focused",
    memoryCallback: draft.memoryCallback ? cleanAIText(draft.memoryCallback) : undefined,
    delayedFlag: draft.delayedFlag
  };
}

function normalizeEndingDraft(value: unknown): AIEndingDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<AIEndingDraft>;
  if (!draft.endingTitle || !draft.finalLine) return null;
  return {
    endingTitle: cleanAIText(draft.endingTitle).slice(0, 70),
    identity: cleanAIText(draft.identity ?? "The Unfinished Version").slice(0, 70),
    whatHappened: cleanAIText(draft.whatHappened ?? "Something small stayed."),
    whatItCost: cleanAIText(draft.whatItCost ?? "Comfort changed shape."),
    memoryCallback: cleanAIText(draft.memoryCallback ?? "One object stayed in the room."),
    finalLine: cleanAIText(draft.finalLine).slice(0, 140),
    finalSceneObject: cleanAIText(draft.finalSceneObject ?? "phone").slice(0, 40)
  };
}

function hasRepeatedSceneText(draft: AISceneDraft, memory: StoryMemory) {
  return [draft.sceneTitle, ...draft.narrationLines, ...draft.choices.map((choice) => choice.text)]
    .some((text) => isTooSimilar(text, memory.previousGeneratedText) || isTooSimilar(text, memory.recentChoices));
}

function dedupeChoices(choices: AISceneDraft["choices"], recentChoices: string[]) {
  const used = new Set(recentChoices.map((choice) => choice.toLowerCase()));
  return choices.filter((choice) => {
    const key = choice.text.toLowerCase();
    if (used.has(key)) return false;
    used.add(key);
    return true;
  }).slice(0, 3);
}

function localConsequence(choice: StoryChoice, memory: StoryMemory): AIConsequenceDraft {
  const random = seededRandom(memory.seed + choice.text.length + memory.choiceHistory.length * 17);
  const lines = choice.flags?.includes("ignored_message")
    ? ["You put it away.", "The room gets easier, which is rude of it.", "The message waits."]
    : choice.flags?.includes("sent_unfinished")
      ? ["You send it.", "The screen looks too bright after.", "Now the rough thing has witnesses."]
      : choice.flags?.includes("did_nothing")
        ? ["You do nothing.", "The day keeps going.", "That is its bad habit."]
        : ["You choose it.", random() > 0.5 ? "Nothing dramatic happens, which feels suspicious." : "The room changes a little.", "You notice anyway."];
  return {
    consequenceLines: lines,
    updatedMood: choice.flags?.includes("did_nothing") ? "lost" : choice.flags?.includes("sent_unfinished") ? "tense" : "focused",
    memoryCallback: choice.consequenceHint,
    delayedFlag: choice.delayedCallbackPossible ? choice.flags?.[0] : undefined
  };
}

function makeChoiceSpecific(text: string) {
  const vague = ["choose", "success", "destiny", "dream", "potential", "future"];
  const lower = text.toLowerCase();
  if (!vague.some((word) => lower.includes(word))) return text;
  if (lower.includes("nothing")) return "Do nothing and let the tab stay open";
  if (lower.includes("send")) return "Send the rough version before fixing it again";
  if (lower.includes("work") || lower.includes("discipline")) return "Fix one small part before checking your phone";
  return "Open it for five minutes";
}
