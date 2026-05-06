import type { StoryChoice, StoryRunState, StoryScene } from "@/lib/story-types";

export type ButterflyTheme =
  | "honesty"
  | "avoidance"
  | "connection"
  | "isolation"
  | "risk"
  | "perfectionism"
  | "consistency"
  | "self_sabotage"
  | "fear"
  | "returning";

export type ButterflyStatus = "active" | "resolved" | "ignored" | "paid_off";

export type ButterflyEffect = {
  id: string;
  originSceneId: string;
  originChoiceText: string;
  theme: ButterflyTheme;
  emotionalMeaning: string;
  immediateEffect: string;
  delayedEffect: string;
  callbackSceneHint: string;
  endingWeight: {
    identity?: string[];
    lesson?: string[];
    cost?: string[];
    finalObject?: string[];
  };
  status: ButterflyStatus;
  strength: number;
  createdAtChoiceIndex: number;
  lastTouchedChoiceIndex: number;
};

export function createButterflyEffect(choice: StoryChoice, scene: StoryScene, state: StoryRunState): ButterflyEffect {
  const theme = inferButterflyTheme(choice);
  const meaning = meaningForTheme(theme, choice.text);
  const id = `${theme}_${scene.id}_${state.choices.length + 1}_${Math.abs(hash(choice.text)).toString(36)}`;

  return {
    id,
    originSceneId: scene.id,
    originChoiceText: choice.text,
    theme,
    emotionalMeaning: meaning,
    immediateEffect: immediateEffectForTheme(theme),
    delayedEffect: delayedEffectForTheme(theme),
    callbackSceneHint: callbackHintForTheme(theme),
    endingWeight: endingWeightForTheme(theme),
    status: "active",
    strength: strengthForChoice(choice),
    createdAtChoiceIndex: state.choices.length + 1,
    lastTouchedChoiceIndex: state.choices.length + 1
  };
}

export function updateButterfliesAfterChoice(state: StoryRunState, choice: StoryChoice, scene: StoryScene) {
  const current = getButterflies(state);
  const newEffect = createButterflyEffect(choice, scene, state);
  const next = current.map((effect) => {
    if (shouldResolve(effect, choice)) {
      return { ...effect, status: "resolved" as const, strength: Math.min(100, effect.strength + 12), lastTouchedChoiceIndex: state.choices.length + 1 };
    }
    if (shouldIgnore(effect, choice)) {
      return { ...effect, status: "ignored" as const, strength: Math.min(100, effect.strength + 6), lastTouchedChoiceIndex: state.choices.length + 1 };
    }
    return effect;
  });

  return [...next, newEffect].slice(-18);
}

export function getButterflies(state: StoryRunState): ButterflyEffect[] {
  const raw = (state as StoryRunState & { butterflyEffects?: ButterflyEffect[] }).butterflyEffects;
  return Array.isArray(raw) ? raw : [];
}

export function getActiveButterflies(state: StoryRunState) {
  return getButterflies(state).filter((effect) => effect.status === "active" || effect.status === "ignored");
}

export function getStrongestButterfly(state: StoryRunState) {
  return [...getButterflies(state)].sort((a, b) => b.strength - a.strength)[0];
}

export function shouldShowButterflyFeedback(effect: ButterflyEffect) {
  return effect.strength >= 8 && ["honesty", "avoidance", "connection", "perfectionism", "risk"].includes(effect.theme);
}

export function butterflyFeedbackLine(effect: ButterflyEffect) {
  if (effect.theme === "avoidance" || effect.theme === "perfectionism" || effect.theme === "self_sabotage") return "This will come back.";
  return "Something shifted.";
}

export function inferButterflyTheme(choice: StoryChoice): ButterflyTheme {
  const behavior = choice.behaviorType;
  if (behavior) return behavior === "escape" ? "avoidance" : behavior;
  const text = choice.text.toLowerCase();
  const flags = new Set([...(choice.flags ?? []), ...(choice.flagsAdded ?? [])]);
  if (flags.has("ignored_message") || flags.has("avoided_work") || flags.has("did_nothing")) return "avoidance";
  if (flags.has("asked_for_help")) return "connection";
  if (flags.has("isolated_self")) return "isolation";
  if (flags.has("took_big_risk") || flags.has("sent_unfinished")) return "risk";
  if (flags.has("stayed_consistent") || flags.has("finished_badly")) return "consistency";
  if (flags.has("returned_after_failure")) return "returning";
  if (/truth|honest|tell/.test(text)) return "honesty";
  if (/perfect|fix again|not ready|polish|adjust/.test(text)) return "perfectionism";
  if (/hide|pretend|ignore|nothing|tomorrow|close/.test(text)) return "avoidance";
  if (/reply|ask|friend|message|help/.test(text)) return "connection";
  if (/send|yes|risk|before it feels/.test(text)) return "risk";
  if (/again|return|come back/.test(text)) return "returning";
  return "consistency";
}

function meaningForTheme(theme: ButterflyTheme, choiceText: string) {
  const choice = `You chose: ${choiceText}`;
  const meanings: Record<ButterflyTheme, string> = {
    honesty: "You let the real answer exist.",
    avoidance: "You made the room easier for a moment.",
    connection: "You let someone get closer to the truth.",
    isolation: "You kept the hard part private.",
    risk: "You moved before it felt safe.",
    perfectionism: "You protected the work by not finishing it.",
    consistency: "You did the small thing anyway.",
    self_sabotage: "You stepped away right when it started to matter.",
    fear: "You let fear choose the shape of the day.",
    returning: "You came back after leaving."
  };
  return `${meanings[theme]} ${choice}`;
}

function immediateEffectForTheme(theme: ButterflyTheme) {
  return ({
    honesty: "The room gets quieter after the truth.",
    avoidance: "The room feels easier for a second.",
    connection: "The message no longer belongs only to you.",
    isolation: "Nothing interrupts you. That is not the same as peace.",
    risk: "Your stomach drops after you press send.",
    perfectionism: "The work stays safe. Unfinished, but safe.",
    consistency: "Nothing dramatic happens. The small proof remains.",
    self_sabotage: "You leave before anyone can judge it.",
    fear: "You choose the smaller room.",
    returning: "The old thing is still there when you come back."
  })[theme];
}

function delayedEffectForTheme(theme: ButterflyTheme) {
  return ({
    honesty: "Someone remembers what you said.",
    avoidance: "The avoided thing returns with a little more weight.",
    connection: "A person shows up again because you did not disappear.",
    isolation: "The silence becomes part of the story.",
    risk: "The rough thing creates a consequence you could not plan.",
    perfectionism: "Another clean beginning appears. Still nothing finished.",
    consistency: "The quiet work starts to stack up.",
    self_sabotage: "You meet the cost of leaving early.",
    fear: "The safe choice starts asking for rent.",
    returning: "Coming back becomes more important than leaving."
  })[theme];
}

function callbackHintForTheme(theme: ButterflyTheme) {
  return ({
    honesty: "Bring back the sentence they remember.",
    avoidance: "Bring back the unread message, open tab, or unfinished object.",
    connection: "Bring back the person who noticed or asked.",
    isolation: "Show the room becoming too quiet.",
    risk: "Show a reply, fallout, or strange opportunity from the risk.",
    perfectionism: "Show another renamed file or unfinished version.",
    consistency: "Show a small result that only exists because user returned.",
    self_sabotage: "Show the moment where leaving early cost something.",
    fear: "Show the safety turning into regret.",
    returning: "Show the same object waiting without judgment."
  })[theme];
}

function endingWeightForTheme(theme: ButterflyTheme) {
  return ({
    honesty: { identity: ["The One Who Finally Answered"], lesson: ["One honest reply changed more than the perfect plan."], cost: ["comfort"], finalObject: ["sent message"] },
    avoidance: { identity: ["The One Who Kept Leaving"], lesson: ["You kept waiting for it to feel easier. It didn't."], cost: ["time", "truth"], finalObject: ["unread message", "open tab"] },
    connection: { identity: ["The Person Who Let Someone In"], lesson: ["You did not need a crowd. One person changed the room."], cost: ["privacy"], finalObject: ["phone screen"] },
    isolation: { identity: ["The Quiet Room"], lesson: ["Silence protected you until it started keeping you."], cost: ["connection"], finalObject: ["phone face down"] },
    risk: { identity: ["The Person Who Sent It Scared"], lesson: ["You did not become fearless. You just sent it scared."], cost: ["control"], finalObject: ["exported file"] },
    perfectionism: { identity: ["The Almost Finisher"], lesson: ["You were not afraid of starting. You were afraid of being seen finishing."], cost: ["finished work"], finalObject: ["final_final_3"] },
    consistency: { identity: ["The Quiet Builder"], lesson: ["Nothing changed all at once. The proof just got harder to ignore."], cost: ["sleep"], finalObject: ["cold coffee"] },
    self_sabotage: { identity: ["The One Who Left Early"], lesson: ["You left before the hard part could become real."], cost: ["opportunity"], finalObject: ["closed laptop"] },
    fear: { identity: ["The Smaller Room"], lesson: ["The safe choice still had a cost."], cost: ["space"], finalObject: ["locked screen"] },
    returning: { identity: ["The One Who Came Back"], lesson: ["Coming back counted more than leaving ruined."], cost: ["pride"], finalObject: ["unfinished notebook"] }
  })[theme];
}

function strengthForChoice(choice: StoryChoice) {
  const flags = choice.flags ?? choice.flagsAdded ?? [];
  let score = 7;
  if (choice.delayedCallbackPossible) score += 5;
  if (choice.endingInfluence) score += 4;
  if (flags.includes("did_nothing") || flags.includes("ignored_message") || flags.includes("sent_unfinished")) score += 5;
  return Math.min(100, score);
}

function shouldResolve(effect: ButterflyEffect, choice: StoryChoice) {
  const theme = inferButterflyTheme(choice);
  return (effect.theme === "avoidance" && ["honesty", "connection", "returning"].includes(theme)) ||
    (effect.theme === "perfectionism" && ["risk", "consistency"].includes(theme)) ||
    (effect.theme === "isolation" && theme === "connection") ||
    (effect.theme === "fear" && theme === "risk");
}

function shouldIgnore(effect: ButterflyEffect, choice: StoryChoice) {
  const theme = inferButterflyTheme(choice);
  return effect.theme === theme && ["avoidance", "perfectionism", "isolation", "self_sabotage"].includes(theme);
}

function hash(value: string) {
  return value.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}
