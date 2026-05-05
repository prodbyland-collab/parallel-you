import type { HiddenTraits, PlayerProfile, StoryFlag, StoryRunState, WildCardEvent } from "@/lib/story-types";
import type { SceneTemplate } from "@/lib/story-scenes";

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
    consistency: profile.consistency * 8 + random() * 10,
    risk: profile.risk * 8 + random() * 12,
    creativity: profile.creativity * 8 + random() * 12,
    social: profile.social * 8 + random() * 12,
    confidence: profile.confidence * 8 + random() * 12,
    luck: 24 + profile.confidence * 4 + random() * 24
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
    confidence: clampTrait(traits.confidence + (effect.confidence ?? 0)),
    luck: clampTrait(traits.luck + (effect.luck ?? 0))
  };
}

export const wildCards: WildCardEvent[] = [
  {
    id: "message-after-midnight",
    title: "Old Friend Texts",
    narration: "An old friend texts after midnight: I saw what you posted. Keep going.",
    environment: "city",
    mood: "hopeful",
    effect: { social: 8, creativity: 5, luck: 6 },
    flags: ["lucky_event_seen"],
    rarity: "wild"
  },
  {
    id: "quiet-burnout",
    title: "Bad Sleep",
    narration: "You sleep badly, miss the alarm, and spend the day moving slower than usual.",
    environment: "bedroom",
    mood: "tired",
    effect: { discipline: -5, consistency: -6, creativity: -4 },
    flags: ["burned_out"],
    rarity: "wild"
  },
  {
    id: "public-miss",
    title: "Nobody Notices",
    narration: "You post something and almost nobody reacts. It stings, but you still did the work.",
    environment: "city",
    mood: "tense",
    effect: { risk: 8, creativity: 4, social: -4 },
    flags: ["took_big_risk"],
    rarity: "wild"
  },
  {
    id: "family-pressure",
    title: "Family Pressure",
    narration: "Someone asks what you are doing with your life. You laugh a little, then think about it all night.",
    environment: "bedroom",
    mood: "tense",
    effect: { confidence: -3, discipline: 3, consistency: 1 },
    flags: ["regret_repeated"],
    rarity: "wild"
  },
  {
    id: "strange-spark",
    title: "Small Idea on a Walk",
    narration: "A useful idea shows up during a normal walk, so you write it down before it disappears.",
    environment: "studio",
    mood: "breakthrough",
    effect: { creativity: 11, luck: 4 },
    flags: ["breakthrough_seen"],
    rarity: "wild"
  },
  {
    id: "perfect-room",
    title: "The Right Person Sees It",
    narration: "One person with the right connection sees your work and sends a short, serious message.",
    environment: "spotlight",
    mood: "breakthrough",
    effect: { luck: 14, social: 10, risk: 8 },
    flags: ["lucky_event_seen", "breakthrough_seen"],
    rarity: "rare"
  },
  {
    id: "total-reset",
    title: "Unexpected Expense",
    narration: "A sudden expense changes the week. You have to slow down, adjust, and choose what still matters.",
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

export function shouldTriggerWildcard(state: StoryRunState, sceneIndex: number) {
  const random = seededRandom(state.seed + sceneIndex * 101 + state.choices.length * 17);
  return chance(random, 0.2 + state.traits.luck / 700);
}

export function shouldTriggerRareEvent(state: StoryRunState, sceneIndex: number) {
  const random = seededRandom(state.seed + sceneIndex * 191 + state.choices.length * 29);
  return chance(random, 0.05 + (state.traits.luck > 70 ? 0.04 : 0));
}

export function selectSceneVariation(template: SceneTemplate, state: StoryRunState) {
  const callbacks = getSceneCallbackVariation(template.id, state);
  if (callbacks) return callbacks.join(" ");
  const variations = template.variations ?? [template.narration];
  const random = seededRandom(state.seed + state.choices.length * 41 + template.id.length * 11);
  const index = Math.floor(random() * variations.length);
  return (variations[index] ?? template.narration).join(" ");
}

function getSceneCallbackVariation(sceneId: string, state: StoryRunState) {
  const previous = state.choices[state.choices.length - 1]?.choiceId;
  const name = state.profile.name || "you";
  const map: Partial<Record<string, Partial<Record<string, string[]>>>> = {
    first_attempt: {
      open_project: ["You opened it.", "The file did not thank you.", "Then the ugly part started."],
      do_nothing: ["You sat there until the room got smug.", "Then you started badly anyway."],
      message_someone: ["The text sits there after you send it.", "You start before the reply can save you."]
    },
    message: {
      fix_small_part: ["One small thing is fixed.", "The phone notices, because phones are nosy."],
      start_over_again: ["The new version is open.", "So is the old doubt.", "Then the phone lights up."],
      close_try_tomorrow: ["Tomorrow arrives with poor manners.", "Your phone lights up before you do anything."]
    },
    small_win: {
      push_late: ["You stayed a little longer.", "It was not heroic.", "It worked anyway."],
      sleep_instead: ["Sleep helped a little.", "The small win came later than planned."],
      scroll_late: ["You lost the night.", "Then stole back one small piece of the morning."]
    },
    old_pattern: {
      skip_today: ["You said tomorrow again.", "You heard yourself say it."],
      polish_forever: ["You kept fixing the safe parts.", "The hard part waited."],
      act_cool: ["You acted like it did not matter.", "It did."]
    },
    return_scene: {
      avoid_pressure: [`${name} left the answer too long.`, "Coming back feels quieter after that."],
      take_shortcut: ["The shortcut helped for a second.", "Then it left a mess to clean up."],
      repeat_pattern: ["The pattern won again.", "But not forever."]
    }
  };
  return previous ? map[sceneId]?.[previous] : undefined;
}
