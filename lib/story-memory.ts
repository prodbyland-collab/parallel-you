import type { EndingResult, StoryChoice, StoryRunState, StoryScene } from "@/lib/story-types";

export type StoryMemory = {
  profile: StoryRunState["profile"];
  currentAct: 1 | 2 | 3;
  sceneIndex: number;
  scenePurpose: string;
  currentSceneTitle: string;
  currentSceneNarration: string;
  narrativeThread: string;
  choiceHistory: StoryRunState["choices"];
  rejectedChoices: string[];
  recentNarration: string[];
  recentChoices: string[];
  flags: StoryRunState["flags"];
  hiddenTraits: StoryRunState["traits"];
  memoryObjects: StoryRunState["memories"];
  missedMoments: string[];
  relationshipMoments: string[];
  wildcardsUsed: StoryRunState["wildcardsUsed"];
  rareEventsTriggered: StoryRunState["rareMomentsTriggered"];
  emotionalConsequences: string[];
  previousGeneratedText: string[];
  previousEndingTitles: string[];
  previousFinalLines: string[];
  seed: number;
};

export function createStoryMemory(
  state: StoryRunState,
  scene: StoryScene,
  allScenes: StoryScene[],
  endings: EndingResult[] = [],
  lastChoice?: StoryChoice,
  previousStoryText: string[] = []
): StoryMemory {
  const sceneIndex = Math.max(0, allScenes.findIndex((item) => item.id === scene.id));
  return {
    profile: state.profile,
    currentAct: scene.act,
    sceneIndex,
    scenePurpose: getScenePurpose(scene.act, sceneIndex, allScenes.length),
    currentSceneTitle: scene.title,
    currentSceneNarration: scene.narration,
    narrativeThread: buildNarrativeThread(state, scene, lastChoice),
    choiceHistory: state.choices.slice(-10),
    rejectedChoices: lastChoice ? scene.choices.filter((choice) => choice.id !== lastChoice.id).map((choice) => choice.text) : [],
    recentNarration: state.generatedTextHistory?.slice(-12) ?? [],
    recentChoices: [...(state.recentChoiceTexts ?? []), ...state.choices.slice(-6).map((choice) => choice.choiceText)].slice(-12),
    flags: state.flags,
    hiddenTraits: state.traits,
    memoryObjects: state.memories,
    missedMoments: state.missedMoments ?? [],
    relationshipMoments: state.relationshipMoments ?? [],
    wildcardsUsed: state.wildcardsUsed,
    rareEventsTriggered: state.rareMomentsTriggered,
    emotionalConsequences: state.emotionalConsequences ?? [],
    previousGeneratedText: [...(state.generatedTextHistory ?? []), ...previousStoryText].slice(-160),
    previousEndingTitles: endings.map((ending) => ending.title),
    previousFinalLines: endings.map((ending) => ending.finalLine),
    seed: state.seed
  };
}

function buildNarrativeThread(state: StoryRunState, scene: StoryScene, lastChoice?: StoryChoice) {
  const previous = state.choices[state.choices.length - 1];
  const memory = state.memories[state.memories.length - 1];
  const pieces = [
    `Current scene: ${scene.title}.`,
    `What is on screen now: ${scene.narration}`,
    previous ? `Last real choice: ${previous.choiceText}.` : "This is the beginning.",
    lastChoice ? `Choice being considered now: ${lastChoice.text}.` : "",
    state.emotionalConsequences?.length ? `Recent consequence: ${state.emotionalConsequences[state.emotionalConsequences.length - 1]}.` : "",
    memory ? `Object still following the story: ${memory.name}.` : "",
    state.missedMoments?.length ? `Missed moment to possibly bring back: ${state.missedMoments[state.missedMoments.length - 1]}.` : ""
  ];
  return pieces.filter(Boolean).join(" ");
}

export function rememberGeneratedScene(state: StoryRunState, scene: StoryScene): StoryRunState {
  return {
    ...state,
    generatedTextHistory: [
      ...(state.generatedTextHistory ?? []),
      scene.title,
      ...scene.narration.split(/(?<=[.!?])\s+/),
      ...scene.choices.map((choice) => choice.text)
    ].filter(Boolean).slice(-80)
  };
}

function getScenePurpose(act: 1 | 2 | 3, sceneIndex: number, totalScenes: number) {
  if (act === 1) return sceneIndex <= 1 ? "Show the user's current pattern." : "Make the first small action feel real.";
  if (act === 2) return sceneIndex < totalScenes * 0.55 ? "Create pressure and delayed consequence." : "Let earlier choices start to show.";
  return sceneIndex < totalScenes - 2 ? "Bring earlier choices back." : "Prepare the ending without explaining it.";
}
