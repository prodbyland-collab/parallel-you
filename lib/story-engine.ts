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
    title: "The Night The Room Gets Too Loud",
    year: 2026,
    environment: "bedroom",
    mood: "hopeful",
    memoryObject: {
      id: "old-notebook",
      name: "Old notebook",
      description: "Half plans, crossed-out titles, one page that still smells like a beginning.",
      quote: "I was not late. I was loading.",
      effect: { creativity: 3, consistency: 2 }
    },
    miniGame: "hold",
    narration: [
      "{name} sits in {country} while the room hums around one unfinished thought: {goal}.",
      "The old what-if comes back again: {whatIf}. Tonight it does not sound like regret. It sounds like the opening line."
    ],
    choices: [
      { id: "one-hour", text: "Make one ugly first move", effect: { discipline: 5, consistency: 6, creativity: 2 }, flags: ["stayed_consistent"] },
      { id: "rest", text: "Close the laptop and breathe", effect: { consistency: -2, discipline: -1 }, flags: ["avoided_work"] },
      { id: "message", text: "Text the person who gets it", effect: { social: 6, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-morning",
    act: 1,
    title: "The Morning After The Promise",
    year: 2026,
    environment: "sunrise",
    mood: "focused",
    moodShift: {
      from: "focused",
      to: "tense",
      line: "The calm breaks for one second when the phone lights up with easier dopamine."
    },
    narration: [
      "Morning arrives plain and unsentimental. No music swells. No one knows {name} made a promise last night.",
      "That is how most life changes begin: invisible, slightly annoying, and easy to betray."
    ],
    choices: [
      { id: "routine", text: "Protect a tiny ritual", effect: { discipline: 6, consistency: 7 }, flags: ["stayed_consistent"] },
      { id: "big-plan", text: "Design the perfect comeback", effect: { risk: 3, discipline: 1, consistency: -3 } },
      { id: "scroll", text: "Let the phone win", effect: { consistency: -6, creativity: -2 }, flags: ["avoided_work", "regret_repeated"] }
    ]
  },
  {
    id: "first-share",
    act: 1,
    title: "The First Thing You Let Them See",
    year: 2026,
    environment: "studio",
    mood: "tense",
    memoryObject: {
      id: "voice-note",
      name: "Voice note",
      description: "A messy recording where the idea is better than the confidence.",
      quote: "Send it before the brave version leaves.",
      effect: { creativity: 4, risk: 2 }
    },
    miniGame: "tap-particles",
    narration: [
      "{name} makes one rough {work}. It still has fingerprints, bad edges, and too much heart.",
      "Keeping it private would feel safer. Showing it would make the dream harder to lie about."
    ],
    choices: [
      { id: "share", text: "Post it before courage leaves", effect: { creativity: 6, risk: 5, social: 2 }, flags: ["took_big_risk"] },
      { id: "keep-private", text: "Save it as proof only you can see", effect: { creativity: 3, risk: -3, social: -2 }, flags: ["isolated_self"] },
      { id: "ask-feedback", text: "Send it to one honest person", effect: { social: 7, creativity: 3, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "comfortable-loop",
    act: 1,
    title: "The Week That Repeats Itself",
    year: 2026,
    environment: "bedroom",
    mood: "tired",
    narration: [
      "A week disappears into errands, tabs, excuses, weather. Then another week learns the same trick.",
      "Nothing dramatic breaks. That is the trap. The loop knows how to look normal."
    ],
    choices: [
      { id: "break-loop", text: "Interrupt the pattern tonight", effect: { discipline: 7, consistency: 8 }, flags: ["returned_after_failure", "stayed_consistent"] },
      { id: "stay-loop", text: "Let this week disappear too", effect: { consistency: -8, discipline: -5 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "small-help", text: "Ask for a gentle push", effect: { social: 6, consistency: 4 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "pressure-invitation",
    act: 2,
    title: "The Offer With Bad Timing",
    year: 2027,
    environment: "city",
    mood: "tense",
    relationshipMoment: {
      role: "stranger",
      name: "Ari",
      line: "I do not know why I am saying this, but your thing stayed in my head."
    },
    miniGame: "timed-choice",
    narration: [
      "An {opportunity} appears at the exact wrong time. Too soon, too public, too easy to overthink.",
      "{name} can feel two futures standing in the doorway, both pretending to be reasonable."
    ],
    choices: [
      { id: "say-yes", text: "Say yes with a shaky voice", effect: { risk: 8, social: 4, consistency: -2 }, flags: ["took_big_risk"] },
      { id: "wait", text: "Ask for more time", effect: { discipline: 1, risk: -6 }, flags: ["ignored_opportunity"] },
      { id: "bring-friend", text: "Bring someone into the decision", effect: { social: 8, risk: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "behind-year",
    act: 2,
    title: "The Mirror Year",
    year: 2027,
    environment: "void",
    mood: "lost",
    narration: [
      "The future does not yell at {name}. It just holds up a mirror and lets the silence do the work.",
      "The nights that felt harmless have become distance. The small wins have become ground."
    ],
    choices: [
      { id: "return", text: "Come back quietly", effect: { consistency: 9, discipline: 5 }, flags: ["returned_after_failure"] },
      { id: "quit", text: "Call it who you used to be", effect: { consistency: -10, creativity: -5 }, flags: ["quit_once", "regret_repeated"] },
      { id: "risk-reset", text: "Burn the old plan", effect: { risk: 7, discipline: 2, social: -2 }, flags: ["took_big_risk"] }
    ]
  },
  {
    id: "public-pressure",
    act: 2,
    title: "The Moment Strangers Enter",
    year: 2027,
    environment: "city",
    mood: "tense",
    narration: [
      "{name}'s {work} slips past the safe circle. A stranger reacts. Another one says nothing and stays anyway.",
      "Attention is not applause yet. It is a light turning on while the room is still messy."
    ],
    choices: [
      { id: "own-it", text: "Stay visible", effect: { risk: 5, creativity: 6, social: 3 }, flags: ["took_big_risk"] },
      { id: "hide", text: "Go quiet before anyone notices more", effect: { social: -8, consistency: -5 }, flags: ["isolated_self"] },
      { id: "learn", text: "Turn the reaction into the next draft", effect: { creativity: 6, discipline: 4 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "relationship-cost",
    act: 2,
    title: "The People Who Feel The Distance",
    year: 2028,
    environment: "bedroom",
    mood: "tired",
    memoryObject: {
      id: "message-draft",
      name: "Message draft",
      description: "Four unsent sentences that are somehow louder than a confession.",
      quote: "Tell them before distance becomes the narrator.",
      effect: { social: 4, discipline: 1 }
    },
    relationshipMoment: {
      role: "old connection",
      name: "Nia",
      line: "You keep saying soon. I miss when soon meant tonight."
    },
    narration: [
      "Progress starts taking space in the calendar. Messages wait. Plans become maybe. Someone misses the old {name}.",
      "Ambition is not evil, but it does have a shadow. Tonight the shadow has a name."
    ],
    choices: [
      { id: "make-time", text: "Show up for them tonight", effect: { social: 8, consistency: -2 }, flags: ["asked_for_help"] },
      { id: "lock-in", text: "Choose the work and accept the quiet", effect: { discipline: 6, consistency: 6, social: -7 }, flags: ["isolated_self"] },
      { id: "explain", text: "Tell the truth before it becomes distance", effect: { social: 5, discipline: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "burnout-edge",
    act: 2,
    title: "The Scene Where The Body Refuses",
    year: 2028,
    environment: "void",
    mood: "tired",
    moodShift: {
      from: "tired",
      to: "hopeful",
      line: "Then the failure becomes weirdly funny because the ceiling fan starts clicking like applause."
    },
    narration: [
      "The body starts cutting lines from the script. Focus gets heavy. Even hope has to sit down.",
      "This is where many versions of {name} mistake exhaustion for destiny."
    ],
    choices: [
      { id: "repair", text: "Make the dream smaller for one week", effect: { discipline: 3, consistency: 5, social: 2 }, flags: ["returned_after_failure"] },
      { id: "force", text: "Push through and pay later", effect: { discipline: 5, consistency: 2, social: -4 }, flags: ["burned_out"] },
      { id: "vanish", text: "Disappear without explaining", effect: { consistency: -8, social: -8, creativity: -3 }, flags: ["isolated_self", "quit_once"] }
    ]
  },
  {
    id: "unexpected-door",
    act: 2,
    title: "The Door That Should Not Be Open",
    year: 2028,
    environment: "spotlight",
    mood: "hopeful",
    memoryObject: {
      id: "lucky-coin",
      name: "Lucky coin",
      description: "Found in the pocket of a jacket you almost did not wear.",
      quote: "Luck likes motion.",
      effect: { luck: 7, risk: 2 }
    },
    movieMoment: {
      id: "future-self-glimpse",
      title: "Future Self In The Hallway",
      description: "For one frame, the avatar sees a version of you who already survived this.",
      rarity: "rare"
    },
    narration: [
      "A door opens because of old effort, strange timing, and one person who remembered {name} at the exact right second.",
      "Luck walks in wearing pressure as a coat. It is generous, but not gentle."
    ],
    choices: [
      { id: "step-through", text: "Step in before fear finishes talking", effect: { risk: 7, luck: 4, social: 4 }, flags: ["lucky_event_seen", "took_big_risk"] },
      { id: "prepare-first", text: "Answer carefully, not fearfully", effect: { discipline: 5, consistency: 4, risk: -2 }, flags: ["stayed_consistent"] },
      { id: "miss-it", text: "Let it close and pretend it is fine", effect: { risk: -7, luck: -4 }, flags: ["ignored_opportunity", "regret_repeated"] }
    ]
  },
  {
    id: "second-failure",
    act: 2,
    title: "The Failure That Knows Your Name",
    year: 2029,
    environment: "city",
    mood: "lost",
    relationshipMoment: {
      role: "mentor",
      name: "Mako",
      line: "You are not behind. You are under-edited."
    },
    narration: [
      "The second failure hurts differently because {name} can no longer call it bad luck with a straight face.",
      "Still, underneath the shame, the story asks a cleaner question: leave, or become real?"
    ],
    choices: [
      { id: "come-back", text: "Come back without the speech", effect: { consistency: 8, discipline: 4 }, flags: ["returned_after_failure"] },
      { id: "blame-world", text: "Make the world the villain", effect: { consistency: -6, luck: -3 }, flags: ["regret_repeated"] },
      { id: "ask-mentor", text: "Ask someone better than you", effect: { social: 8, creativity: 3 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first-real-proof",
    act: 2,
    title: "The Proof That Changes The Room",
    year: 2029,
    environment: "studio",
    mood: "breakthrough",
    memoryObject: {
      id: "unfinished-song",
      name: "Unfinished song",
      description: "Eight bars, no ending, too much truth to delete.",
      quote: "The unfinished thing was still alive.",
      effect: { creativity: 6, consistency: 2 }
    },
    movieMoment: {
      id: "slow-motion-breakthrough",
      title: "Slow-Motion Breakthrough",
      description: "The room goes quiet and the smallest win lands like a plot twist.",
      rarity: "rare"
    },
    narration: [
      "One result becomes undeniable. Not huge. Not final. Just real enough to make the cruel voice lose its rhythm.",
      "For the first time, the room does not feel like a place where {name} waits. It feels like a place where something is being built."
    ],
    choices: [
      { id: "build-system", text: "Turn the proof into a system", effect: { consistency: 8, discipline: 6 }, flags: ["breakthrough_seen", "stayed_consistent"] },
      { id: "chase-high", text: "Chase the feeling again", effect: { risk: 6, consistency: -3 }, flags: ["breakthrough_seen"] },
      { id: "share-credit", text: "Let someone celebrate with you", effect: { social: 6, creativity: 3 }, flags: ["breakthrough_seen", "asked_for_help"] }
    ]
  },
  {
    id: "major-turning-point",
    act: 3,
    title: "The Scene You Cannot Rehearse",
    year: 2030,
    environment: "spotlight",
    mood: "tense",
    miniGame: "drag-memory",
    narration: [
      "The story narrows into one decision. Not because one choice decides everything, but because it reveals who has been directing.",
      "{name} can protect the known life, or step into a scene that has no guarantee and too much light."
    ],
    choices: [
      { id: "choose-known", text: "Keep the life that still holds", effect: { discipline: 2, risk: -6, social: 2 } },
      { id: "choose-next", text: "Walk into the impossible scene", effect: { risk: 8, creativity: 5, luck: 3 }, flags: ["took_big_risk"] },
      { id: "choose-balanced", text: "Choose the brave version you can sustain", effect: { consistency: 6, social: 3, discipline: 3 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "who-stayed",
    act: 3,
    title: "The Names In The Credits",
    year: 2030,
    environment: "sunrise",
    mood: "hopeful",
    memoryObject: {
      id: "photo",
      name: "Photo",
      description: "Someone laughing outside the frame, proof that the story had witnesses.",
      quote: "The credits were never empty.",
      effect: { social: 5, luck: 1 }
    },
    narration: [
      "By now, the audience has changed. Some people left the room. Some arrived late. Some were always there, quietly mispronouncing hope as patience.",
      "{name} finally understands that every future has a cast, even the lonely-looking ones."
    ],
    choices: [
      { id: "call-someone", text: "Call the person in the credits", effect: { social: 8 }, flags: ["asked_for_help"] },
      { id: "stand-alone", text: "Keep this scene private", effect: { discipline: 5, social: -4 }, flags: ["isolated_self"] },
      { id: "thank-them", text: "Thank them before the moment passes", effect: { social: 7, consistency: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "final-room",
    act: 3,
    title: "The Room After Everything",
    year: 2031,
    environment: "void",
    mood: "focused",
    memoryObject: {
      id: "broken-clock",
      name: "Broken clock",
      description: "Stopped at a time that used to feel wasted.",
      quote: "Even lost time kept evidence.",
      effect: { consistency: 3, discipline: 2 }
    },
    movieMoment: {
      id: "fake-ending",
      title: "Fake Ending That Keeps Going",
      description: "The screen fades out, then the Life Core blinks back awake.",
      rarity: "rare"
    },
    narration: [
      "{name} returns to a room that looks almost the same. Same walls. Different gravity.",
      "The old what-if is still there, but now it has to sit in the back row."
    ],
    choices: [
      { id: "forgive", text: "Forgive the years that taught you late", effect: { consistency: 4, social: 2 }, flags: ["returned_after_failure"] },
      { id: "keep-hunger", text: "Keep the hunger, soften the grip", effect: { risk: 4, discipline: 3 }, flags: ["stayed_consistent"] },
      { id: "begin-again", text: "Begin again without announcing it", effect: { creativity: 4, consistency: 5 }, flags: ["returned_after_failure"] }
    ]
  },
  {
    id: "ending-gate",
    act: 3,
    title: "Fade To The Life You Directed",
    year: 2031,
    environment: "spotlight",
    mood: "breakthrough",
    narration: [
      "The final scene does not explain everything. It only turns on the lights and shows what the choices have been building.",
      "This is not the only life {name} could have lived. It is the one {name} directed."
    ],
    choices: [
      { id: "see-ending", text: "See the ending", effect: {}, nextScene: "ending" }
    ]
  }
];

const secretSceneTemplates: SceneTemplate[] = [
  {
    id: "secret-room-smaller",
    act: 2,
    title: "The Room Gets Smaller",
    year: 2028,
    environment: "bedroom",
    mood: "lost",
    secret: true,
    moodShift: {
      from: "lost",
      to: "tense",
      line: "The room does not move, but somehow there is less floor."
    },
    narration: [
      "{name} avoids the work so often the room starts recognizing the pattern first.",
      "The funny part is that nothing explodes. The walls simply learn {name}'s excuses by heart."
    ],
    choices: [
      { id: "tiny-exit", text: "Do the smallest possible exit move", effect: { consistency: 7, discipline: 3 }, flags: ["returned_after_failure"] },
      { id: "decorate-cage", text: "Make the loop look productive", effect: { consistency: -5, creativity: 2 }, flags: ["avoided_work", "regret_repeated"] },
      { id: "call-it-out", text: "Laugh at the pattern and break it", effect: { risk: 3, consistency: 5 }, flags: ["returned_after_failure"] }
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
      title: "Silent Scene With No Choices",
      description: "No speech, no applause, just the avatar watching the Life Core get brighter.",
      rarity: "secret"
    },
    narration: [
      "Nothing dramatic happens. That is why it works.",
      "{name} repeats the boring little ritual and suddenly the future has receipts."
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
      line: "This is either terrible or legendary. I vote legendary."
    },
    movieMoment: {
      id: "dream-sequence",
      title: "Dream Sequence",
      description: "The city folds into the Life Core and every risky yes echoes at once.",
      rarity: "secret"
    },
    narration: [
      "The night should be too late for decisions, which is exactly why the risky one looks awake.",
      "A shortcut appears. It is half opportunity, half dare, and completely bad at waiting."
    ],
    choices: [
      { id: "take-shortcut", text: "Take the shortcut with open eyes", effect: { risk: 10, luck: 6, consistency: -2 }, flags: ["took_big_risk", "lucky_event_seen"] },
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
    narration: "Someone in an elevator hears one sentence about your goal and offers a room you are absolutely not prepared for.",
    effect: { luck: 8, risk: 5, social: 3 },
    flags: ["lucky_event_seen", "took_big_risk"]
  },
  {
    id: "delete-the-plan",
    title: "Delete The Perfect Plan",
    kind: "impulsive decision",
    narration: "You delete the overdesigned plan and do the embarrassing simple version. Annoyingly, it works better.",
    effect: { consistency: 7, creativity: 3, discipline: -1 },
    flags: ["returned_after_failure", "stayed_consistent"]
  },
  {
    id: "wrong-number-oracle",
    title: "Wrong Number Oracle",
    kind: "unexpected message",
    narration: "A wrong-number text arrives with advice so specific it feels illegal.",
    effect: { luck: 5, creativity: 4, social: 2 },
    flags: ["lucky_event_seen"]
  },
  {
    id: "shower-lightning",
    title: "Shower Lightning",
    kind: "sudden creative idea",
    narration: "The idea appears while shampoo is in your eyes. You repeat it out loud like a spell until you can write it down.",
    effect: { creativity: 9, consistency: 2 },
    flags: ["breakthrough_seen"]
  },
  {
    id: "shortcut-with-teeth",
    title: "Shortcut With Teeth",
    kind: "risky shortcut",
    narration: "A shortcut opens. It saves three months and costs one peaceful week.",
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

function appendUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function getSecretUnlockText(sceneId: string) {
  if (sceneId === "secret-room-smaller") return "Avoided the work until the room noticed.";
  if (sceneId === "secret-quiet-breakthrough") return "Stayed consistent when it was still boring.";
  if (sceneId === "secret-night-changes") return "Took enough risks for the night to answer.";
  return "Found a hidden cut.";
}
