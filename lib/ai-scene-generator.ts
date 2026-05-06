import { filterRepeatedChoices, isTextTooSimilar } from "@/lib/anti-repeat";
import { callAIWriter } from "@/lib/ai-writer";
import type { DirectorDecision } from "@/lib/ai-story-director";
import type { StoryState } from "@/lib/story-state";
import type { MemoryObject, StoryChoice, StoryEnvironment, StoryMood, StoryScene } from "@/lib/story-types";

type AdaptiveSceneDraft = {
  id: string;
  title: string;
  narrationLines: string[];
  environment: StoryEnvironment;
  mood: StoryMood;
  firstPersonCut?: StoryScene["firstPersonCut"];
  noChoiceMoment?: boolean;
  choices: Array<StoryChoice & {
    flagsAdded?: StoryChoice["flags"];
  }>;
  createdThreads?: string[];
  resolvedThreads?: string[];
  memoryObject?: MemoryObject;
  consequencePreview?: string;
};

export class AISceneGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AISceneGenerationError";
  }
}

export async function generateAdaptiveScene(storyState: StoryState, directorDecision: DirectorDecision): Promise<StoryScene> {
  const raw = await callAIWriter(buildScenePrompt(storyState, directorDecision));
  if (!raw) throw new AISceneGenerationError("AI returned no scene text.");
  try {
    const draft = normalizeDraft(JSON.parse(raw), storyState, directorDecision);
    if (isTextTooSimilar(`${draft.title} ${draft.narration}`, storyState.shownTexts)) {
      throw new AISceneGenerationError("AI scene was too similar to previous story text.");
    }
    return draft;
  } catch (error) {
    if (error instanceof AISceneGenerationError) throw error;
    throw new AISceneGenerationError("AI scene JSON could not be parsed or normalized.");
  }
}

function buildScenePrompt(storyState: StoryState, decision: DirectorDecision) {
  return `
Generate the next adaptive scene for DIRECT YOUR LIFE.
The AI director decision is:
${JSON.stringify(decision)}

Rules:
Write like real life.
Short lines.
No motivational tone.
No fake deep quotes.
No generic self-help.
No explaining emotions.
Show through action.
No long paragraphs.
No repeated phrases.
Every scene must use at least ONE concrete real-life detail.

Good:
"You open it... then close it again."
"You almost send it. Then you don't."
"Nobody noticed. You did."
"You rename the file again. It still says final."
"The message stays unread until the screen goes dark."

Bad:
"You face a difficult choice about your future."
"Take responsibility."
"Choose growth."

Use:
- user profile: ${storyState.profile.doneSoFar} / ${storyState.profile.goals || storyState.profile.goal}
- goal category: ${storyState.profile.parsedProfile?.goalCategory ?? "general"}
- current act: ${storyState.currentAct}
- scene index: ${storyState.sceneIndex}
- emotional target: ${decision.emotionalTarget}
- open threads: ${storyState.consequenceThreads.map((thread) => `${thread.id}:${thread.theme}:${thread.status}`).join(" | ") || "none"}
- repeated patterns: ${storyState.repeatedPatterns.join(", ") || "none"}
- memory objects: ${storyState.memoryObjects.map((memory) => memory.name).join(", ") || "none"}
- previous choices: ${storyState.choiceHistory.map((choice) => choice.choiceText).join(" -> ") || "none"}
- real-life scene details: ${storyState.realLifeExamples.sceneDetails.join(" | ")}
- real-life choice details: ${storyState.realLifeExamples.choiceDetails.join(" | ")}
- callback details: ${storyState.realLifeExamples.callbackDetails.join(" | ")}

Avoid:
- scene titles: ${decision.avoid.sceneTitles.join(" | ")}
- choices: ${decision.avoid.choiceTexts.join(" | ")}
- phrases: ${decision.avoid.phrases.slice(-40).join(" | ")}

Return strict JSON only:
{
  "id": "short_id",
  "title": "short title",
  "narrationLines": ["1 short line", "second short line", "optional third line"],
  "environment": "bedroom|studio|city|sunrise|void|spotlight",
  "mood": "hopeful|tired|tense|focused|lost|breakthrough",
  "firstPersonCut": { "id": "cut", "title": "short", "detail": "short", "kind": "screen|message|walk|still|late_night|phone|thinking|desk" },
  "noChoiceMoment": false,
  "choices": [
    {
      "id": "short_id",
      "text": "specific real action",
      "type": "work|avoid|risk|social|rest|repair|finish|start_over",
      "effect": { "discipline": 0, "consistency": 0, "risk": 0, "creativity": 0, "social": 0, "confidence": 0, "fatigue": 0, "regret": 0, "momentum": 0, "luck": 0 },
      "flagsAdded": ["stayed_consistent"],
      "createsThread": "optional theme",
      "resolvesThread": "optional thread id",
      "endingInfluence": "what this proves about the user",
      "consequenceHint": "short concrete consequence"
    }
  ],
  "createdThreads": [],
  "resolvedThreads": [],
  "memoryObject": null,
  "consequencePreview": "short preview"
}
`;
}

function normalizeDraft(value: Partial<AdaptiveSceneDraft>, storyState: StoryState, decision: DirectorDecision): StoryScene {
  if (!value || typeof value !== "object") throw new AISceneGenerationError("Scene draft is empty.");
  const narrationLines = Array.isArray(value.narrationLines) ? value.narrationLines.filter(Boolean).slice(0, 3) : [];
  if (!value.title || narrationLines.length === 0) throw new AISceneGenerationError("Scene draft is missing title or narration.");

  const choices = decision.shouldUseNoChoiceMoment
    ? []
    : filterRepeatedChoices((value.choices ?? []).slice(0, 3).map((choice, index) => ({
        ...choice,
        id: choice.id || `ai_choice_${storyState.sceneIndex}_${index}`,
        text: choice.text,
        effect: choice.effect ?? choice.effects ?? {},
        flags: choice.flagsAdded ?? choice.flags ?? [],
        consequenceHint: choice.consequenceHint || "The room changes a little."
      })).filter((choice) => Boolean(choice.text)), storyState.shownChoices);

  if (!decision.shouldUseNoChoiceMoment && choices.length < 2) {
    throw new AISceneGenerationError("AI scene did not include enough usable choices.");
  }

  return {
    id: value.id || `ai_scene_${storyState.randomSeed}_${storyState.sceneIndex + 1}`,
    act: storyState.currentAct,
    title: value.title,
    year: 2026 + Math.floor(storyState.sceneIndex / 4),
    narration: narrationLines.join(" "),
    environment: value.environment ?? "bedroom",
    mood: value.mood ?? "focused",
    firstPersonCut: decision.shouldUseFirstPersonCut ? value.firstPersonCut : undefined,
    noChoiceMoment: decision.shouldUseNoChoiceMoment,
    relationshipMoment: decision.shouldIntroduceRelationshipMoment ? {
      role: "friend",
      name: "Someone",
      line: "You still doing that thing?"
    } : undefined,
    memoryObject: value.memoryObject,
    choices: decision.shouldUseNoChoiceMoment
      ? [{ id: `auto_${storyState.sceneIndex}`, text: "Let it happen", effect: { regret: 1, momentum: 1 }, auto: true }]
      : choices
  };
}
