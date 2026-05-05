export type StoryEnvironment = "bedroom" | "studio" | "city" | "sunrise" | "void" | "spotlight";
export type StoryMood = "hopeful" | "tired" | "tense" | "focused" | "lost" | "breakthrough";

export type PlayerProfile = {
  name: string;
  age: number;
  country: string;
  goal: string;
  whatIf: string;
  discipline: number;
  risk: number;
  creativity: number;
  social: number;
};

export type HiddenTraits = {
  discipline: number;
  consistency: number;
  risk: number;
  creativity: number;
  social: number;
  luck: number;
};

export type StoryFlag =
  | "avoided_work"
  | "stayed_consistent"
  | "took_big_risk"
  | "ignored_opportunity"
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

export type StoryChoice = {
  id: string;
  text: string;
  effect: ChoiceEffect;
  flags?: StoryFlag[];
  nextScene?: string;
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
  wildcardsUsed: WildCardEvent[];
  seed: number;
};

export type EndingResult = {
  title: string;
  identity: string;
  outcome: string;
  tradeoff: string;
  reflection: string;
  finalLine: string;
  hints: string[];
  environment: StoryEnvironment;
  mood: StoryMood;
};
