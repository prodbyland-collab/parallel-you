import { applyTraitEffect, createInitialTraits, createSeed, maybeCreateWildCard } from "@/lib/random-engine";
import { normalizeProfile, personalize } from "@/lib/personalization";
import type { ChoiceRecord, PlayerProfile, StoryChoice, StoryFlag, StoryRunState, StoryScene } from "@/lib/story-types";

type SceneTemplate = Omit<StoryScene, "narration" | "choices"> & {
  narration: string[];
  choices: Array<Omit<StoryChoice, "text"> & { text: string }>;
};

const sceneTemplates: SceneTemplate[] = [
  {
    id: "opening-room",
    act: 1,
    title: "The Room Before Anything Changes",
    year: 2026,
    environment: "bedroom",
    mood: "hopeful",
    narration: [
      "{name} sits in {country} with {goal} still alive somewhere under the noise of the day.",
      "The old what-if keeps returning: {whatIf}. Tonight it feels less like memory and more like a dare."
    ],
    choices: [
      { id: "one-hour", text: "Give it one honest hour", effect: { discipline: 5, consistency: 6, creativity: 2 }, flags: ["stayed_consistent"] },
      { id: "rest", text: "Rest and try tomorrow", effect: { consistency: -2, discipline: -1 }, flags: ["avoided_work"] },
      { id: "message", text: "Tell someone the dream", effect: { social: 6, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-morning",
    act: 1,
    title: "The First Morning",
    year: 2026,
    environment: "sunrise",
    mood: "focused",
    narration: [
      "Morning arrives without drama. The world does not clap because {name} decided to care.",
      "That is the strange part. A life can start changing before it looks different."
    ],
    choices: [
      { id: "routine", text: "Make a small routine", effect: { discipline: 6, consistency: 7 }, flags: ["stayed_consistent"] },
      { id: "big-plan", text: "Make a huge plan", effect: { risk: 3, discipline: 1, consistency: -3 } },
      { id: "scroll", text: "Avoid the feeling", effect: { consistency: -6, creativity: -2 }, flags: ["avoided_work", "regret_repeated"] }
    ]
  },
  {
    id: "first-share",
    act: 1,
    title: "The First Share",
    year: 2026,
    environment: "studio",
    mood: "tense",
    narration: [
      "{name} makes one rough {work}. It is not polished. It is not ready. It is also real.",
      "The private dream asks to become visible."
    ],
    choices: [
      { id: "share", text: "Share it anyway", effect: { creativity: 6, risk: 5, social: 2 }, flags: ["took_big_risk"] },
      { id: "keep-private", text: "Keep it private", effect: { creativity: 3, risk: -3, social: -2 }, flags: ["isolated_self"] },
      { id: "ask-feedback", text: "Ask for honest feedback", effect: { social: 7, creativity: 3, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "comfortable-loop",
    act: 1,
    title: "The Comfortable Loop",
    year: 2026,
    environment: "bedroom",
    mood: "tired",
    narration: [
      "A week passes. Then another. Comfort starts speaking in a voice that sounds exactly like logic.",
      "Nothing is ruined yet. That is what makes the loop dangerous."
    ],
    choices: [
      { id: "break-loop", text: "Break the loop tonight", effect: { discipline: 7, consistency: 8 }, flags: ["returned_after_failure", "stayed_consistent"] },
      { id: "stay-loop", text: "Stay comfortable", effect: { consistency: -8, discipline: -5 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "small-help", text: "Ask someone to check in", effect: { social: 6, consistency: 4 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "pressure-invitation",
    act: 2,
    title: "The Invitation",
    year: 2027,
    environment: "city",
    mood: "tense",
    narration: [
      "An {opportunity} appears before {name} feels ready. It has bad timing, like most important things.",
      "Saying yes could stretch the story. Saying no would make the day easier."
    ],
    choices: [
      { id: "say-yes", text: "Say yes before ready", effect: { risk: 8, social: 4, consistency: -2 }, flags: ["took_big_risk"] },
      { id: "wait", text: "Wait for a better moment", effect: { discipline: 1, risk: -6 }, flags: ["ignored_opportunity"] },
      { id: "bring-friend", text: "Ask someone to come with you", effect: { social: 8, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "behind-year",
    act: 2,
    title: "The Year You Notice the Gap",
    year: 2027,
    environment: "void",
    mood: "lost",
    narration: [
      "The future does not accuse {name}. It simply shows the distance between intention and repetition.",
      "Some choices from earlier finally arrive with quiet consequences."
    ],
    choices: [
      { id: "return", text: "Return without drama", effect: { consistency: 9, discipline: 5 }, flags: ["returned_after_failure"] },
      { id: "quit", text: "Call it a phase", effect: { consistency: -10, creativity: -5 }, flags: ["quit_once", "regret_repeated"] },
      { id: "risk-reset", text: "Make a bold reset", effect: { risk: 7, discipline: 2, social: -2 }, flags: ["took_big_risk"] }
    ]
  },
  {
    id: "public-pressure",
    act: 2,
    title: "The Public Moment",
    year: 2027,
    environment: "city",
    mood: "tense",
    narration: [
      "{name}'s {work} reaches people outside the safe circle. The attention is smaller than a dream and bigger than comfort.",
      "For the first time, the story has witnesses."
    ],
    choices: [
      { id: "own-it", text: "Stand behind it", effect: { risk: 5, creativity: 6, social: 3 }, flags: ["took_big_risk"] },
      { id: "hide", text: "Disappear for a while", effect: { social: -8, consistency: -5 }, flags: ["isolated_self"] },
      { id: "learn", text: "Use the reaction to improve", effect: { creativity: 6, discipline: 4 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "relationship-cost",
    act: 2,
    title: "The People Around You",
    year: 2028,
    environment: "bedroom",
    mood: "tired",
    narration: [
      "Progress starts taking space. Messages wait longer. Some people understand. Some only feel the distance.",
      "{name} has to decide what kind of ambition can still love people back."
    ],
    choices: [
      { id: "make-time", text: "Make time for someone", effect: { social: 8, consistency: -2 }, flags: ["asked_for_help"] },
      { id: "lock-in", text: "Lock in alone", effect: { discipline: 6, consistency: 6, social: -7 }, flags: ["isolated_self"] },
      { id: "explain", text: "Explain what this means", effect: { social: 5, discipline: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "burnout-edge",
    act: 2,
    title: "The Edge of Burnout",
    year: 2028,
    environment: "void",
    mood: "tired",
    narration: [
      "The body begins editing the script. Focus turns heavy. The dream still matters, but the machine is overheating.",
      "This is where many versions of {name} mistake exhaustion for truth."
    ],
    choices: [
      { id: "repair", text: "Repair the routine", effect: { discipline: 3, consistency: 5, social: 2 }, flags: ["returned_after_failure"] },
      { id: "force", text: "Force another week", effect: { discipline: 5, consistency: 2, social: -4 }, flags: ["burned_out"] },
      { id: "vanish", text: "Vanish completely", effect: { consistency: -8, social: -8, creativity: -3 }, flags: ["isolated_self", "quit_once"] }
    ]
  },
  {
    id: "unexpected-door",
    act: 2,
    title: "The Door Nobody Promised",
    year: 2028,
    environment: "spotlight",
    mood: "hopeful",
    narration: [
      "A door opens because of old effort, strange timing, and one person who remembered {name}.",
      "Luck arrives, but it does not arrive empty-handed. It asks for a decision."
    ],
    choices: [
      { id: "step-through", text: "Step through", effect: { risk: 7, luck: 4, social: 4 }, flags: ["lucky_event_seen", "took_big_risk"] },
      { id: "prepare-first", text: "Prepare before answering", effect: { discipline: 5, consistency: 4, risk: -2 }, flags: ["stayed_consistent"] },
      { id: "miss-it", text: "Let it pass", effect: { risk: -7, luck: -4 }, flags: ["ignored_opportunity", "regret_repeated"] }
    ]
  },
  {
    id: "second-failure",
    act: 2,
    title: "The Second Failure",
    year: 2029,
    environment: "city",
    mood: "lost",
    narration: [
      "The second failure hurts differently. It is harder to romanticize and harder to explain.",
      "But somewhere inside it, {name} can hear the story asking: leave, or become real?"
    ],
    choices: [
      { id: "come-back", text: "Come back smaller", effect: { consistency: 8, discipline: 4 }, flags: ["returned_after_failure"] },
      { id: "blame-world", text: "Blame the timing", effect: { consistency: -6, luck: -3 }, flags: ["regret_repeated"] },
      { id: "ask-mentor", text: "Ask for help", effect: { social: 8, creativity: 3 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-real-proof",
    act: 2,
    title: "The First Real Proof",
    year: 2029,
    environment: "studio",
    mood: "breakthrough",
    narration: [
      "One result becomes undeniable. Not huge. Not final. Just real enough to silence the cruelest voice in the room.",
      "{name} sees proof that the life is responding."
    ],
    choices: [
      { id: "build-system", text: "Build around it", effect: { consistency: 8, discipline: 6 }, flags: ["breakthrough_seen", "stayed_consistent"] },
      { id: "chase-high", text: "Chase the high", effect: { risk: 6, consistency: -3 }, flags: ["breakthrough_seen"] },
      { id: "share-credit", text: "Share the moment", effect: { social: 6, creativity: 3 }, flags: ["breakthrough_seen", "asked_for_help"] }
    ]
  },
  {
    id: "major-turning-point",
    act: 3,
    title: "The Turning Point",
    year: 2030,
    environment: "spotlight",
    mood: "tense",
    narration: [
      "The story narrows into one decision. Not the only important one, just the one that reveals the others.",
      "{name} can protect the known life, or direct the next scene with shaking hands."
    ],
    choices: [
      { id: "choose-known", text: "Protect the known life", effect: { discipline: 2, risk: -6, social: 2 } },
      { id: "choose-next", text: "Direct the next scene", effect: { risk: 8, creativity: 5, luck: 3 }, flags: ["took_big_risk"] },
      { id: "choose-balanced", text: "Choose a smaller brave step", effect: { consistency: 6, social: 3, discipline: 3 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "who-stayed",
    act: 3,
    title: "Who Stayed",
    year: 2030,
    environment: "sunrise",
    mood: "hopeful",
    narration: [
      "By now, the audience has changed. Some people left the room. Some arrived late. Some were always there.",
      "{name} finally understands that every future has a cast."
    ],
    choices: [
      { id: "call-someone", text: "Call someone important", effect: { social: 8 }, flags: ["asked_for_help"] },
      { id: "stand-alone", text: "Stand alone for once", effect: { discipline: 5, social: -4 }, flags: ["isolated_self"] },
      { id: "thank-them", text: "Thank the people who stayed", effect: { social: 7, consistency: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "final-room",
    act: 3,
    title: "The Final Room",
    year: 2031,
    environment: "void",
    mood: "focused",
    narration: [
      "{name} returns to a room that feels familiar and impossible. Same person. Different gravity.",
      "The old what-if is still there, but it no longer gets to direct every scene."
    ],
    choices: [
      { id: "forgive", text: "Forgive the lost time", effect: { consistency: 4, social: 2 }, flags: ["returned_after_failure"] },
      { id: "keep-hunger", text: "Keep the hunger", effect: { risk: 4, discipline: 3 }, flags: ["stayed_consistent"] },
      { id: "begin-again", text: "Begin again quietly", effect: { creativity: 4, consistency: 5 }, flags: ["returned_after_failure"] }
    ]
  },
  {
    id: "ending-gate",
    act: 3,
    title: "Fade To What You Built",
    year: 2031,
    environment: "spotlight",
    mood: "breakthrough",
    narration: [
      "The last scene does not explain everything. It only shows what the choices have been making.",
      "This is the life {name} directed."
    ],
    choices: [
      { id: "see-ending", text: "See the ending", effect: {}, nextScene: "ending" }
    ]
  }
];

export function createInitialRun(profile: PlayerProfile): StoryRunState {
  const normalized = normalizeProfile(profile);
  const seed = createSeed();
  return {
    profile: normalized,
    traits: createInitialTraits(normalized, seed),
    flags: [],
    currentSceneId: "opening-room",
    sceneHistory: ["opening-room"],
    choices: [],
    wildcardsUsed: [],
    seed
  };
}

export function getScene(state: StoryRunState): StoryScene {
  const template = sceneTemplates.find((scene) => scene.id === state.currentSceneId) ?? sceneTemplates[0];
  return hydrateScene(template, state);
}

export function getAllScenes(state: StoryRunState) {
  return sceneTemplates.map((template) => hydrateScene(template, state));
}

export function chooseSceneOption(state: StoryRunState, choice: StoryChoice): StoryRunState {
  const scene = getScene(state);
  const nextId = choice.nextScene ?? getNextSceneId(state.currentSceneId);
  const flags = mergeFlags(state.flags, choice.flags ?? []);
  const choices: ChoiceRecord[] = [
    ...state.choices,
    {
      sceneId: scene.id,
      sceneTitle: scene.title,
      choiceId: choice.id,
      choiceText: choice.text,
      act: scene.act,
      year: scene.year
    }
  ];

  let nextState: StoryRunState = {
    ...state,
    traits: applyTraitEffect(state.traits, choice.effect),
    flags,
    choices,
    currentSceneId: nextId,
    sceneHistory: nextId === "ending" ? state.sceneHistory : [...state.sceneHistory, nextId]
  };

  const wildcard = maybeCreateWildCard(nextState, choices.length);
  if (wildcard) {
    nextState = {
      ...nextState,
      traits: applyTraitEffect(nextState.traits, wildcard.effect),
      flags: mergeFlags(nextState.flags, wildcard.flags),
      wildcardsUsed: [...nextState.wildcardsUsed, wildcard]
    };
  }

  return nextState;
}

export function isEnding(state: StoryRunState) {
  return state.currentSceneId === "ending";
}

function getNextSceneId(sceneId: string) {
  const index = sceneTemplates.findIndex((scene) => scene.id === sceneId);
  return sceneTemplates[index + 1]?.id ?? "ending";
}

function hydrateScene(template: SceneTemplate, state: StoryRunState): StoryScene {
  const narration = chooseNarrationVariation(template, state);
  return {
    ...template,
    narration: personalize(narration, state.profile),
    choices: template.choices.map((choice) => ({
      ...choice,
      text: personalize(choice.text, state.profile)
    }))
  };
}

function chooseNarrationVariation(template: SceneTemplate, state: StoryRunState) {
  if (template.id === "behind-year" && state.flags.includes("avoided_work")) {
    return "{name} feels the cost of the nights that looked harmless. The dream is not dead, but it is farther away than it needed to be.";
  }
  if (template.id === "first-real-proof" && state.flags.includes("stayed_consistent")) {
    return "The reward is late, almost rude in its timing, but it comes. The small repetitions finally leave evidence.";
  }
  if (template.id === "who-stayed" && state.flags.includes("isolated_self")) {
    return "The room is quieter than {name} expected. Success sounds different when fewer people are close enough to hear it.";
  }
  return template.narration[(state.seed + state.choices.length + template.id.length) % template.narration.length];
}

function mergeFlags(current: StoryFlag[], incoming: StoryFlag[]) {
  return Array.from(new Set([...current, ...incoming]));
}
