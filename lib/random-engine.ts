import type { HiddenTraits, PlayerProfile, StoryFlag, StoryRunState, WildCardEvent } from "@/lib/story-types";

export function createSeed() {
  return Math.floor(Math.random() * 2147483647);
}

export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function chance(random: () => number, probability: number) {
  return random() < probability;
}

export function pickWeighted<T>(random: () => number, items: Array<{ item: T; weight: number }>) {
  const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  let roll = random() * total;
  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.item;
  }
  return items[items.length - 1].item;
}

export function createInitialTraits(profile: PlayerProfile, seed: number): HiddenTraits {
  const random = seededRandom(seed);
  return {
    discipline: profile.discipline * 8 + random() * 12,
    consistency: profile.discipline * 7 + random() * 10,
    risk: profile.risk * 8 + random() * 12,
    creativity: profile.creativity * 8 + random() * 12,
    social: profile.social * 8 + random() * 12,
    luck: 30 + random() * 45
  };
}

export function clampTrait(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyTraitEffect(traits: HiddenTraits, effect: Partial<HiddenTraits>): HiddenTraits {
  return {
    discipline: clampTrait(traits.discipline + (effect.discipline ?? 0)),
    consistency: clampTrait(traits.consistency + (effect.consistency ?? 0)),
    risk: clampTrait(traits.risk + (effect.risk ?? 0)),
    creativity: clampTrait(traits.creativity + (effect.creativity ?? 0)),
    social: clampTrait(traits.social + (effect.social ?? 0)),
    luck: clampTrait(traits.luck + (effect.luck ?? 0))
  };
}

export const wildCards: WildCardEvent[] = [
  {
    id: "message-after-midnight",
    title: "The Late-Night Message",
    narration: "A message arrives from someone who saw your work when you thought nobody noticed.",
    environment: "city",
    mood: "hopeful",
    effect: { social: 8, creativity: 5, luck: 6 },
    flags: ["lucky_event_seen"],
    rarity: "wild"
  },
  {
    id: "quiet-burnout",
    title: "Quiet Burnout",
    narration: "Your body finally says what your schedule ignored. The lights stay on, but you move slower.",
    environment: "bedroom",
    mood: "tired",
    effect: { discipline: -5, consistency: -6, creativity: -4 },
    flags: ["burned_out"],
    rarity: "wild"
  },
  {
    id: "public-miss",
    title: "The Public Mistake",
    narration: "You try something before it is ready. It hurts, but it also proves you can survive being seen.",
    environment: "city",
    mood: "tense",
    effect: { risk: 8, creativity: 4, social: -4 },
    flags: ["took_big_risk"],
    rarity: "wild"
  },
  {
    id: "strange-spark",
    title: "The Strange Idea",
    narration: "At a bad time, in a bad mood, a good idea finally appears.",
    environment: "studio",
    mood: "breakthrough",
    effect: { creativity: 11, luck: 4 },
    flags: ["breakthrough_seen"],
    rarity: "wild"
  },
  {
    id: "perfect-room",
    title: "The Perfect Room",
    narration: "For one night, timing, courage, and attention all show up together.",
    environment: "spotlight",
    mood: "breakthrough",
    effect: { luck: 14, social: 10, risk: 8 },
    flags: ["lucky_event_seen", "breakthrough_seen"],
    rarity: "rare"
  },
  {
    id: "total-reset",
    title: "The Total Reset",
    narration: "Something ends. It hurts, but it also feels like a door finally closing.",
    environment: "void",
    mood: "lost",
    effect: { consistency: 8, discipline: 4, risk: -5 },
    flags: ["returned_after_failure"],
    rarity: "rare"
  }
];

export function maybeCreateWildCard(state: StoryRunState, sceneIndex: number) {
  if (sceneIndex < 5 || state.wildcardsUsed.length >= 3) return null;
  const random = seededRandom(state.seed + sceneIndex * 101 + state.choices.length * 17);
  const rareBoost = state.traits.luck > 68 ? 0.04 : 0;
  const wildProbability = 0.18 + state.traits.luck / 600;
  const rareProbability = 0.045 + rareBoost;

  if (!chance(random, wildProbability) && !chance(random, rareProbability)) return null;

  const used = new Set(state.wildcardsUsed.map((event) => event.id));
  const pool = wildCards.filter((event) => !used.has(event.id));
  if (!pool.length) return null;

  const flags = new Set<StoryFlag>(state.flags);
  return pickWeighted(
    random,
    pool.map((event) => ({
      item: event,
      weight:
        (event.rarity === "rare" ? rareProbability * 100 : 12) +
        (event.id === "quiet-burnout" && flags.has("avoided_work") ? 8 : 0) +
        (event.id === "strange-spark" && state.traits.creativity > 65 ? 7 : 0) +
        (event.id === "message-after-midnight" && state.traits.social > 55 ? 7 : 0)
    }))
  );
}
