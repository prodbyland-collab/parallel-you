import type { PlayerProfile } from "@/lib/story-types";

const clamp = (value: number, min = 1, max = 10) => Math.max(min, Math.min(max, Math.round(value)));

export function normalizeProfile(profile: PlayerProfile): PlayerProfile {
  return {
    name: profile.name.trim() || "You",
    age: Number.isFinite(profile.age) ? Math.max(13, Math.min(100, Math.round(profile.age))) : 25,
    country: profile.country.trim() || "your city",
    goal: profile.goal.trim() || "build a life that feels real",
    whatIf: profile.whatIf.trim() || "not starting sooner",
    discipline: clamp(profile.discipline),
    risk: clamp(profile.risk),
    creativity: clamp(profile.creativity),
    social: clamp(profile.social)
  };
}

export function firstName(profile: PlayerProfile) {
  return profile.name.split(" ")[0] || profile.name || "You";
}

export function goalLanguage(goal: string) {
  const lower = goal.toLowerCase();
  if (/(music|producer|beat|song|track|artist|album|sound|rap|sing)/.test(lower)) {
    return {
      craft: "sound",
      work: "track",
      place: "studio",
      release: "release",
      audience: "listener",
      opportunity: "session"
    };
  }
  if (/(business|startup|client|product|shop|brand|company|money|sales)/.test(lower)) {
    return {
      craft: "project",
      work: "offer",
      place: "late-night workspace",
      release: "launch",
      audience: "client",
      opportunity: "deal"
    };
  }
  if (/(fitness|health|body|sport|training|gym|weight)/.test(lower)) {
    return {
      craft: "discipline",
      work: "session",
      place: "quiet morning",
      release: "routine",
      audience: "future self",
      opportunity: "challenge"
    };
  }
  if (/(write|book|film|design|art|photo|creative|draw)/.test(lower)) {
    return {
      craft: "voice",
      work: "piece",
      place: "creative room",
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
  const language = goalLanguage(profile.goal);
  return template
    .replaceAll("{name}", firstName(profile))
    .replaceAll("{fullName}", profile.name)
    .replaceAll("{age}", String(profile.age))
    .replaceAll("{country}", profile.country)
    .replaceAll("{goal}", profile.goal)
    .replaceAll("{whatIf}", profile.whatIf)
    .replaceAll("{craft}", language.craft)
    .replaceAll("{work}", language.work)
    .replaceAll("{place}", language.place)
    .replaceAll("{release}", language.release)
    .replaceAll("{audience}", language.audience)
    .replaceAll("{opportunity}", language.opportunity);
}
