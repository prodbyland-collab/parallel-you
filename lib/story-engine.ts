import { applyTraitEffect, createInitialTraits, createSeed, maybeCreateWildCard, pickWeighted, seededRandom } from "@/lib/random-engine";
import { normalizeProfile, personalizeScene } from "@/lib/personalization";
import type { ChaosEvent, ChoiceRecord, MemoryObject, MovieMoment, PlayerProfile, SecretSceneRecord, StoryChoice, StoryFlag, StoryRunState, StoryScene } from "@/lib/story-types";

type SceneTemplate = Omit<StoryScene, "narration" | "choices"> & {
  narration: string[];
  choices: Array<Omit<StoryChoice, "text"> & { text: string }>;
};

const sceneTemplates: SceneTemplate[] = [
  {
    id: "opening-room",
    act: 1,
    title: "The Night You Start Thinking",
    year: 2026,
    environment: "bedroom",
    mood: "hopeful",
    memoryObject: {
      id: "notebook",
      name: "Notebook",
      description: "A notebook with old plans, crossed-out ideas, and one page that still feels possible.",
      quote: "I started with one page.",
      effect: { creativity: 3, consistency: 2 }
    },
    miniGame: "hold",
    narration: [
      "{name} is in {country}, carrying the life they described: {doneSoFar}.",
      "The question {whatIf} still hurts a little, but tonight it turns into something useful: a reason to finally start."
    ],
    choices: [
      { id: "one-hour", text: "Set a 20-minute timer and actually start", effect: { discipline: 5, consistency: 6, creativity: 2 }, flags: ["stayed_consistent"] },
      { id: "rest", text: "Tell yourself you are too tired and go to sleep", effect: { consistency: -2, discipline: -1 }, flags: ["avoided_work"] },
      { id: "message", text: "Send an awkward honest text: I need a push", effect: { social: 6, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-morning",
    act: 1,
    title: "The Morning After You Decide",
    year: 2026,
    environment: "sunrise",
    mood: "focused",
    moodShift: {
      from: "focused",
      to: "tense",
      line: "The calm breaks when your phone lights up and tries to pull you away."
    },
    narration: [
      "The next morning, nothing looks different. The world does not know {name} made a promise last night.",
      "That makes the first real test simple: keep one small promise, or let the day pull everything back to normal."
    ],
    choices: [
      { id: "routine", text: "Do the tiny habit before checking your phone", effect: { discipline: 6, consistency: 7 }, flags: ["stayed_consistent"] },
      { id: "big-plan", text: "Make a perfect plan instead of doing the work", effect: { risk: 3, discipline: 1, consistency: -3 } },
      { id: "scroll", text: "Open your phone for five minutes and lose an hour", effect: { consistency: -6, creativity: -2 }, flags: ["avoided_work", "regret_repeated"] }
    ]
  },
  {
    id: "first-share",
    act: 1,
    title: "The First Thing You Share",
    year: 2026,
    environment: "studio",
    mood: "tense",
    memoryObject: {
      id: "voice-note",
      name: "Voice note",
      description: "A shaky recording saved at 1:13 AM, before confidence had time to leave.",
      quote: "It sounded rough, but it was mine.",
      effect: { creativity: 4, risk: 2 }
    },
    miniGame: "tap-particles",
    narration: [
      "After a few small tries, {name} finally makes a rough {work}. It is not perfect, but it is real.",
      "Now the story asks for a harder step: keep it hidden where it feels safe, or let one person see it."
    ],
    choices: [
      { id: "share", text: "Post the rough version before you delete it", effect: { creativity: 6, risk: 5, social: 2 }, flags: ["took_big_risk"] },
      { id: "keep-private", text: "Save it in drafts and promise to fix it later", effect: { creativity: 3, risk: -3, social: -2 }, flags: ["isolated_self"] },
      { id: "ask-feedback", text: "Send it to one person who will tell the truth", effect: { social: 7, creativity: 3, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "comfortable-loop",
    act: 1,
    title: "The Week That Keeps Repeating",
    year: 2026,
    environment: "bedroom",
    mood: "tired",
    narration: [
      "A few days pass. Then a week. The first spark is still there, but normal life starts covering it again.",
      "This is where the story can quietly shrink: not because {name} fails loudly, but because the same easy excuses keep winning."
    ],
    choices: [
      { id: "break-loop", text: "Do the smallest useful task before bed", effect: { discipline: 7, consistency: 8 }, flags: ["returned_after_failure", "stayed_consistent"] },
      { id: "stay-loop", text: "Say tomorrow again and avoid thinking about it", effect: { consistency: -8, discipline: -5 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "small-help", text: "Ask a friend to check on you tomorrow", effect: { social: 6, consistency: 4 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "pressure-invitation",
    act: 2,
    title: "The Offer That Comes Too Soon",
    year: 2027,
    environment: "city",
    mood: "tense",
    relationshipMoment: {
      role: "stranger",
      name: "Ari",
      line: "I do not know why, but your work stayed in my head."
    },
    miniGame: "timed-choice",
    narration: [
      "Because of the small moves before, an {opportunity} appears earlier than expected. It feels too soon, which is exactly why it matters.",
      "{name} has to decide whether to stay comfortable or try while still feeling unprepared."
    ],
    choices: [
      { id: "say-yes", text: "Reply yes before you talk yourself out of it", effect: { risk: 8, social: 4, consistency: -2 }, flags: ["took_big_risk"] },
      { id: "wait", text: "Ask for more time because you feel unready", effect: { discipline: 1, risk: -6 }, flags: ["ignored_opportunity"] },
      { id: "bring-friend", text: "Screenshot the message and ask a friend what to do", effect: { social: 8, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "behind-year",
    act: 2,
    title: "The Year You Notice the Pattern",
    year: 2027,
    environment: "void",
    mood: "lost",
    narration: [
      "By now, the choices are starting to show. Every skipped night and every small win has left a mark.",
      "{name} can see the pattern clearly: the future is not built by one big decision, but by what keeps getting repeated."
    ],
    choices: [
      { id: "return", text: "Admit you fell off and restart smaller", effect: { consistency: 9, discipline: 5 }, flags: ["returned_after_failure"] },
      { id: "quit", text: "Tell yourself maybe this is not for you", effect: { consistency: -10, creativity: -5 }, flags: ["quit_once", "regret_repeated"] },
      { id: "risk-reset", text: "Delete the old plan and try a new approach", effect: { risk: 7, discipline: 2, social: -2 }, flags: ["took_big_risk"] }
    ]
  },
  {
    id: "public-pressure",
    act: 2,
    title: "When Strangers Start Noticing",
    year: 2027,
    environment: "city",
    mood: "tense",
    narration: [
      "The {work} starts reaching people who do not already know {name}. A stranger reacts, and another person quietly stays to watch.",
      "It is not fame. It is just the first sign that the work can travel further than the room where it began."
    ],
    choices: [
      { id: "own-it", text: "Keep showing up even though people can judge it", effect: { risk: 5, creativity: 6, social: 3 }, flags: ["took_big_risk"] },
      { id: "hide", text: "Go quiet because attention feels uncomfortable", effect: { social: -8, consistency: -5 }, flags: ["isolated_self"] },
      { id: "learn", text: "Read the feedback and improve one specific thing", effect: { creativity: 6, discipline: 4 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "relationship-cost",
    act: 2,
    title: "The People Who Miss You",
    year: 2028,
    environment: "bedroom",
    mood: "tired",
    memoryObject: {
      id: "message-draft",
      name: "Message draft",
      description: "A half-written reply that says what you were avoiding.",
      quote: "The message was small, but it changed the night.",
      effect: { social: 4, discipline: 1 }
    },
    relationshipMoment: {
      role: "old connection",
      name: "Nia",
      line: "You keep saying soon. I miss when soon meant tonight."
    },
    narration: [
      "As the goal takes more space, other parts of life start to feel the change. Messages wait. Plans become maybes.",
      "Someone misses the version of {name} who had more time, and {name} has to decide what success is allowed to cost."
    ],
    choices: [
      { id: "make-time", text: "Put the work down and see them tonight", effect: { social: 8, consistency: -2 }, flags: ["asked_for_help"] },
      { id: "lock-in", text: "Ignore the message and keep working", effect: { discipline: 6, consistency: 6, social: -7 }, flags: ["isolated_self"] },
      { id: "explain", text: "Reply honestly instead of pretending you are fine", effect: { social: 5, discipline: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "burnout-edge",
    act: 2,
    title: "When Your Body Says Stop",
    year: 2028,
    environment: "void",
    mood: "tired",
    moodShift: {
      from: "tired",
      to: "hopeful",
      line: "Then the moment becomes strangely funny, because even the ceiling fan sounds like it is clapping."
    },
    narration: [
      "The pressure finally reaches the body. Focus gets heavy, sleep matters more, and even hope starts asking for a break.",
      "This does not mean the dream is over. It means {name} has to learn the difference between discipline and punishment."
    ],
    choices: [
      { id: "repair", text: "Cancel one thing and actually recover", effect: { discipline: 3, consistency: 5, social: 2 }, flags: ["returned_after_failure"] },
      { id: "force", text: "Drink coffee and push through anyway", effect: { discipline: 5, consistency: 2, social: -4 }, flags: ["burned_out"] },
      { id: "vanish", text: "Stop replying to people and disappear", effect: { consistency: -8, social: -8, creativity: -3 }, flags: ["isolated_self", "quit_once"] }
    ]
  },
  {
    id: "unexpected-door",
    act: 2,
    title: "The Door That Opens Anyway",
    year: 2028,
    environment: "spotlight",
    mood: "hopeful",
    memoryObject: {
      id: "receipt",
      name: "Receipt",
      description: "A receipt from the night you almost said no, folded into your pocket.",
      quote: "The night looked ordinary until it wasn't.",
      effect: { luck: 7, risk: 2 }
    },
    movieMoment: {
      id: "future-self-glimpse",
      title: "Future You in the Hallway",
      description: "For one second, you see a version of yourself who already got through this.",
      rarity: "rare"
    },
    narration: [
      "After the hard stretch, a new door opens because someone remembers the work {name} already put out.",
      "It feels like luck, but it is also connected to every small choice before this. Now the question is whether {name} will walk through."
    ],
    choices: [
      { id: "step-through", text: "Say yes, then figure it out step by step", effect: { risk: 7, luck: 4, social: 4 }, flags: ["lucky_event_seen", "took_big_risk"] },
      { id: "prepare-first", text: "Ask clear questions and prepare properly", effect: { discipline: 5, consistency: 4, risk: -2 }, flags: ["stayed_consistent"] },
      { id: "miss-it", text: "Leave the message unanswered until it is too late", effect: { risk: -7, luck: -4 }, flags: ["ignored_opportunity", "regret_repeated"] }
    ]
  },
  {
    id: "second-failure",
    act: 2,
    title: "The Failure That Feels Personal",
    year: 2029,
    environment: "city",
    mood: "lost",
    relationshipMoment: {
      role: "mentor",
      name: "Mako",
      line: "You are not behind. You just need a better edit."
    },
    narration: [
      "Not everything goes well. One attempt falls apart, and this time {name} cannot explain it away as only bad luck.",
      "That makes the moment painful, but also useful. The story is asking whether {name} will stop, blame the world, or learn."
    ],
    choices: [
      { id: "come-back", text: "Fix the obvious mistake and try again", effect: { consistency: 8, discipline: 4 }, flags: ["returned_after_failure"] },
      { id: "blame-world", text: "Say it was unfair and avoid looking at your part", effect: { consistency: -6, luck: -3 }, flags: ["regret_repeated"] },
      { id: "ask-mentor", text: "Ask someone better how they would handle it", effect: { social: 8, creativity: 3 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-real-proof",
    act: 2,
    title: "The First Real Proof",
    year: 2029,
    environment: "studio",
    mood: "breakthrough",
    memoryObject: {
      id: "project-file",
      name: "Unfinished project file",
      description: "A messy file with a bad name, many versions, and one part that finally works.",
      quote: "The unfinished thing was still worth opening.",
      effect: { creativity: 6, consistency: 2 }
    },
    movieMoment: {
      id: "slow-motion-breakthrough",
      title: "Slow-Motion Breakthrough",
      description: "The room gets quiet and a small win feels huge.",
      rarity: "rare"
    },
    narration: [
      "After coming back from the failure, one result finally feels real. It is not huge, but it proves the work can lead somewhere.",
      "For the first time, {name} can connect the whole path: the small start, the scary share, the setback, and this proof."
    ],
    choices: [
      { id: "build-system", text: "Write down what worked and make it a routine", effect: { consistency: 8, discipline: 6 }, flags: ["breakthrough_seen", "stayed_consistent"] },
      { id: "chase-high", text: "Try to force another win right away", effect: { risk: 6, consistency: -3 }, flags: ["breakthrough_seen"] },
      { id: "share-credit", text: "Call someone and say: this finally worked", effect: { social: 6, creativity: 3 }, flags: ["breakthrough_seen", "asked_for_help"] }
    ]
  },
  {
    id: "major-turning-point",
    act: 3,
    title: "The Choice You Cannot Practice",
    year: 2030,
    environment: "spotlight",
    mood: "tense",
    miniGame: "drag-memory",
    narration: [
      "With proof behind them, {name} reaches a bigger choice. It is not about one perfect decision; it is about what kind of life to keep building.",
      "{name} can protect what is familiar, take a bigger risk, or choose a brave path that still feels sustainable."
    ],
    choices: [
      { id: "choose-known", text: "Choose stability, even if progress is slower", effect: { discipline: 2, risk: -6, social: 2 } },
      { id: "choose-next", text: "Take the bigger risk because you might regret not trying", effect: { risk: 8, creativity: 5, luck: 3 }, flags: ["took_big_risk"] },
      { id: "choose-balanced", text: "Grow steadily and protect your peace", effect: { consistency: 6, social: 3, discipline: 3 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "who-stayed",
    act: 3,
    title: "The People Who Stayed",
    year: 2030,
    environment: "sunrise",
    mood: "hopeful",
    memoryObject: {
      id: "old-photo",
      name: "Old photo",
      description: "A blurry photo from a normal day with someone who kept showing up.",
      quote: "Someone was there before it worked.",
      effect: { social: 5, luck: 1 }
    },
    narration: [
      "After the big choice, {name} looks around and notices who is still close. Some people left, some arrived late, and some stayed quietly the whole time.",
      "The goal still matters, but now {name} understands that a future feels different depending on who gets to share it."
    ],
    choices: [
      { id: "call-someone", text: "Call the person who kept believing in you", effect: { social: 8 }, flags: ["asked_for_help"] },
      { id: "stand-alone", text: "Keep the win private because sharing feels hard", effect: { discipline: 5, social: -4 }, flags: ["isolated_self"] },
      { id: "thank-them", text: "Send a real thank-you before you forget", effect: { social: 7, consistency: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "final-room",
    act: 3,
    title: "The Room After It All",
    year: 2031,
    environment: "void",
    mood: "focused",
    memoryObject: {
      id: "alarm-clock",
      name: "Alarm clock",
      description: "The alarm you slept through, then learned to respect.",
      quote: "Even late mornings taught me something.",
      effect: { consistency: 3, discipline: 2 }
    },
    movieMoment: {
      id: "fake-ending",
      title: "The Ending That Keeps Going",
      description: "The room goes quiet, then one small light turns back on.",
      rarity: "rare"
    },
    narration: [
      "Near the end, {name} returns to a room that looks almost like the first night. Same walls, different person.",
      "The old question is still there, but it no longer runs the story. It has become part of the reason {name} kept going."
    ],
    choices: [
      { id: "forgive", text: "Stop punishing yourself for starting late", effect: { consistency: 4, social: 2 }, flags: ["returned_after_failure"] },
      { id: "keep-hunger", text: "Keep improving, but speak to yourself kindly", effect: { risk: 4, discipline: 3 }, flags: ["stayed_consistent"] },
      { id: "begin-again", text: "Pick one small thing to begin again tomorrow", effect: { creativity: 4, consistency: 5 }, flags: ["returned_after_failure"] }
    ]
  },
  {
    id: "ending-gate",
    act: 3,
    title: "See the Life You Chose",
    year: 2031,
    environment: "spotlight",
    mood: "breakthrough",
    narration: [
      "The final scene gathers everything: where {name} started, what they had already lived through, the missed days, the people, the risks, the proof, and the memories collected along the way.",
      "This is not the only life {name} could have lived. It is the one these choices created this time."
    ],
    choices: [
      { id: "see-ending", text: "See how this life turned out", effect: {}, nextScene: "ending" }
    ]
  }
];

const secretSceneTemplates: SceneTemplate[] = [
  {
    id: "secret-room-smaller",
    act: 2,
    title: "The Room Feels Smaller",
    year: 2028,
    environment: "bedroom",
    mood: "lost",
    secret: true,
    moodShift: {
      from: "lost",
      to: "tense",
      line: "The room has not changed, but it suddenly feels harder to breathe."
    },
    narration: [
      "{name} has avoided the work enough times that the story stops moving forward for a moment.",
      "Nothing dramatic happens, and that is the danger. The room feels smaller because the same choice keeps repeating."
    ],
    choices: [
      { id: "tiny-exit", text: "Open the task and do only the first step", effect: { consistency: 7, discipline: 3 }, flags: ["returned_after_failure"] },
      { id: "decorate-cage", text: "Clean, organize, and avoid the real work", effect: { consistency: -5, creativity: 2 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "call-it-out", text: "Say out loud: I am stuck, then do one thing", effect: { risk: 3, consistency: 5 }, flags: ["returned_after_failure"] }
    ]
  },
  {
    id: "secret-quiet-breakthrough",
    act: 2,
    title: "The Quiet Breakthrough",
    year: 2029,
    environment: "sunrise",
    mood: "breakthrough",
    secret: true,
    movieMoment: {
      id: "silent-scene",
      title: "A Quiet Scene With No Choices",
      description: "No speech, no big celebration, just morning light getting brighter.",
      rarity: "secret"
    },
    narration: [
      "{name} keeps doing the small habit even when it feels boring and nobody is watching.",
      "Then the story quietly changes. There is proof now, and it came from staying with the work longer than usual."
    ],
    choices: [
      { id: "keep-quiet", text: "Keep doing it quietly without posting about it", effect: { consistency: 9, discipline: 5 }, flags: ["stayed_consistent", "breakthrough_seen"] },
      { id: "share-small-win", text: "Show one person and let yourself feel proud", effect: { social: 5, creativity: 3 }, flags: ["asked_for_help", "breakthrough_seen"] },
      { id: "raise-standard", text: "Add one harder step to the routine", effect: { discipline: 6, consistency: 4 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "secret-night-changes",
    act: 3,
    title: "The Night Everything Changes",
    year: 2030,
    environment: "city",
    mood: "tense",
    secret: true,
    relationshipMoment: {
      role: "friend",
      name: "Lev",
      line: "This might be a terrible idea. It also might be the story."
    },
    movieMoment: {
      id: "dream-sequence",
      title: "Dream Scene",
      description: "The city turns into light, and every risky yes comes back at once.",
      rarity: "secret"
    },
    narration: [
      "Because {name} has already taken risks, the night offers one more chance that feels bigger than the others.",
      "It could be a mistake, or it could become the story people remember. Either way, it will change what happens next."
    ],
    choices: [
      { id: "take-shortcut", text: "Take the shortcut and accept the messy week", effect: { risk: 10, luck: 6, consistency: -2 }, flags: ["took_big_risk", "lucky_event_seen"] },
      { id: "bring-friend", text: "Ask a friend to do it with you so you do not freeze", effect: { social: 7, risk: 5 }, flags: ["asked_for_help", "took_big_risk"] },
      { id: "walk-away-smiling", text: "Say no because your current progress matters", effect: { discipline: 5, consistency: 5 }, flags: ["stayed_consistent"] }
    ]
  }
];

const chaosEvents: ChaosEvent[] = [
  {
    id: "elevator-invite",
    title: "Unexpected Email",
    kind: "strange opportunity",
    narration: "An email lands while you are doing something normal. It is a real chance, and you do not feel ready.",
    effect: { luck: 8, risk: 5, social: 3 },
    flags: ["lucky_event_seen", "took_big_risk"]
  },
  {
    id: "delete-the-plan",
    title: "Simpler Plan",
    kind: "impulsive decision",
    narration: "You stop trying to make the perfect plan and do the simplest next step instead.",
    effect: { consistency: 7, creativity: 3, discipline: -1 },
    flags: ["returned_after_failure", "stayed_consistent"]
  },
  {
    id: "wrong-number-oracle",
    title: "Random Compliment",
    kind: "unexpected message",
    narration: "Someone casually says your work helped them. They move on, but your whole night changes.",
    effect: { luck: 5, creativity: 4, social: 2 },
    flags: ["lucky_event_seen"]
  },
  {
    id: "shower-lightning",
    title: "Idea in the Notes App",
    kind: "sudden creative idea",
    narration: "A small idea appears while you are half distracted, so you type it into your notes app.",
    effect: { creativity: 9, consistency: 2 },
    flags: ["breakthrough_seen"]
  },
  {
    id: "shortcut-with-teeth",
    title: "Missed Deadline",
    kind: "risky shortcut",
    narration: "You miss a deadline and have to send an honest message instead of hiding.",
    effect: { risk: 8, luck: 4, social: -2 },
    flags: ["took_big_risk"]
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
    chaosUsed: false,
    chaosEvents: [],
    memories: [],
    secretScenesFound: [],
    miniGamesCompleted: [],
    rareMomentsTriggered: [],
    seed
  };
}

export function getScene(state: StoryRunState): StoryScene {
  const template = [...sceneTemplates, ...secretSceneTemplates].find((scene) => scene.id === state.currentSceneId) ?? sceneTemplates[0];
  return hydrateScene(template, state);
}

export function getAllScenes(state: StoryRunState) {
  const secretScenes = secretSceneTemplates.filter((template) => state.sceneHistory.includes(template.id));
  return [...sceneTemplates, ...secretScenes].map((template) => hydrateScene(template, state));
}

export function chooseSceneOption(state: StoryRunState, choice: StoryChoice): StoryRunState {
  const scene = getScene(state);
  const nextId = choice.nextScene ?? getNextSceneId(state);
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
    sceneHistory: nextId === "ending" ? state.sceneHistory : appendUnique(state.sceneHistory, nextId)
  };

  nextState = recordSceneDiscoveries(nextState, nextId);

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

export function triggerChaosEvent(state: StoryRunState): StoryRunState {
  if (state.chaosUsed) return state;
  const random = seededRandom(state.seed + state.choices.length * 313 + state.currentSceneId.length * 17);
  const flags = new Set(state.flags);
  const event = pickWeighted(
    random,
    chaosEvents.map((item) => ({
      item,
      weight:
        10 +
        (item.kind === "risky shortcut" && flags.has("took_big_risk") ? 8 : 0) +
        (item.kind === "unexpected message" && flags.has("asked_for_help") ? 7 : 0) +
        (item.kind === "sudden creative idea" && state.traits.creativity > 62 ? 7 : 0) +
        (item.kind === "strange opportunity" && state.traits.luck > 60 ? 6 : 0)
    }))
  );

  return {
    ...state,
    traits: applyTraitEffect(state.traits, event.effect),
    flags: mergeFlags(state.flags, event.flags),
    chaosUsed: true,
    chaosEvents: [...state.chaosEvents, event]
  };
}

export function collectMemoryObject(state: StoryRunState, memory: MemoryObject): StoryRunState {
  if (state.memories.some((item) => item.id === memory.id)) return state;
  return {
    ...state,
    traits: applyTraitEffect(state.traits, memory.effect),
    memories: [...state.memories, memory]
  };
}

export function completeMiniGame(state: StoryRunState, miniGameId: string): StoryRunState {
  if (state.miniGamesCompleted.includes(miniGameId)) return state;
  return {
    ...state,
    traits: applyTraitEffect(state.traits, { consistency: 2, luck: 1 }),
    miniGamesCompleted: [...state.miniGamesCompleted, miniGameId]
  };
}

function getNextSceneId(state: StoryRunState) {
  const secretSceneId = getUnlockedSecretSceneId(state);
  if (secretSceneId) return secretSceneId;

  const index = sceneTemplates.findIndex((scene) => scene.id === state.currentSceneId);
  if (index === -1) return getNextSceneAfterSecret(state.currentSceneId);
  return sceneTemplates[index + 1]?.id ?? "ending";
}

function getNextSceneAfterSecret(sceneId: string) {
  if (sceneId === "secret-room-smaller") return "pressure-invitation";
  if (sceneId === "secret-quiet-breakthrough") return "major-turning-point";
  if (sceneId === "secret-night-changes") return "who-stayed";
  return "ending";
}

function getUnlockedSecretSceneId(state: StoryRunState) {
  const history = new Set(state.sceneHistory);
  const avoidedWorkCount = countChoiceIds(state, ["rest", "scroll", "stay-loop", "hide", "vanish"]);
  const consistentCount = countChoiceIds(state, ["one-hour", "routine", "break-loop", "learn", "prepare-first", "build-system", "choose-balanced"]);
  const riskCount = countChoiceIds(state, ["share", "say-yes", "risk-reset", "own-it", "step-through", "choose-next"]);

  if (state.currentSceneId === "comfortable-loop" && avoidedWorkCount >= 2 && !history.has("secret-room-smaller")) return "secret-room-smaller";
  if (state.currentSceneId === "first-real-proof" && consistentCount >= 4 && !history.has("secret-quiet-breakthrough")) return "secret-quiet-breakthrough";
  if (state.currentSceneId === "major-turning-point" && riskCount >= 3 && !history.has("secret-night-changes")) return "secret-night-changes";
  return null;
}

function countChoiceIds(state: StoryRunState, choiceIds: string[]) {
  const wanted = new Set(choiceIds);
  return state.choices.filter((choice) => wanted.has(choice.choiceId)).length;
}

function recordSceneDiscoveries(state: StoryRunState, sceneId: string) {
  const template = [...sceneTemplates, ...secretSceneTemplates].find((scene) => scene.id === sceneId);
  if (!template) return state;

  const secretRecord: SecretSceneRecord | null = template.secret
    ? {
        id: template.id,
        title: template.title,
        unlockedBy: getSecretUnlockText(template.id)
      }
    : null;

  const movieMoment: MovieMoment | undefined = template.movieMoment;

  return {
    ...state,
    secretScenesFound: secretRecord && !state.secretScenesFound.some((scene) => scene.id === secretRecord.id)
      ? [...state.secretScenesFound, secretRecord]
      : state.secretScenesFound,
    rareMomentsTriggered: movieMoment && !state.rareMomentsTriggered.some((moment) => moment.id === movieMoment.id)
      ? [...state.rareMomentsTriggered, movieMoment]
      : state.rareMomentsTriggered
  };
}

function hydrateScene(template: SceneTemplate, state: StoryRunState): StoryScene {
  const narration = chooseNarrationVariation(template, state);
  return personalizeScene({
    ...template,
    narration,
    choices: template.choices
  }, state.profile);
}

function chooseNarrationVariation(template: SceneTemplate, state: StoryRunState) {
  const previousChoice = state.choices[state.choices.length - 1];
  const choiceAwareNarration = getChoiceAwareNarration(template, state, previousChoice?.choiceId);
  if (choiceAwareNarration) return choiceAwareNarration;

  if (template.id === "behind-year" && state.flags.includes("avoided_work")) {
    return "{name} starts to feel the cost of the nights that seemed harmless. The dream is not gone, but it feels farther away because it has been waiting for action.";
  }
  if (template.id === "first-real-proof" && state.flags.includes("stayed_consistent")) {
    return "The reward comes late, but it comes. The small repeated actions finally leave proof, and {name} can see that the boring days were not wasted.";
  }
  if (template.id === "who-stayed" && state.flags.includes("isolated_self")) {
    return "The room is quieter than {name} expected. Success feels different when fewer people are close enough to share it, so this moment becomes about who still matters.";
  }
  return template.narration.join(" ");
}

function getChoiceAwareNarration(template: SceneTemplate, state: StoryRunState, previousChoiceId?: string) {
  if (!previousChoiceId) return null;
  const detail = getRunDetail(state);

  const lines: Record<string, Partial<Record<string, string>>> = {
    "first-morning": {
      "one-hour": "{name} wakes up knowing they actually started last night. It was only 20 minutes, but it makes the morning feel different.",
      rest: "{name} wakes up after choosing rest. The goal is still there, and now the question is whether rest becomes recovery or another delay.",
      message: "The morning starts with the memory of that honest text. Asking for support made the goal feel less private and a little more real."
    },
    "first-share": {
      routine: "{name} keeps the tiny habit alive for one more day. It is not dramatic, but now there is something real enough to show.",
      "big-plan": "{name} spends the morning planning, but the blank space still asks for action. At some point the plan needs a rough first version.",
      scroll: "{name} loses time to the phone and feels the familiar guilt afterward. Still, the day is not over, and the rough {work} is waiting."
    },
    "comfortable-loop": {
      share: "{name} shares the rough version and then checks too often to see if anyone noticed. The silence feels loud, but the work is no longer hidden.",
      "keep-private": "{name} saves the work privately and promises to improve it later. A week passes, and later starts sounding a lot like never.",
      "ask-feedback": "One honest person sees the rough version. Their reply is not magic, but it gives {name} something specific to work with."
    },
    "pressure-invitation": {
      "break-loop": "Because {name} broke the loop instead of waiting for motivation, the work starts moving again. Then a small {opportunity} appears earlier than expected.",
      "stay-loop": "{name} lets another week pass, and the opportunity arrives anyway. It feels uncomfortable because the work is not as ready as it could be.",
      "small-help": "The check-in helps more than {name} expected. Staying connected keeps the work warm long enough for a new {opportunity} to appear."
    },
    "behind-year": {
      "say-yes": "{name} says yes before feeling ready. The year gets louder after that, and every choice starts showing what kind of pressure this path creates.",
      wait: "{name} asks for more time. It is reasonable, but it also reveals a pattern: preparation can help, and it can also become hiding.",
      "bring-friend": "{name} lets someone into the decision. That makes the year feel less lonely, even when the work itself is still hard."
    },
    "public-pressure": {
      return: "{name} restarts smaller, and the smaller plan actually moves. The {work} begins reaching people who do not already know the story.",
      quit: "{name} stops for a while, but the unfinished work keeps sitting there. When it finally reaches people, it feels surprising and uncomfortable.",
      "risk-reset": "{name} changes the plan completely. That risk makes the work easier to notice, but also easier for strangers to judge."
    },
    "relationship-cost": {
      "own-it": "Because {name} keeps showing up publicly, more people notice the work. At the same time, people close to {name} start noticing the distance.",
      hide: "{name} pulls back from attention, and the quiet feels safe for a moment. But the same quiet also starts showing up in personal relationships.",
      learn: "{name} uses the feedback instead of running from it. Progress becomes more real, but it starts taking more time from the rest of life."
    },
    "burnout-edge": {
      "make-time": "{name} makes time for someone important, and the night feels softer. The work is still there tomorrow, but now the body asks to be included too.",
      "lock-in": "{name} ignores the message and keeps working. The progress is real, but the body and the people around {name} both start feeling the cost.",
      explain: "{name} replies honestly instead of pretending everything is fine. The conversation helps, but it also makes the tiredness harder to ignore."
    },
    "unexpected-door": {
      repair: "{name} lowers the pressure and recovers a little. That slower week does not ruin the story; it makes the next open door easier to notice.",
      force: "{name} pushes through with coffee and willpower. It works for a while, but the next opportunity arrives while the body is still paying for it.",
      vanish: "{name} disappears for a while. When a door opens later, it feels lucky, but also loaded with everything left unanswered."
    },
    "second-failure": {
      "step-through": "{name} says yes and figures it out step by step. Some parts work, some parts do not, and one failure lands harder because the chance mattered.",
      "prepare-first": "{name} prepares carefully before saying yes. Even then, preparation does not protect the story from every mistake.",
      "miss-it": "{name} leaves the message unanswered too long. Missing the chance hurts in a quiet way, and the next failure feels personal."
    },
    "first-real-proof": {
      "come-back": "{name} fixes one obvious mistake and tries again. That small repair becomes the first proof that the story is not over.",
      "blame-world": "{name} blames the situation and changes very little at first. The proof comes later, after the anger stops being useful.",
      "ask-mentor": "{name} asks someone better what they would do next. The advice is simple, almost annoying, and it helps."
    },
    "major-turning-point": {
      "build-system": "{name} writes down what worked and turns it into a routine. That makes the next big choice feel less random and more earned.",
      "chase-high": "{name} tries to force another win immediately. The pressure rises, and the next choice becomes about whether to chase or build.",
      "share-credit": "{name} celebrates with someone who helped. The win feels warmer, and the next choice includes more than ambition."
    },
    "who-stayed": {
      "choose-known": "{name} chooses the stable path. It is not flashy, but it creates enough quiet to notice who has been there all along.",
      "choose-next": "{name} takes the bigger risk. The future opens wider, but the first thing that becomes clear is who can handle the distance.",
      "choose-balanced": "{name} chooses steady growth and protects some peace. That makes room to see the people who stayed."
    },
    "final-room": {
      "call-someone": "{name} calls the person who kept believing. The room feels different afterward, because the ending is not being carried alone.",
      "stand-alone": "{name} keeps the win private. The room is calm, but also quiet enough to show what sharing might have changed.",
      "thank-them": "{name} sends a real thank-you before the moment passes. It is small, but it gives the ending a softer shape."
    },
    "ending-gate": {
      forgive: "{name} stops punishing themselves for starting late. The final scene can finally look at the whole path without turning every delay into shame.",
      "keep-hunger": "{name} keeps improving, but with a kinder voice. The ending is not perfect, but it feels more livable.",
      "begin-again": "{name} chooses one small thing to begin again tomorrow. That makes the ending feel less like a finish line and more like a real morning."
    },
    "secret-room-smaller": {
      "stay-loop": "{name} says tomorrow again, and this time the story pauses long enough to show the pattern clearly. The room feels smaller because the same choice keeps repeating.",
      scroll: "{name} loses another hour to the phone. Nothing explodes, but the room feels smaller because the goal is still waiting.",
      hide: "{name} goes quiet when attention gets uncomfortable. The quiet becomes a room of its own, and it is smaller than expected.",
      vanish: "{name} disappears for a while, and the story has to sit inside that silence."
    },
    "secret-quiet-breakthrough": {
      "build-system": "{name} keeps the routine going when it is no longer exciting. That is why the breakthrough arrives quietly instead of dramatically.",
      routine: "{name} repeats the small habit again. Nothing announces itself, but the proof starts collecting in the background.",
      "choose-balanced": "{name} chooses the sustainable path, and the quiet work finally has enough space to show results."
    },
    "secret-night-changes": {
      "choose-next": "{name} takes the bigger risk, so the night answers with a bigger decision. It feels real because the fear is real too.",
      "step-through": "{name} has already said yes once without feeling ready. Tonight asks for that same courage again.",
      "risk-reset": "{name} changed the plan before, and now another risky turn appears. This time, the stakes feel closer to real life."
    }
  };

  const base = lines[template.id]?.[previousChoiceId];
  if (!base) return null;
  return `${base} ${detail}`;
}

function getRunDetail(state: StoryRunState) {
  const parsed = state.profile.parsedProfile;
  const vocabulary = parsed?.personalVocabulary ?? ["work", "room", "message"];
  const details = [
    "A phone lights up on the desk and gets ignored for once.",
    "The room is not cleaner, but the decision feels clearer.",
    "Somewhere in the background, normal life keeps going.",
    `One small word keeps coming back: ${vocabulary[(state.seed + state.choices.length) % vocabulary.length]}.`,
    "It is the kind of moment that would be easy to miss if nobody filmed it."
  ];
  return details[(state.seed + state.choices.length * 3) % details.length];
}

function mergeFlags(current: StoryFlag[], incoming: StoryFlag[]) {
  return Array.from(new Set([...current, ...incoming]));
}

function appendUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function getSecretUnlockText(sceneId: string) {
  if (sceneId === "secret-room-smaller") return "You avoided the work until the pattern became obvious.";
  if (sceneId === "secret-quiet-breakthrough") return "You stayed consistent before it felt exciting.";
  if (sceneId === "secret-night-changes") return "You took enough risks to unlock a bigger moment.";
  return "You found a hidden scene.";
}
