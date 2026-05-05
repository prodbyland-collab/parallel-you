import { callAIWriter } from "@/lib/ai-writer";
import type { StoryState } from "@/lib/story-state";

export type DirectorDecision = {
  action: "continue_story" | "trigger_callback" | "create_pressure" | "trigger_wildcard" | "create_turning_point" | "slow_down" | "move_to_ending";
  reason: string;
  nextScenePurpose: string;
  emotionalTarget: "quiet" | "tense" | "hopeful" | "regretful" | "uncertain" | "warm" | "empty" | "breakthrough";
  shouldUseFirstPersonCut: boolean;
  shouldUseNoChoiceMoment: boolean;
  shouldIntroduceRelationshipMoment: boolean;
  shouldResolveThreadId?: string;
  shouldCreateThreadTheme?: string;
  endingReadinessScore: number;
  avoid: {
    sceneTitles: string[];
    choiceTexts: string[];
    phrases: string[];
  };
};

export async function directNextStep(storyState: StoryState): Promise<DirectorDecision> {
  const fallback = fallbackDecision(storyState);
  const raw = await callAIWriter(buildDirectorPrompt(storyState));
  if (!raw) return fallback;
  try {
    return normalizeDecision(JSON.parse(raw), fallback, storyState);
  } catch {
    return fallback;
  }
}

function buildDirectorPrompt(storyState: StoryState) {
  return `
You are the STORY DIRECTOR for DIRECT YOUR LIFE.
Do not write the scene. Decide what should happen next.
Return strict JSON only.

Writing rules for the next scene:
Write like real life. Short lines. No motivational tone. No fake deep quotes.
No generic self-help. No explaining emotions. Show through action. No repeated phrases.

Given this story state:
- profile goal: ${storyState.profile.goals || storyState.profile.goal}
- goal category: ${storyState.profile.parsedProfile?.goalCategory ?? "general"}
- current act: ${storyState.currentAct}
- scene index: ${storyState.sceneIndex}
- hidden traits: ${JSON.stringify(storyState.hiddenTraits)}
- choices: ${storyState.choiceHistory.map((choice) => choice.choiceText).join(" -> ") || "none"}
- repeated patterns: ${storyState.repeatedPatterns.join(", ") || "none"}
- open consequence threads: ${storyState.consequenceThreads.filter((thread) => thread.status === "open").map((thread) => `${thread.id}:${thread.theme}`).join(", ") || "none"}
- missed opportunities: ${storyState.missedOpportunities.join(" | ") || "none"}
- memory objects: ${storyState.memoryObjects.map((memory) => memory.name).join(", ") || "none"}
- ending readiness: ${storyState.endingReadinessScore}
- real-life details to use later: ${storyState.realLifeExamples.sceneDetails.join(" | ")}

Ask:
- what has user repeatedly done?
- what consequence is still open?
- what should come back now?
- should story speed up or slow down?
- is ending forming?
- what emotional target should next scene hit?
- what should be avoided because it was already shown?

Avoid:
- scene titles: ${storyState.avoid.sceneTitles.join(" | ")}
- choices: ${storyState.avoid.choiceTexts.join(" | ")}
- phrases: ${storyState.avoid.phrases.slice(-25).join(" | ")}

Return:
{
  "action": "continue_story|trigger_callback|create_pressure|trigger_wildcard|create_turning_point|slow_down|move_to_ending",
  "reason": "short plain reason",
  "nextScenePurpose": "specific purpose for next scene",
  "emotionalTarget": "quiet|tense|hopeful|regretful|uncertain|warm|empty|breakthrough",
  "shouldUseFirstPersonCut": true,
  "shouldUseNoChoiceMoment": false,
  "shouldIntroduceRelationshipMoment": false,
  "shouldResolveThreadId": "optional thread id",
  "shouldCreateThreadTheme": "optional theme",
  "endingReadinessScore": ${storyState.endingReadinessScore},
  "avoid": { "sceneTitles": [], "choiceTexts": [], "phrases": [] }
}
`;
}

function fallbackDecision(storyState: StoryState): DirectorDecision {
  const openThread = storyState.consequenceThreads.find((thread) => thread.status === "open");
  const action = storyState.endingReadinessScore >= 82
    ? "move_to_ending"
    : openThread && storyState.sceneIndex % 3 === 0
      ? "trigger_callback"
      : storyState.sceneIndex > 5 && storyState.sceneIndex % 4 === 0
        ? "create_turning_point"
        : storyState.hiddenTraits.fatigue > 70
          ? "slow_down"
          : storyState.sceneIndex % 5 === 0
            ? "create_pressure"
            : "continue_story";

  return {
    action,
    reason: openThread ? `The ${openThread.theme} thread is still open.` : "The story needs the next real consequence.",
    nextScenePurpose: purposeForAction(action, openThread?.theme),
    emotionalTarget: targetForState(storyState),
    shouldUseFirstPersonCut: storyState.sceneIndex % 3 === 0,
    shouldUseNoChoiceMoment: action === "slow_down" && storyState.sceneIndex > 6,
    shouldIntroduceRelationshipMoment: storyState.hiddenTraits.social > 55 && storyState.sceneIndex % 4 === 1,
    shouldResolveThreadId: action === "trigger_callback" ? openThread?.id : undefined,
    shouldCreateThreadTheme: action === "create_pressure" ? "pressure_waiting_for_answer" : undefined,
    endingReadinessScore: storyState.endingReadinessScore,
    avoid: storyState.avoid
  };
}

function normalizeDecision(value: Partial<DirectorDecision>, fallback: DirectorDecision, storyState: StoryState): DirectorDecision {
  const actions: DirectorDecision["action"][] = ["continue_story", "trigger_callback", "create_pressure", "trigger_wildcard", "create_turning_point", "slow_down", "move_to_ending"];
  const targets: DirectorDecision["emotionalTarget"][] = ["quiet", "tense", "hopeful", "regretful", "uncertain", "warm", "empty", "breakthrough"];
  return {
    ...fallback,
    ...value,
    action: actions.includes(value.action as DirectorDecision["action"]) ? value.action as DirectorDecision["action"] : fallback.action,
    emotionalTarget: targets.includes(value.emotionalTarget as DirectorDecision["emotionalTarget"]) ? value.emotionalTarget as DirectorDecision["emotionalTarget"] : fallback.emotionalTarget,
    endingReadinessScore: Math.max(storyState.endingReadinessScore, Number(value.endingReadinessScore ?? fallback.endingReadinessScore)),
    avoid: {
      sceneTitles: [...storyState.avoid.sceneTitles, ...(value.avoid?.sceneTitles ?? [])].slice(-60),
      choiceTexts: [...storyState.avoid.choiceTexts, ...(value.avoid?.choiceTexts ?? [])].slice(-80),
      phrases: [...storyState.avoid.phrases, ...(value.avoid?.phrases ?? [])].slice(-120)
    }
  };
}

function purposeForAction(action: DirectorDecision["action"], theme?: string) {
  if (action === "trigger_callback") return `Bring back the unresolved thread: ${theme}.`;
  if (action === "create_pressure") return "Put a real-life demand in the room.";
  if (action === "trigger_wildcard") return "Introduce a realistic surprise that changes the plan.";
  if (action === "create_turning_point") return "Make a small decision feel like it can change the route.";
  if (action === "slow_down") return "Let the user sit with the cost before moving on.";
  if (action === "move_to_ending") return "Gather the pattern, cost, object, and final line.";
  return "Continue from the last choice with a concrete consequence.";
}

function targetForState(storyState: StoryState): DirectorDecision["emotionalTarget"] {
  if (storyState.hiddenTraits.regret > 70) return "regretful";
  if (storyState.hiddenTraits.fatigue > 70) return "empty";
  if (storyState.hiddenTraits.momentum > 75) return "breakthrough";
  if (storyState.consequenceThreads.some((thread) => thread.status === "open")) return "tense";
  if (storyState.hiddenTraits.social > 65) return "warm";
  return "quiet";
}
