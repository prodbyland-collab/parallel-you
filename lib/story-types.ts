export type StoryEnvironment = "bedroom" | "studio" | "city" | "sunrise" | "void" | "spotlight";
export type StoryMood = "hopeful" | "tired" | "tense" | "focused" | "lost" | "breakthrough";
export type MemoryObjectId = "notebook" | "voice-note" | "old-photo" | "alarm-clock" | "receipt" | "hoodie" | "bus-ticket" | "project-file" | "message-draft" | "coffee-cup";
export type MiniGameType = "hold" | "timed-choice" | "drag-memory" | "tap-particles";

export type PlayerProfile = {
  name: string;
  age: number;
  country: string;
  doneSoFar: string;
  goals: string;
  goal: string;
  whatIf: string;
  discipline: number;
  consistency: number;
  risk: number;
  creativity: number;
  social: number;
  confidence: number;
  parsedProfile?: ParsedUserProfile;
};

export type GoalCategory = "music" | "business" | "fitness" | "writing" | "career" | "school" | "relationship" | "personal" | "general";
export type ExperienceLevel = "starting" | "some experience" | "experienced";
export type EmotionalTone = "hopeful" | "frustrated but hopeful" | "tired" | "confident" | "uncertain" | "stuck";

export type ParsedUserProfile = {
  mainGoal: string;
  goalCategory: GoalCategory;
  experienceLevel: ExperienceLevel;
  emotionalTone: EmotionalTone;
  discipline: number;
  consistency: number;
  risk: number;
  creativity: number;
  social: number;
  confidence: number;
  keyThemes: string[];
  regrets: string[];
  possibleRegrets: string[];
  personalVocabulary: string[];
};

export type HiddenTraits = {
  discipline: number;
  consistency: number;
  risk: number;
  creativity: number;
  social: number;
  confidence: number;
  fatigue: number;
  regret: number;
  momentum: number;
  luck: number;
};

export type StoryFlag =
  | "avoided_work"
  | "stayed_consistent"
  | "took_big_risk"
  | "ignored_opportunity"
  | "sent_unfinished"
  | "ignored_message"
  | "started_over_again"
  | "did_nothing"
  | "someone_noticed"
  | "almost_finished"
  | "finished_badly"
  | "asked_for_help"
  | "isolated_self"
  | "returned_after_failure"
  | "burned_out"
  | "breakthrough_seen"
  | "lucky_event_seen"
  | "regret_repeated"
  | "quit_once";

export type ChoiceEffect = Partial<Omit<HiddenTraits, "luck">> & {
  luck?: number;
};

export type ChoiceBehaviorType =
  | "honesty"
  | "avoidance"
  | "risk"
  | "connection"
  | "isolation"
  | "perfectionism"
  | "consistency"
  | "self_sabotage"
  | "returning"
  | "escape";

export type StoryChoice = {
  id: string;
  text: string;
  type?: "work" | "avoid" | "risk" | "social" | "rest" | "repair" | "finish" | "start_over";
  behaviorType?: ChoiceBehaviorType;
  immediateConsequence?: string;
  butterflyEffect?: string;
  hiddenTraitEffects?: ChoiceEffect;
  effect: ChoiceEffect;
  effects?: ChoiceEffect;
  flags?: StoryFlag[];
  flagsAdded?: StoryFlag[];
  nextScene?: string;
  auto?: boolean;
  consequenceHint?: string;
  delayedCallbackPossible?: boolean;
  createsThread?: string;
  resolvesThread?: string;
  endingInfluence?: string;
};

export type StoryScene = {
  id: string;
  act: 1 | 2 | 3;
  title: string;
  year: number;
  narration: string;
  environment: StoryEnvironment;
  mood: StoryMood;
  choices: StoryChoice[];
  memoryObject?: MemoryObject;
  secret?: boolean;
  miniGame?: MiniGameType;
  relationshipMoment?: RelationshipMoment;
  moodShift?: MoodShift;
  movieMoment?: MovieMoment;
  firstPersonCut?: FirstPersonCut;
  noChoiceMoment?: boolean;
};

export type FirstPersonCut = {
  id: string;
  title: string;
  detail: string;
  kind: "screen" | "message" | "walk" | "still" | "late_night" | "phone" | "thinking" | "desk";
};

export type WildCardEvent = {
  id: string;
  title: string;
  narration: string;
  environment: StoryEnvironment;
  mood: StoryMood;
  effect: ChoiceEffect;
  flags: StoryFlag[];
  rarity: "wild" | "rare";
};

export type MemoryObject = {
  id: MemoryObjectId;
  name: string;
  description: string;
  quote: string;
  effect: ChoiceEffect;
};

export type ChaosEvent = {
  id: string;
  title: string;
  narration: string;
  kind: "strange opportunity" | "impulsive decision" | "unexpected message" | "sudden creative idea" | "risky shortcut";
  effect: ChoiceEffect;
  flags: StoryFlag[];
};

export type SecretSceneRecord = {
  id: string;
  title: string;
  unlockedBy: string;
};

export type RelationshipMoment = {
  role: "friend" | "stranger" | "mentor" | "old connection";
  name: string;
  line: string;
};

export type MoodShift = {
  from: StoryMood;
  to: StoryMood;
  line: string;
};

export type MovieMoment = {
  id: string;
  title: string;
  description: string;
  rarity: "secret" | "rare";
};

export type ChoiceRecord = {
  sceneId: string;
  sceneTitle: string;
  choiceId: string;
  choiceText: string;
  act: 1 | 2 | 3;
  year: number;
};

export type StoryRunState = {
  profile: PlayerProfile;
  traits: HiddenTraits;
  flags: StoryFlag[];
  currentSceneId: string;
  sceneHistory: string[];
  choices: ChoiceRecord[];
  recentChoiceTexts: string[];
  wildcardsUsed: WildCardEvent[];
  chaosUsed: boolean;
  chaosEvents: ChaosEvent[];
  memories: MemoryObject[];
  secretScenesFound: SecretSceneRecord[];
  miniGamesCompleted: string[];
  rareMomentsTriggered: MovieMoment[];
  missedMoments: string[];
  missedOpportunities?: string[];
  consequenceThreads: ConsequenceThread[];
  relationshipMoments: string[];
  turningPoints: string[];
  repeatedPatterns: string[];
  endingSeeds: string[];
  emotionalConsequences: string[];
  generatedTextHistory: string[];
  storySignature: string;
  replayCount: number;
  seed: number;
  butterflyEffects?: import("@/lib/butterfly-engine").ButterflyEffect[];
};

export type ConsequenceThread = {
  id: string;
  theme: string;
  createdBy: string;
  status: "open" | "resolved" | "unresolved";
  weight: number;
};

export type AIChoiceDraft = {
  text: string;
  effect: ChoiceEffect;
  flags: StoryFlag[];
  consequenceHint: string;
  delayedCallbackPossible: boolean;
};

export type AISceneDraft = {
  sceneTitle: string;
  narrationLines: string[];
  firstPersonCutType?: FirstPersonCut["kind"];
  environment: StoryEnvironment;
  mood: StoryMood;
  choices: AIChoiceDraft[];
};

export type AIConsequenceDraft = {
  consequenceLines: string[];
  updatedMood: StoryMood;
  memoryCallback?: string;
  delayedFlag?: StoryFlag;
};

export type AIEndingDraft = {
  endingTitle: string;
  identity: string;
  whatHappened: string;
  whatItCost: string;
  memoryCallback: string;
  finalLine: string;
  finalSceneObject: string;
};

export type EndingResult = {
  title: string;
  identity: string;
  outcome: string;
  tradeoff: string;
  reflection: string;
  finalLine: string;
  finalObject: string;
  hints: string[];
  quote: string;
  discoveredCount: number;
  totalMoments: number;
  memories: MemoryObject[];
  secretScenesFound: SecretSceneRecord[];
  rareMomentsTriggered: MovieMoment[];
  signature: string;
  isRepeatShape: boolean;
  environment: StoryEnvironment;
  mood: StoryMood;
};
