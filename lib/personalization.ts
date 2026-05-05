import { parseUserProfile } from "@/lib/profile-parser";
import type { PlayerProfile, StoryChoice, StoryScene } from "@/lib/story-types";

const clamp = (value: number, min = 1, max = 10) => Math.max(min, Math.min(max, Math.round(value)));

const choiceTextByCategory: Record<string, Partial<Record<string, string>>> = {
  music: {
    "one-hour": "Open the project and work on the track for 20 minutes",
    routine: "Make sound before checking your phone",
    share: "Post the rough track before you delete it",
    "ask-feedback": "Send it to one listener who tells the truth",
    "say-yes": "Say yes to the session before fear takes over",
    learn: "Use the feedback to fix one part of the track",
    "build-system": "Make a weekly release routine from what worked",
    "choose-next": "Take the bigger music risk because you might regret hiding",
    "see-ending": "See where this music life goes"
  },
  business: {
    "one-hour": "Work on the project for 20 minutes",
    routine: "Do one client-building task before checking your phone",
    share: "Publish the rough offer before you overthink it",
    "ask-feedback": "Send it to one potential client for feedback",
    "say-yes": "Take the call even though you feel unready",
    learn: "Use the response to improve the offer",
    "build-system": "Turn the first win into a weekly client routine",
    "choose-next": "Take the bigger business risk because staying small feels worse",
    "see-ending": "See where this business life goes"
  },
  fitness: {
    "one-hour": "Put on shoes and move for 20 minutes",
    routine: "Train before checking your phone",
    share: "Send a real progress update to someone",
    "ask-feedback": "Ask someone experienced to check your routine",
    "say-yes": "Accept the challenge even though you feel unready",
    learn: "Use the hard day to adjust the routine",
    "build-system": "Turn the good week into a repeatable plan",
    "choose-next": "Choose the harder path because your body deserves change",
    "see-ending": "See where this healthier life goes"
  },
  writing: {
    "one-hour": "Open the draft and write badly for 20 minutes",
    routine: "Write one page before checking your phone",
    share: "Share the rough piece before you hide it",
    "ask-feedback": "Send the draft to one honest reader",
    "say-yes": "Accept the brief before doubt talks you out of it",
    learn: "Use the feedback to rewrite one scene",
    "build-system": "Make a weekly writing routine from what worked",
    "choose-next": "Take the bigger creative risk because the draft matters",
    "see-ending": "See where this creative life goes"
  }
};

export function normalizeProfile(profile: PlayerProfile): PlayerProfile {
  const parsedProfile = profile.parsedProfile ?? parseUserProfile(profile);
  return {
    ...profile,
    name: profile.name.trim() || "You",
    age: Number.isFinite(profile.age) ? Math.max(13, Math.min(100, Math.round(profile.age))) : 25,
    country: profile.country.trim() || "your city",
    doneSoFar: profile.doneSoFar?.trim() || "You have been trying to figure out where to begin.",
    goals: profile.goals?.trim() || parsedProfile.mainGoal,
    goal: parsedProfile.mainGoal || profile.goal?.trim() || "build a life that feels real",
    whatIf: profile.whatIf?.trim() || parsedProfile.possibleRegrets[0] || "not starting sooner",
    discipline: clamp(parsedProfile.discipline),
    consistency: clamp(parsedProfile.consistency),
    risk: clamp(parsedProfile.risk),
    creativity: clamp(parsedProfile.creativity),
    social: clamp(parsedProfile.social),
    confidence: clamp(parsedProfile.confidence),
    parsedProfile
  };
}

export function firstName(profile: PlayerProfile) {
  return profile.name.split(" ")[0] || profile.name || "You";
}

export function goalLanguage(goal: string, profile?: PlayerProfile) {
  const parsed = profile?.parsedProfile;
  const lower = `${goal} ${profile?.doneSoFar ?? ""} ${profile?.goals ?? ""}`.toLowerCase();
  if (parsed?.goalCategory === "music" || /(music|producer|beat|song|track|artist|album|sound|rap|sing)/.test(lower)) {
    return {
      craft: "sound",
      work: "track",
      place: "studio corner",
      release: "release",
      audience: "listener",
      opportunity: "session"
    };
  }
  if (parsed?.goalCategory === "business" || /(business|startup|client|product|shop|brand|company|money|sales|website)/.test(lower)) {
    return {
      craft: "project",
      work: "offer",
      place: "desk setup",
      release: "launch",
      audience: "client",
      opportunity: "call"
    };
  }
  if (parsed?.goalCategory === "fitness" || /(fitness|health|body|sport|training|gym|weight)/.test(lower)) {
    return {
      craft: "discipline",
      work: "session",
      place: "quiet morning",
      release: "routine",
      audience: "future self",
      opportunity: "challenge"
    };
  }
  if (parsed?.goalCategory === "writing" || /(write|book|film|design|art|photo|creative|draw)/.test(lower)) {
    return {
      craft: "voice",
      work: "draft",
      place: "desk",
      release: "publish",
      audience: "reader",
      opportunity: "brief"
    };
  }

  return {
    craft: "work",
    work: "step",
    place: "room",
    release: "share",
    audience: "person who needed it",
    opportunity: "opening"
  };
}

export function personalize(template: string, profile: PlayerProfile) {
  const language = goalLanguage(profile.goal, profile);
  const parsed = profile.parsedProfile;
  return template
    .replaceAll("{name}", firstName(profile))
    .replaceAll("{fullName}", profile.name)
    .replaceAll("{age}", String(profile.age))
    .replaceAll("{country}", profile.country)
    .replaceAll("{goal}", profile.goal)
    .replaceAll("{doneSoFar}", profile.doneSoFar)
    .replaceAll("{goals}", profile.goals)
    .replaceAll("{whatIf}", profile.whatIf)
    .replaceAll("{craft}", language.craft)
    .replaceAll("{work}", language.work)
    .replaceAll("{place}", language.place)
    .replaceAll("{release}", language.release)
    .replaceAll("{audience}", language.audience)
    .replaceAll("{opportunity}", language.opportunity)
    .replaceAll("{tone}", parsed?.emotionalTone ?? "hopeful")
    .replaceAll("{theme}", parsed?.keyThemes[0] ?? "starting again");
}

export function personalizeScene(scene: StoryScene, profile: PlayerProfile): StoryScene {
  const parsed = profile.parsedProfile;
  const categoryChoices = parsed ? choiceTextByCategory[parsed.goalCategory] : undefined;
  const mood = parsed?.emotionalTone === "tired" ? "tired" : parsed?.emotionalTone === "stuck" ? "lost" : scene.mood;

  return {
    ...scene,
    mood,
    narration: personalize(scene.narration, profile),
    choices: scene.choices.map((choice) => personalizeChoice(choice, profile, categoryChoices?.[choice.id])),
    memoryObject: scene.memoryObject ? {
      ...scene.memoryObject,
      description: personalize(scene.memoryObject.description, profile),
      quote: personalize(scene.memoryObject.quote, profile)
    } : undefined,
    moodShift: scene.moodShift ? {
      ...scene.moodShift,
      line: personalize(scene.moodShift.line, profile)
    } : undefined,
    relationshipMoment: scene.relationshipMoment ? {
      ...scene.relationshipMoment,
      line: personalize(scene.relationshipMoment.line, profile)
    } : undefined,
    movieMoment: scene.movieMoment ? {
      ...scene.movieMoment,
      description: personalize(scene.movieMoment.description, profile)
    } : undefined
  };
}

function personalizeChoice(choice: StoryChoice, profile: PlayerProfile, categoryText?: string): StoryChoice {
  return {
    ...choice,
    text: personalize(categoryText ?? choice.text, profile)
  };
}
