import { applyTraitEffect, createInitialTraits, createSeed, maybeCreateWildCard, pickWeighted, seededRandom } from "@/lib/random-engine";
import { normalizeProfile, personalize } from "@/lib/personalization";
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
      id: "old-notebook",
      name: "Old notebook",
      description: "Old plans, crossed-out ideas, and one page that still feels hopeful.",
      quote: "I was not too late. I was getting ready.",
      effect: { creativity: 3, consistency: 2 }
    },
    miniGame: "hold",
    narration: [
      "{name} sits in {country} with one thought that keeps coming back: {goal}.",
      "The old question returns: {whatIf}. Tonight it feels less like regret and more like a place to begin."
    ],
    choices: [
      { id: "one-hour", text: "Make one small first move", effect: { discipline: 5, consistency: 6, creativity: 2 }, flags: ["stayed_consistent"] },
      { id: "rest", text: "Close the laptop and breathe", effect: { consistency: -2, discipline: -1 }, flags: ["avoided_work"] },
      { id: "message", text: "Text the person who gets it", effect: { social: 6, risk: 2 }, flags: ["asked_for_help"] }
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
      "Morning arrives quietly. No one knows {name} promised to try last night.",
      "That is how change often starts: small, private, and easy to skip."
    ],
    choices: [
      { id: "routine", text: "Protect one tiny habit", effect: { discipline: 6, consistency: 7 }, flags: ["stayed_consistent"] },
      { id: "big-plan", text: "Make a big comeback plan", effect: { risk: 3, discipline: 1, consistency: -3 } },
      { id: "scroll", text: "Let the phone win", effect: { consistency: -6, creativity: -2 }, flags: ["avoided_work", "regret_repeated"] }
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
      description: "A rough recording where the idea is stronger than the confidence.",
      quote: "Send it before the brave version leaves.",
      effect: { creativity: 4, risk: 2 }
    },
    miniGame: "tap-particles",
    narration: [
      "{name} makes a rough {work}. It is not perfect, but it has heart.",
      "Keeping it private feels safer. Sharing it makes the dream feel real."
    ],
    choices: [
      { id: "share", text: "Post it before you overthink", effect: { creativity: 6, risk: 5, social: 2 }, flags: ["took_big_risk"] },
      { id: "keep-private", text: "Save it just for yourself", effect: { creativity: 3, risk: -3, social: -2 }, flags: ["isolated_self"] },
      { id: "ask-feedback", text: "Send it to someone honest", effect: { social: 7, creativity: 3, risk: 2 }, flags: ["asked_for_help"] }
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
      "One week disappears into errands, tabs, and excuses. Then the next week does the same thing.",
      "Nothing dramatic happens. That is the tricky part. The loop looks normal."
    ],
    choices: [
      { id: "break-loop", text: "Break the pattern tonight", effect: { discipline: 7, consistency: 8 }, flags: ["returned_after_failure", "stayed_consistent"] },
      { id: "stay-loop", text: "Let this week disappear too", effect: { consistency: -8, discipline: -5 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "small-help", text: "Ask for a gentle push", effect: { social: 6, consistency: 4 }, flags: ["asked_for_help"] }
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
      "An {opportunity} appears at the worst possible time. It feels too soon and too public.",
      "{name} can feel two options: stay safe, or try before feeling ready."
    ],
    choices: [
      { id: "say-yes", text: "Say yes even though you are nervous", effect: { risk: 8, social: 4, consistency: -2 }, flags: ["took_big_risk"] },
      { id: "wait", text: "Ask for more time", effect: { discipline: 1, risk: -6 }, flags: ["ignored_opportunity"] },
      { id: "bring-friend", text: "Bring someone into the decision", effect: { social: 8, risk: 2 }, flags: ["asked_for_help"] }
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
      "The future does not yell at {name}. It just shows what has been happening.",
      "The nights that seemed harmless have added up. The small wins have also added up."
    ],
    choices: [
      { id: "return", text: "Come back quietly", effect: { consistency: 9, discipline: 5 }, flags: ["returned_after_failure"] },
      { id: "quit", text: "Tell yourself this was the old you", effect: { consistency: -10, creativity: -5 }, flags: ["quit_once", "regret_repeated"] },
      { id: "risk-reset", text: "Throw away the old plan", effect: { risk: 7, discipline: 2, social: -2 }, flags: ["took_big_risk"] }
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
      "{name}'s {work} reaches people outside the safe circle. A stranger reacts. Someone else quietly stays.",
      "It is not a big win yet. It is just the first sign that people are paying attention."
    ],
    choices: [
      { id: "own-it", text: "Stay visible", effect: { risk: 5, creativity: 6, social: 3 }, flags: ["took_big_risk"] },
      { id: "hide", text: "Go quiet before more people notice", effect: { social: -8, consistency: -5 }, flags: ["isolated_self"] },
      { id: "learn", text: "Use the reaction to improve", effect: { creativity: 6, discipline: 4 }, flags: ["stayed_consistent"] }
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
      description: "Four saved sentences that say more than you expected.",
      quote: "Say it before the silence grows.",
      effect: { social: 4, discipline: 1 }
    },
    relationshipMoment: {
      role: "old connection",
      name: "Nia",
      line: "You keep saying soon. I miss when soon meant tonight."
    },
    narration: [
      "Progress starts taking space in the calendar. Messages wait. Plans turn into maybes. Someone misses the old {name}.",
      "Wanting more is not wrong, but it can make people feel far away."
    ],
    choices: [
      { id: "make-time", text: "Show up for them tonight", effect: { social: 8, consistency: -2 }, flags: ["asked_for_help"] },
      { id: "lock-in", text: "Choose the work and accept the quiet", effect: { discipline: 6, consistency: 6, social: -7 }, flags: ["isolated_self"] },
      { id: "explain", text: "Explain what is going on", effect: { social: 5, discipline: 2 }, flags: ["asked_for_help"] }
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
      "Your body starts saying what your calendar ignored. Focus feels heavy. Even hope needs rest.",
      "This is where many versions of {name} confuse being tired with being done."
    ],
    choices: [
      { id: "repair", text: "Make the goal smaller for one week", effect: { discipline: 3, consistency: 5, social: 2 }, flags: ["returned_after_failure"] },
      { id: "force", text: "Push through and pay later", effect: { discipline: 5, consistency: 2, social: -4 }, flags: ["burned_out"] },
      { id: "vanish", text: "Disappear without explaining", effect: { consistency: -8, social: -8, creativity: -3 }, flags: ["isolated_self", "quit_once"] }
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
      id: "lucky-coin",
      name: "Lucky coin",
      description: "Found in a jacket pocket on a day you almost stayed home.",
      quote: "Luck shows up when you move.",
      effect: { luck: 7, risk: 2 }
    },
    movieMoment: {
      id: "future-self-glimpse",
      title: "Future You in the Hallway",
      description: "For one second, you see a version of yourself who already got through this.",
      rarity: "rare"
    },
    narration: [
      "A door opens because of old effort, strange timing, and one person who remembered {name}.",
      "It feels lucky, but also scary. Good chances can still put pressure on you."
    ],
    choices: [
      { id: "step-through", text: "Step in before fear talks you out of it", effect: { risk: 7, luck: 4, social: 4 }, flags: ["lucky_event_seen", "took_big_risk"] },
      { id: "prepare-first", text: "Answer carefully, not fearfully", effect: { discipline: 5, consistency: 4, risk: -2 }, flags: ["stayed_consistent"] },
      { id: "miss-it", text: "Let it close and pretend you are fine", effect: { risk: -7, luck: -4 }, flags: ["ignored_opportunity", "regret_repeated"] }
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
      "The second failure hurts more because {name} cannot blame only bad luck this time.",
      "Under the shame, there is a simple question: stop here, or learn from it?"
    ],
    choices: [
      { id: "come-back", text: "Come back without making a speech", effect: { consistency: 8, discipline: 4 }, flags: ["returned_after_failure"] },
      { id: "blame-world", text: "Blame everything around you", effect: { consistency: -6, luck: -3 }, flags: ["regret_repeated"] },
      { id: "ask-mentor", text: "Ask someone with more experience", effect: { social: 8, creativity: 3 }, flags: ["asked_for_help"] }
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
      id: "unfinished-song",
      name: "Unfinished song",
      description: "A piece of an idea that is too honest to delete.",
      quote: "The unfinished thing was still alive.",
      effect: { creativity: 6, consistency: 2 }
    },
    movieMoment: {
      id: "slow-motion-breakthrough",
      title: "Slow-Motion Breakthrough",
      description: "The room gets quiet and a small win feels huge.",
      rarity: "rare"
    },
    narration: [
      "One result finally feels real. It is not huge or final, but it is enough to quiet the mean voice for a while.",
      "For the first time, the room does not feel like a waiting room. It feels like a place where something is being built."
    ],
    choices: [
      { id: "build-system", text: "Turn the proof into a routine", effect: { consistency: 8, discipline: 6 }, flags: ["breakthrough_seen", "stayed_consistent"] },
      { id: "chase-high", text: "Chase the feeling again", effect: { risk: 6, consistency: -3 }, flags: ["breakthrough_seen"] },
      { id: "share-credit", text: "Let someone celebrate with you", effect: { social: 6, creativity: 3 }, flags: ["breakthrough_seen", "asked_for_help"] }
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
      "The story comes down to one choice. It will not decide everything, but it shows what kind of person {name} is becoming.",
      "{name} can protect the familiar life, or step into something uncertain."
    ],
    choices: [
      { id: "choose-known", text: "Keep the life you know", effect: { discipline: 2, risk: -6, social: 2 } },
      { id: "choose-next", text: "Step into the scary new option", effect: { risk: 8, creativity: 5, luck: 3 }, flags: ["took_big_risk"] },
      { id: "choose-balanced", text: "Choose the brave option you can handle", effect: { consistency: 6, social: 3, discipline: 3 }, flags: ["stayed_consistent"] }
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
      id: "photo",
      name: "Photo",
      description: "Someone laughing outside the frame. Proof that you were not alone.",
      quote: "Someone was there for the story.",
      effect: { social: 5, luck: 1 }
    },
    narration: [
      "By now, the people around {name} have changed. Some left. Some arrived late. Some stayed quietly.",
      "{name} finally understands that every future includes other people, even the lonely-looking ones."
    ],
    choices: [
      { id: "call-someone", text: "Call someone who stayed", effect: { social: 8 }, flags: ["asked_for_help"] },
      { id: "stand-alone", text: "Keep this scene private", effect: { discipline: 5, social: -4 }, flags: ["isolated_self"] },
      { id: "thank-them", text: "Thank them before the moment passes", effect: { social: 7, consistency: 2 }, flags: ["asked_for_help"] }
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
      id: "broken-clock",
      name: "Broken clock",
      description: "Stopped at a time you used to think was wasted.",
      quote: "Even lost time taught me something.",
      effect: { consistency: 3, discipline: 2 }
    },
    movieMoment: {
      id: "fake-ending",
      title: "The Ending That Keeps Going",
      description: "The screen fades out, then the Life Core turns back on.",
      rarity: "rare"
    },
    narration: [
      "{name} returns to a room that looks almost the same. Same walls, different feeling.",
      "The old what-if is still there, but it is not in charge anymore."
    ],
    choices: [
      { id: "forgive", text: "Forgive the years it took", effect: { consistency: 4, social: 2 }, flags: ["returned_after_failure"] },
      { id: "keep-hunger", text: "Keep wanting more, but hold it gently", effect: { risk: 4, discipline: 3 }, flags: ["stayed_consistent"] },
      { id: "begin-again", text: "Start again quietly", effect: { creativity: 4, consistency: 5 }, flags: ["returned_after_failure"] }
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
      "The final scene does not explain everything. It simply shows what your choices have been building.",
      "This is not the only life {name} could have lived. It is the one {name} chose this time."
    ],
    choices: [
      { id: "see-ending", text: "See your ending", effect: {}, nextScene: "ending" }
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
      "{name} avoids the work so often that the pattern becomes hard to ignore.",
      "Nothing explodes. That is what makes it easy to miss. The excuses start to feel normal."
    ],
    choices: [
      { id: "tiny-exit", text: "Do the smallest thing that helps", effect: { consistency: 7, discipline: 3 }, flags: ["returned_after_failure"] },
      { id: "decorate-cage", text: "Make the loop look productive", effect: { consistency: -5, creativity: 2 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "call-it-out", text: "Admit the pattern and break it", effect: { risk: 3, consistency: 5 }, flags: ["returned_after_failure"] }
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
      description: "No speech, no big celebration, just the Life Core getting brighter.",
      rarity: "secret"
    },
    narration: [
      "Nothing dramatic happens. That is why it works.",
      "{name} keeps repeating the small habit, and suddenly there is proof it mattered."
    ],
    choices: [
      { id: "keep-quiet", text: "Keep going without announcing it", effect: { consistency: 9, discipline: 5 }, flags: ["stayed_consistent", "breakthrough_seen"] },
      { id: "share-small-win", text: "Let one person see the proof", effect: { social: 5, creativity: 3 }, flags: ["asked_for_help", "breakthrough_seen"] },
      { id: "raise-standard", text: "Make the system slightly harder", effect: { discipline: 6, consistency: 4 }, flags: ["stayed_consistent"] }
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
      "It is late, which usually means bad decisions. Tonight, one risky choice feels strangely awake.",
      "A shortcut appears. It is part opportunity, part dare, and it will not wait long."
    ],
    choices: [
      { id: "take-shortcut", text: "Take the shortcut, knowing the risk", effect: { risk: 10, luck: 6, consistency: -2 }, flags: ["took_big_risk", "lucky_event_seen"] },
      { id: "bring-friend", text: "Make the jump with a witness", effect: { social: 7, risk: 5 }, flags: ["asked_for_help", "took_big_risk"] },
      { id: "walk-away-smiling", text: "Walk away and keep the power", effect: { discipline: 5, consistency: 5 }, flags: ["stayed_consistent"] }
    ]
  }
];

const chaosEvents: ChaosEvent[] = [
  {
    id: "elevator-invite",
    title: "The Elevator Invite",
    kind: "strange opportunity",
    narration: "Someone hears one sentence about your goal and offers you a chance you do not feel ready for.",
    effect: { luck: 8, risk: 5, social: 3 },
    flags: ["lucky_event_seen", "took_big_risk"]
  },
  {
    id: "delete-the-plan",
    title: "Delete the Perfect Plan",
    kind: "impulsive decision",
    narration: "You delete the complicated plan and try the simple version. Somehow, it works better.",
    effect: { consistency: 7, creativity: 3, discipline: -1 },
    flags: ["returned_after_failure", "stayed_consistent"]
  },
  {
    id: "wrong-number-oracle",
    title: "The Wrong Number Text",
    kind: "unexpected message",
    narration: "A wrong-number text arrives with advice that is weirdly useful.",
    effect: { luck: 5, creativity: 4, social: 2 },
    flags: ["lucky_event_seen"]
  },
  {
    id: "shower-lightning",
    title: "The Shower Idea",
    kind: "sudden creative idea",
    narration: "The idea appears while shampoo is in your eyes. You keep repeating it until you can write it down.",
    effect: { creativity: 9, consistency: 2 },
    flags: ["breakthrough_seen"]
  },
  {
    id: "shortcut-with-teeth",
    title: "The Risky Shortcut",
    kind: "risky shortcut",
    narration: "A shortcut appears. It saves time, but it makes the next week messy.",
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
    return "{name} starts to feel the cost of the nights that seemed harmless. The dream is not gone, but it feels farther away.";
  }
  if (template.id === "first-real-proof" && state.flags.includes("stayed_consistent")) {
    return "The reward comes late, but it comes. The small repeated actions finally leave proof.";
  }
  if (template.id === "who-stayed" && state.flags.includes("isolated_self")) {
    return "The room is quieter than {name} expected. Success feels different when fewer people are close enough to share it.";
  }
  return template.narration[(state.seed + state.choices.length + template.id.length) % template.narration.length];
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
