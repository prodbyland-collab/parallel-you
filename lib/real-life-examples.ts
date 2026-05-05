import type { GoalCategory, PlayerProfile, StoryRunState } from "@/lib/story-types";

const examples: Record<GoalCategory | "general", string[]> = {
  music: [
    "staring at an unfinished project file",
    "exporting a rough demo",
    "sending a beat to one artist",
    "deleting a loop after hearing it too many times",
    "checking if anyone listened",
    "opening FL Studio or a DAW and doing nothing",
    "renaming a file final_final_3",
    "comparing your sound to someone bigger"
  ],
  business: [
    "rewriting the landing page headline",
    "sending a client message",
    "checking analytics with no visitors",
    "fixing one broken page",
    "delaying launch again",
    "showing someone the ugly first version",
    "getting one reply that changes your mood"
  ],
  fitness: [
    "skipping the gym and saying tomorrow",
    "doing an ugly 20-minute workout",
    "cooking something simple",
    "checking weight in the morning",
    "feeling embarrassed at the gym",
    "choosing sleep over training",
    "telling one friend you're trying"
  ],
  writing: [
    "staring at a blank page",
    "deleting one sentence",
    "rereading the same paragraph",
    "sending an unfinished draft",
    "opening old notes",
    "writing one bad page",
    "starting another idea instead of finishing"
  ],
  career: [
    "rewriting a portfolio line",
    "leaving a job application half done",
    "checking email too often",
    "asking someone for a referral",
    "closing the laptop after one rejection"
  ],
  school: [
    "opening notes and reading the same line",
    "checking the deadline again",
    "studying for twenty ugly minutes",
    "leaving the assignment tab open",
    "telling yourself the morning will be cleaner"
  ],
  relationship: [
    "leaving a message unread",
    "typing a reply and deleting it",
    "saying you're fine too fast",
    "walking home with the conversation still in your head",
    "calling before pride gets comfortable"
  ],
  personal: [
    "sitting in a quiet room",
    "waking up later than planned",
    "cleaning the desk instead of doing the thing",
    "walking at night",
    "pretending everything is fine"
  ],
  general: [
    "ignoring a message",
    "leaving a notification unread",
    "waking up later than planned",
    "sitting in a quiet room",
    "walking at night",
    "checking your phone too much",
    "pretending everything is fine",
    "doing nothing and feeling the day pass",
    "one small compliment staying in your head",
    "missing an opportunity because you waited too long"
  ]
};

const objectDetails = [
  "the unread message",
  "the unfinished file",
  "the cold coffee",
  "the clean desk",
  "the exported track",
  "the blank page",
  "the shoes by the door",
  "the laptop left open",
  "the bad file name",
  "the alarm you ignored"
];

export function getRealLifeExamples(profile: PlayerProfile, storyState?: StoryRunState) {
  const category = profile.parsedProfile?.goalCategory ?? "general";
  const categoryExamples = examples[category] ?? examples.general;
  const patternExamples = getPatternExamples(storyState);
  return {
    sceneDetails: [...patternExamples, ...categoryExamples, ...examples.general].slice(0, 14),
    objectDetails,
    choiceDetails: [...categoryExamples, ...examples.general].slice(0, 12),
    callbackDetails: [
      ...(storyState?.memories.map((memory) => memory.name.toLowerCase()) ?? []),
      ...(storyState?.missedOpportunities ?? []),
      ...objectDetails
    ].slice(0, 12)
  };
}

function getPatternExamples(storyState?: StoryRunState) {
  if (!storyState) return [];
  const patterns = new Set(storyState.repeatedPatterns ?? []);
  const details: string[] = [];
  if (patterns.has("starts_not_finishes")) details.push("starting another version instead of finishing this one", "renaming the file again");
  if (patterns.has("avoids_messages")) details.push("watching a reply bubble disappear", "leaving a message unread until the screen goes dark");
  if (patterns.has("keeps_showing_up")) details.push("doing the boring version again", "saving the small proof before judging it");
  if (patterns.has("burns_out")) details.push("choosing sleep with the laptop still open", "waking up with the same tab waiting");
  return details;
}
