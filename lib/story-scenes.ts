import type { StoryChoice, StoryScene } from "@/lib/story-types";

export type SceneTemplate = Omit<StoryScene, "narration" | "choices"> & {
  narration: string[];
  choices: Array<Omit<StoryChoice, "text"> & { text: string }>;
  variations?: string[][];
};

export const baseStoryScenes: SceneTemplate[] = [
  {
    id: "opening_room",
    act: 1,
    title: "The Room",
    year: 2026,
    environment: "bedroom",
    mood: "tired",
    memoryObject: {
      id: "coffee-cup",
      name: "Coffee cup",
      description: "Cold coffee from the hour you said you would start.",
      quote: "I still remember the cup on the desk.",
      effect: { discipline: 1, consistency: 2, confidence: 1 }
    },
    miniGame: "hold",
    narration: [
      "The room is quiet.",
      "Your phone is close. Your goal is closer.",
      "You still don’t move."
    ],
    choices: [
      { id: "open_project", text: "Open the thing you keep avoiding", effect: { discipline: 3, consistency: 4, creativity: 1 }, flags: ["stayed_consistent"] },
      { id: "do_nothing", text: "Sit there for a while", effect: { consistency: -2, confidence: -1 }, flags: ["did_nothing", "avoided_work"] },
      { id: "message_someone", text: "Text one person before you overthink it", effect: { social: 4, risk: 2, confidence: 1 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "first_attempt",
    act: 1,
    title: "Starting Badly",
    year: 2026,
    environment: "studio",
    mood: "focused",
    memoryObject: {
      id: "project-file",
      name: "Unfinished project file",
      description: "A messy file with a bad name and one part that might work.",
      quote: "The ugly version was still real.",
      effect: { creativity: 3, consistency: 2 }
    },
    narration: ["You start.", "It is not good.", "But it is there."],
    choices: [
      { id: "fix_small_part", text: "Fix one small part", effect: { discipline: 3, consistency: 3, creativity: 2 }, flags: ["stayed_consistent"] },
      { id: "start_over_again", text: "Start over because this version annoys you", effect: { creativity: 2, consistency: -2 }, flags: ["started_over_again"] },
      { id: "close_try_tomorrow", text: "Close it and try tomorrow", effect: { consistency: -3, confidence: -1 }, flags: ["avoided_work"] }
    ]
  },
  {
    id: "message",
    act: 1,
    title: "One Message",
    year: 2026,
    environment: "bedroom",
    mood: "tense",
    firstPersonCut: {
      id: "phone-light",
      title: "The phone lights up.",
      detail: "You read the first line twice.",
      kind: "phone"
    },
    memoryObject: {
      id: "message-draft",
      name: "Message draft",
      description: "A half-written reply you almost sent.",
      quote: "One message changed the mood of the night.",
      effect: { social: 3, risk: 1 }
    },
    narration: [
      "A message appears.",
      "You read the first line.",
      "Then you wait, like waiting changes it."
    ],
    choices: [
      { id: "answer_message", text: "Answer before it becomes a whole thing", effect: { social: 4, confidence: 2 }, flags: ["asked_for_help"] },
      { id: "ignore_message", text: "Put the phone face down", effect: { social: -4, consistency: 1 }, flags: ["ignored_message"] },
      { id: "send_unfinished", text: "Send the unfinished version", effect: { risk: 5, creativity: 2, confidence: 2 }, flags: ["sent_unfinished", "took_big_risk"] }
    ]
  },
  {
    id: "late_night",
    act: 1,
    title: "Late",
    year: 2026,
    environment: "bedroom",
    mood: "tired",
    firstPersonCut: {
      id: "laptop-glow",
      title: "The laptop is the only light.",
      detail: "Outside, the street is almost empty.",
      kind: "late_night"
    },
    narration: [
      "It’s late.",
      "No one is watching.",
      "This is usually where you disappear."
    ],
    choices: [
      { id: "push_late", text: "Stay for twenty more minutes", effect: { discipline: 4, consistency: 3, confidence: 1 }, flags: ["stayed_consistent"] },
      { id: "sleep_instead", text: "Sleep before you make it worse", effect: { consistency: 1, discipline: -1, confidence: 1 }, flags: ["returned_after_failure"] },
      { id: "scroll_late", text: "Check your phone and lose the night", effect: { consistency: -5, confidence: -2 }, flags: ["avoided_work", "did_nothing"] }
    ]
  },
  {
    id: "small_win",
    act: 2,
    title: "Nobody Clapped",
    year: 2027,
    environment: "studio",
    mood: "focused",
    narration: ["You did something small.", "Nobody noticed.", "You noticed."],
    choices: [
      { id: "save_proof", text: "Save it before you judge it", effect: { consistency: 4, confidence: 3 }, flags: ["stayed_consistent"] },
      { id: "hide_small_win", text: "Pretend it does not count", effect: { confidence: -3, creativity: 1 }, flags: ["avoided_work"] },
      { id: "tell_one_person", text: "Tell one person it finally moved", effect: { social: 4, confidence: 2 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "bad_day",
    act: 2,
    title: "A Bad Day",
    year: 2027,
    environment: "city",
    mood: "tired",
    firstPersonCut: {
      id: "thinking-window",
      title: "You stare at the window.",
      detail: "The day keeps moving without asking.",
      kind: "thinking"
    },
    narration: [
      "Today doesn’t care about your plan.",
      "Everything feels heavier than it should."
    ],
    choices: [
      { id: "lower_the_bar", text: "Lower the bar and still do something", effect: { consistency: 5, discipline: 2, confidence: 2 }, flags: ["stayed_consistent"] },
      { id: "skip_today", text: "Skip today and promise tomorrow", effect: { consistency: -4, confidence: -2 }, flags: ["avoided_work", "did_nothing"] },
      { id: "ask_for_help", text: "Say you are having a bad day", effect: { social: 5, confidence: 1 }, flags: ["asked_for_help"] }
    ]
  },
  {
    id: "almost_finished",
    act: 2,
    title: "Almost",
    year: 2027,
    environment: "studio",
    mood: "tense",
    memoryObject: {
      id: "notebook",
      name: "Notebook",
      description: "A page with the final steps written too neatly.",
      quote: "Almost done was the hardest part.",
      effect: { discipline: 2, consistency: 2 }
    },
    narration: ["It is almost done.", "That somehow makes it harder."],
    choices: [
      { id: "finish_badly", text: "Finish it badly on purpose", effect: { consistency: 5, risk: 3, confidence: 2 }, flags: ["almost_finished", "finished_badly"] },
      { id: "polish_forever", text: "Fix one more thing, then another", effect: { creativity: 2, consistency: -3 }, flags: ["almost_finished", "avoided_work"] },
      { id: "send_unfinished_again", text: "Send it before it feels safe", effect: { risk: 5, social: 2, confidence: 2 }, flags: ["sent_unfinished", "took_big_risk"] }
    ]
  },
  {
    id: "someone_notices",
    act: 2,
    title: "Seen",
    year: 2027,
    environment: "city",
    mood: "hopeful",
    relationshipMoment: {
      role: "stranger",
      name: "Someone",
      line: "I do not know you, but this stayed with me."
    },
    narration: ["One person notices.", "Not everyone.", "One."],
    choices: [
      { id: "reply_to_notice", text: "Reply like it matters", effect: { social: 5, confidence: 3 }, flags: ["someone_noticed"] },
      { id: "act_cool", text: "Act like you do not care", effect: { confidence: -1, social: -2 }, flags: ["someone_noticed", "isolated_self"] },
      { id: "make_next_thing", text: "Use the feeling and make the next thing", effect: { creativity: 4, consistency: 3 }, flags: ["stayed_consistent", "someone_noticed"] }
    ]
  },
  {
    id: "old_pattern",
    act: 2,
    title: "Again",
    year: 2028,
    environment: "bedroom",
    mood: "lost",
    narration: ["You have been here before.", "Same place.", "Different excuse."],
    choices: [
      { id: "name_pattern", text: "Admit this is the same pattern", effect: { confidence: 2, consistency: 3 }, flags: ["returned_after_failure"] },
      { id: "repeat_pattern", text: "Do the same thing again", effect: { consistency: -5, confidence: -2 }, flags: ["did_nothing", "regret_repeated"] },
      { id: "start_smaller", text: "Restart smaller than your ego wants", effect: { discipline: 3, consistency: 5 }, flags: ["returned_after_failure", "stayed_consistent"] }
    ]
  },
  {
    id: "quiet_choice",
    act: 2,
    title: "No Big Moment",
    year: 2028,
    environment: "bedroom",
    mood: "focused",
    noChoiceMoment: true,
    narration: ["There is no music.", "No sign.", "Just a small choice."],
    choices: [
      { id: "automatic_small_choice", text: "You choose one small thing anyway", effect: { discipline: 2, consistency: 3 }, flags: ["stayed_consistent"] }
    ]
  },
  {
    id: "pressure_scene",
    act: 2,
    title: "Pressure",
    year: 2028,
    environment: "city",
    mood: "tense",
    firstPersonCut: {
      id: "waiting-answer",
      title: "A reply box waits.",
      detail: "The cursor blinks like it knows.",
      kind: "message"
    },
    narration: [
      "Something is waiting for your answer.",
      "You know what happens if you ignore it."
    ],
    choices: [
      { id: "answer_pressure", text: "Answer with the truth", effect: { risk: 3, social: 4, confidence: 2 }, flags: ["asked_for_help"] },
      { id: "avoid_pressure", text: "Leave it unread", effect: { social: -5, confidence: -2 }, flags: ["ignored_message", "avoided_work"] },
      { id: "take_shortcut", text: "Take the shortcut and deal with it later", effect: { risk: 5, luck: -2 }, flags: ["took_big_risk"] }
    ]
  },
  {
    id: "return_scene",
    act: 3,
    title: "Coming Back",
    year: 2029,
    environment: "bedroom",
    mood: "hopeful",
    narration: ["You left it for a while.", "But it didn’t leave you."],
    choices: [
      { id: "come_back_quietly", text: "Come back without announcing it", effect: { consistency: 6, discipline: 3, confidence: 2 }, flags: ["returned_after_failure"] },
      { id: "make_big_return", text: "Make a big plan again", effect: { risk: 2, consistency: -2 }, flags: ["started_over_again"] },
      { id: "ask_someone_back", text: "Ask someone to sit with you while you restart", effect: { social: 5, consistency: 3 }, flags: ["asked_for_help", "returned_after_failure"] }
    ]
  },
  {
    id: "breakthrough_or_not",
    act: 3,
    title: "The Door",
    year: 2029,
    environment: "sunrise",
    mood: "breakthrough",
    movieMoment: {
      id: "silent-door",
      title: "Silent Scene",
      description: "For a few seconds, nothing asks anything from you.",
      rarity: "rare"
    },
    narration: ["Something opens.", "Not fully.", "Enough to make you decide."],
    choices: [
      { id: "walk_through", text: "Walk through before you feel ready", effect: { risk: 6, luck: 3, confidence: 3 }, flags: ["took_big_risk", "lucky_event_seen"] },
      { id: "prepare_at_door", text: "Take one day to prepare properly", effect: { discipline: 4, consistency: 2, risk: -1 }, flags: ["stayed_consistent"] },
      { id: "let_door_close", text: "Let it close and pretend you chose peace", effect: { risk: -5, confidence: -3 }, flags: ["ignored_opportunity", "regret_repeated"] }
    ]
  },
  {
    id: "final_night",
    act: 3,
    title: "The Last Night",
    year: 2030,
    environment: "studio",
    mood: "focused",
    firstPersonCut: {
      id: "desk-last-night",
      title: "The desk is messy.",
      detail: "But now the mess has a shape.",
      kind: "desk"
    },
    memoryObject: {
      id: "alarm-clock",
      name: "Alarm clock",
      description: "The alarm you slept through, then started respecting.",
      quote: "Even late mornings left a mark.",
      effect: { discipline: 2, consistency: 2 }
    },
    narration: [
      "You look at what you made.",
      "It is not everything.",
      "But it is not nothing."
    ],
    choices: [
      { id: "accept_not_nothing", text: "Let it be enough for tonight", effect: { confidence: 4, consistency: 2 }, flags: ["stayed_consistent"] },
      { id: "keep_punishing", text: "Only see what is missing", effect: { confidence: -4, discipline: 1 }, flags: ["burned_out"] },
      { id: "share_final_piece", text: "Show the version that exists", effect: { risk: 4, social: 4, confidence: 2 }, flags: ["sent_unfinished", "took_big_risk"] }
    ]
  },
  {
    id: "ending_setup",
    act: 3,
    title: "What Stayed",
    year: 2030,
    environment: "bedroom",
    mood: "hopeful",
    noChoiceMoment: true,
    narration: [
      "Some things changed.",
      "Some things didn’t.",
      "You can tell which ones were yours."
    ],
    choices: [
      { id: "see_ending", text: "See what stayed", effect: {}, nextScene: "ending" }
    ]
  }
];
