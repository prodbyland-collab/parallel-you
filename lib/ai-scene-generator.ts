import { filterRepeatedChoices, isTextTooSimilar } from "@/lib/anti-repeat";
import { callAIWriter } from "@/lib/ai-writer";
import type { DirectorDecision } from "@/lib/ai-story-director";
import { seededRandom } from "@/lib/random-engine";
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

export async function generateAdaptiveScene(storyState: StoryState, directorDecision: DirectorDecision): Promise<StoryScene> {
  const fallback = fallbackAdaptiveScene(storyState, directorDecision);
  const raw = await callAIWriter(buildScenePrompt(storyState, directorDecision));
  if (!raw) return fallback;
  try {
    const draft = normalizeDraft(JSON.parse(raw), fallback, storyState, directorDecision);
    if (isTextTooSimilar(`${draft.title} ${draft.narration}`, storyState.shownTexts)) return fallback;
    return draft;
  } catch {
    return fallback;
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

function normalizeDraft(value: Partial<AdaptiveSceneDraft>, fallback: StoryScene, storyState: StoryState, decision: DirectorDecision): StoryScene {
  const choices = decision.shouldUseNoChoiceMoment
    ? []
    : filterRepeatedChoices((value.choices ?? []).slice(0, 3).map((choice, index) => ({
        ...choice,
        id: choice.id || `adaptive_choice_${storyState.sceneIndex}_${index}`,
        text: choice.text || fallback.choices[index]?.text || "Do one small real thing",
        effect: choice.effect ?? choice.effects ?? fallback.choices[index]?.effect ?? {},
        flags: choice.flagsAdded ?? choice.flags ?? fallback.choices[index]?.flags ?? [],
        consequenceHint: choice.consequenceHint || fallback.choices[index]?.consequenceHint || "The room changes a little."
      })), storyState.shownChoices);

  return {
    ...fallback,
    id: value.id || `adaptive_${storyState.sceneIndex + 1}`,
    act: storyState.currentAct,
    title: value.title || fallback.title,
    narration: (value.narrationLines?.slice(0, 3) ?? fallback.narration.split(/(?<=[.!?])\s+/)).join(" "),
    environment: value.environment ?? fallback.environment,
    mood: value.mood ?? fallback.mood,
    firstPersonCut: decision.shouldUseFirstPersonCut ? value.firstPersonCut ?? fallback.firstPersonCut : undefined,
    noChoiceMoment: decision.shouldUseNoChoiceMoment,
    relationshipMoment: decision.shouldIntroduceRelationshipMoment ? fallback.relationshipMoment ?? {
      role: "friend",
      name: "Someone",
      line: "You still doing that thing?"
    } : undefined,
    memoryObject: value.memoryObject ?? fallback.memoryObject,
    choices: decision.shouldUseNoChoiceMoment
      ? [{ id: `auto_${storyState.sceneIndex}`, text: "Let it happen", effect: { regret: 1, momentum: 1 }, auto: true }]
      : choices.length >= 2 ? choices : fallback.choices.slice(0, 3)
  };
}

function fallbackAdaptiveScene(storyState: StoryState, decision: DirectorDecision): StoryScene {
  const random = seededRandom(storyState.randomSeed + storyState.sceneIndex * 31);
  const detail = storyState.realLifeExamples.sceneDetails[Math.floor(random() * storyState.realLifeExamples.sceneDetails.length)] ?? "sitting in a quiet room";
  const title = titleFromDecision(decision);
  const mood = moodFromTarget(decision.emotionalTarget);
  const environment = environmentFromDetail(detail);
  const choices = fallbackChoices(storyState, detail, random).filter((choice) => !storyState.shownChoices.includes(choice.text)).slice(0, 3);

  return {
    id: `adaptive_${storyState.sceneIndex + 1}`,
    act: storyState.currentAct,
    title,
    year: 2026 + Math.floor(storyState.sceneIndex / 4),
    narration: `You catch yourself ${detail}. It feels ordinary, which is how it gets away with it.`,
    environment,
    mood,
    noChoiceMoment: decision.shouldUseNoChoiceMoment,
    firstPersonCut: decision.shouldUseFirstPersonCut ? {
      id: `cut_${storyState.sceneIndex}`,
      title: "For a second, nothing performs.",
      detail,
      kind: "still"
    } : undefined,
    choices: decision.shouldUseNoChoiceMoment
      ? [{ id: `auto_${storyState.sceneIndex}`, text: "Let the moment pass", effect: { regret: 1, fatigue: -1 }, auto: true }]
      : choices
  };
}

function fallbackChoices(storyState: StoryState, detail: string, random: () => number): StoryChoice[] {
  const category = storyState.profile.parsedProfile?.goalCategory ?? "general";
  const pools: Record<string, string[]> = {
    music: ["Export it before changing the drums again", "Send the rough beat to one person", "Start another loop and pretend it helps"],
    business: ["Fix the headline one more time", "Send the client message before pacing", "Delay the launch and call it research"],
    fitness: ["Put on shoes and walk outside", "Do the ugly 20-minute workout", "Choose sleep and leave the shoes by the door"],
    writing: ["Write one bad page", "Delete the sentence you keep protecting", "Open old notes and steal one useful line"],
    general: ["Reply before the message disappears", "Do one small useful thing", "Do nothing and feel the day pass"]
  };
  const pool = pools[category] ?? pools.general;
  return pool.map((text, index) => ({
    id: `fallback_${storyState.sceneIndex}_${index}`,
    text,
    type: index === 2 ? "avoid" : index === 1 ? "risk" : "work",
    effect: index === 2 ? { regret: 5, momentum: -3 } : { momentum: 5, confidence: 2, fatigue: random() > 0.5 ? 2 : 0 },
    flags: index === 2 ? ["avoided_work"] : index === 1 ? ["took_big_risk"] : ["stayed_consistent"],
    createsThread: index === 2 ? "avoidance_cost" : undefined,
    endingInfluence: `${text} after ${detail}`,
    consequenceHint: index === 2 ? "The ordinary delay gets another receipt." : "The small action leaves proof."
  }));
}

function titleFromDecision(decision: DirectorDecision) {
  if (decision.action === "trigger_callback") return "It Comes Back";
  if (decision.action === "create_pressure") return "Something Waits";
  if (decision.action === "trigger_wildcard") return "The Odd Little Turn";
  if (decision.action === "create_turning_point") return "The Small Turn";
  if (decision.action === "slow_down") return "A Quieter Minute";
  return "The Next Ordinary Thing";
}

function moodFromTarget(target: DirectorDecision["emotionalTarget"]): StoryMood {
  if (target === "breakthrough") return "breakthrough";
  if (target === "tense" || target === "regretful" || target === "uncertain") return "tense";
  if (target === "empty") return "lost";
  if (target === "warm" || target === "hopeful") return "hopeful";
  return "focused";
}

function environmentFromDetail(detail: string): StoryEnvironment {
  if (/walk|gym|analytics|client|street|outside/i.test(detail)) return "city";
  if (/track|beat|file|draft|page|landing|laptop|daw|studio/i.test(detail)) return "studio";
  if (/morning|shoes|sun/i.test(detail)) return "sunrise";
  return "bedroom";
}
