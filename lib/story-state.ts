import { buildAvoidList } from "@/lib/anti-repeat";
import { calculateEndingReadiness } from "@/lib/ending-readiness";
import { getRealLifeExamples } from "@/lib/real-life-examples";
import type { ConsequenceThread, MemoryObject, PlayerProfile, StoryRunState } from "@/lib/story-types";

export type StoryState = {
  profile: PlayerProfile;
  currentAct: 1 | 2 | 3;
  sceneIndex: number;
  randomSeed: number;
  hiddenTraits: StoryRunState["traits"];
  choiceHistory: StoryRunState["choices"];
  sceneHistory: string[];
  shownTexts: string[];
  shownChoices: string[];
  flags: StoryRunState["flags"];
  memoryObjects: MemoryObject[];
  missedOpportunities: string[];
  consequenceThreads: ConsequenceThread[];
  relationshipMoments: string[];
  turningPoints: string[];
  repeatedPatterns: string[];
  endingSeeds: string[];
  replayCount: number;
  endingReadinessScore: number;
  avoid: ReturnType<typeof buildAvoidList>;
  realLifeExamples: ReturnType<typeof getRealLifeExamples>;
};

export function toStoryState(run: StoryRunState, previousRunText: string[] = []): StoryState {
  const sceneIndex = run.sceneHistory.length;
  return {
    profile: run.profile,
    currentAct: sceneIndex < 4 ? 1 : sceneIndex < 10 ? 2 : 3,
    sceneIndex,
    randomSeed: run.seed,
    hiddenTraits: run.traits,
    choiceHistory: run.choices,
    sceneHistory: run.sceneHistory,
    shownTexts: [...run.generatedTextHistory, ...previousRunText].slice(-160),
    shownChoices: [...run.recentChoiceTexts, ...run.choices.map((choice) => choice.choiceText)].slice(-80),
    flags: run.flags,
    memoryObjects: run.memories,
    missedOpportunities: run.missedOpportunities ?? run.missedMoments,
    consequenceThreads: run.consequenceThreads,
    relationshipMoments: run.relationshipMoments,
    turningPoints: run.turningPoints,
    repeatedPatterns: run.repeatedPatterns,
    endingSeeds: run.endingSeeds,
    replayCount: run.replayCount,
    endingReadinessScore: calculateEndingReadiness(run),
    avoid: buildAvoidList(run, previousRunText),
    realLifeExamples: getRealLifeExamples(run.profile, run)
  };
}
