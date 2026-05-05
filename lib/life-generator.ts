export type OnboardingInput = {
  name: string;
  age: number;
  country: string;
  mainGoal: string;
  regret: string;
  discipline: number;
  risk: number;
  creativity: number;
  social: number;
};

export type PathStats = {
  money: number;
  health: number;
  happiness: number;
  relationships: number;
  creativity: number;
  discipline: number;
};

export type LifeScores = Pick<PathStats, "happiness" | "money" | "health" | "relationships" | "creativity">;

export type MilestoneBadge = "SAFE" | "RISKY" | "RARE" | "HIGH REWARD" | "FOCUS" | "LUCK";

export type AvatarMood = "hopeful" | "tired" | "confident" | "focused" | "lost" | "breakthrough";
export type AvatarPosture = "neutral" | "slouched" | "strong" | "walking" | "celebrating";
export type SceneType = "bedroom" | "studio" | "city" | "sunrise" | "spotlight" | "void";

export type AvatarState = {
  mood: AvatarMood;
  posture: AvatarPosture;
  outfitLevel: number;
  auraIntensity: number;
  cinematicColor: string;
  sceneType: SceneType;
};

export type GameMilestone = {
  id: string;
  year: number;
  age: number;
  title: string;
  simpleResult: string;
  whyItHappened: string;
  lesson: string;
  badge: MilestoneBadge;
  statsChange: PathStats;
  emotionalState: string;
  avatarState: AvatarState;
};

export type LifePath = {
  id: string;
  title: string;
  simpleMeaning: string;
  personalSummary: string;
  bestStat: keyof PathStats;
  weakestStat: keyof PathStats;
  biggestTradeoff: string;
  stats: PathStats;
  milestones: GameMilestone[];
  accent: string;
  color: string;
};

export type UserSummary = {
  name: string;
  currentAge: number;
  country: string;
  goal: string;
  whatIf: string;
  keyWeakness: string;
  strongestTrait: string;
  disciplineScore: number;
  creativityScore: number;
  riskScore: number;
  socialScore: number;
};

export type LifeSimulationResult = {
  userSummary: UserSummary;
  paths: LifePath[];
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const score10 = (value: number | undefined) => clamp(value ?? 5, 1, 10);

const bestStat = (stats: PathStats) =>
  (Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0] ?? "happiness") as keyof PathStats;

const weakestStat = (stats: PathStats) =>
  (Object.entries(stats).sort((a, b) => a[1] - b[1])[0][0] ?? "health") as keyof PathStats;

const statChange = (change: Partial<PathStats>): PathStats => ({
  money: change.money ?? 0,
  health: change.health ?? 0,
  happiness: change.happiness ?? 0,
  relationships: change.relationships ?? 0,
  creativity: change.creativity ?? 0,
  discipline: change.discipline ?? 0
});

const milestone = (
  pathId: string,
  year: number,
  age: number,
  title: string,
  simpleResult: string,
  whyItHappened: string,
  lesson: string,
  badge: MilestoneBadge,
  statsChange: Partial<PathStats>,
  emotionalState: string,
  avatarState?: Partial<AvatarState>
): GameMilestone => {
  const change = statChange(statsChange);
  return {
    id: `${pathId}-${year}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    year,
    age,
    title,
    simpleResult,
    whyItHappened,
    lesson,
    badge,
    statsChange: change,
    emotionalState,
    avatarState: { ...defaultAvatarState(pathId, year, badge, change), ...avatarState }
  };
};

function defaultAvatarState(pathId: string, year: number, badge: MilestoneBadge, change: PathStats): AvatarState {
  const episode = clamp(year - 2025, 1, 5);
  const positiveEnergy = change.happiness + change.creativity + change.money + change.discipline;
  const tired = change.health < -3 || change.happiness < -3;
  const breakthrough = badge === "HIGH REWARD" || badge === "RARE";

  const mood: AvatarMood = breakthrough ? "breakthrough" : tired ? "tired" : change.discipline > 8 ? "focused" : positiveEnergy > 18 ? "confident" : "hopeful";
  const posture: AvatarPosture = breakthrough ? "celebrating" : tired ? "slouched" : change.discipline > 8 ? "strong" : episode > 2 ? "walking" : "neutral";

  const pathScene: Record<string, Pick<AvatarState, "cinematicColor" | "sceneType">> = {
    current: { cinematicColor: "#22d3ee", sceneType: episode < 3 ? "bedroom" : "void" },
    disciplined: { cinematicColor: "#34d399", sceneType: "sunrise" },
    risk: { cinematicColor: "#fb7185", sceneType: "city" },
    creative: { cinematicColor: "#d946ef", sceneType: "studio" },
    lucky: { cinematicColor: "#facc15", sceneType: "spotlight" }
  };

  const scene = pathScene[pathId] ?? { cinematicColor: "#a78bfa", sceneType: "void" as SceneType };

  return {
    mood,
    posture,
    outfitLevel: episode,
    auraIntensity: clamp(32 + episode * 10 + Math.max(0, positiveEnergy), 0, 100),
    cinematicColor: scene.cinematicColor,
    sceneType: scene.sceneType
  };
}

export function normalizeInput(input: OnboardingInput): OnboardingInput {
  return {
    name: input.name.trim() || "Future You",
    age: Number.isFinite(input.age) ? clamp(input.age, 13, 100) : 25,
    country: input.country.trim() || "your corner of the world",
    mainGoal: input.mainGoal.trim() || "build a life that feels meaningful",
    regret: input.regret.trim() || "not starting sooner",
    discipline: score10(input.discipline),
    risk: score10(input.risk),
    creativity: score10(input.creativity),
    social: score10(input.social)
  };
}

function createPath(path: Omit<LifePath, "bestStat" | "weakestStat">): LifePath {
  return {
    ...path,
    bestStat: bestStat(path.stats),
    weakestStat: weakestStat(path.stats)
  };
}

export function generateLifeSimulation(rawInput: OnboardingInput): LifeSimulationResult {
  const input = normalizeInput(rawInput);
  const years = [2026, 2027, 2028, 2029, 2030];
  const ages = years.map((_, index) => input.age + index);
  const firstName = input.name.split(" ")[0] || input.name;

  const strongestTrait =
    input.creativity >= input.discipline && input.creativity >= input.risk && input.creativity >= input.social
      ? "creativity"
      : input.discipline >= input.risk && input.discipline >= input.social
        ? "discipline"
        : input.risk >= input.social
          ? "courage"
          : "social energy";

  const keyWeakness =
    input.discipline <= input.risk && input.discipline <= input.creativity && input.discipline <= input.social
      ? "consistency"
      : input.risk <= input.creativity && input.risk <= input.social
        ? "taking bigger chances"
        : input.social <= input.creativity
          ? "asking for help"
          : "turning ideas into visible work";

  const userSummary: UserSummary = {
    name: input.name,
    currentAge: input.age,
    country: input.country,
    goal: input.mainGoal,
    whatIf: input.regret,
    keyWeakness,
    strongestTrait,
    disciplineScore: input.discipline,
    creativityScore: input.creativity,
    riskScore: input.risk,
    socialScore: input.social
  };

  const currentStats: PathStats = {
    money: clamp(42 + input.discipline * 3 + input.risk),
    health: clamp(44 + input.discipline * 3),
    happiness: clamp(46 + input.social * 2 + input.creativity),
    relationships: clamp(40 + input.social * 4),
    creativity: clamp(40 + input.creativity * 4),
    discipline: clamp(35 + input.discipline * 5)
  };

  const disciplinedStats: PathStats = {
    money: clamp(52 + input.discipline * 4),
    health: clamp(58 + input.discipline * 4),
    happiness: clamp(50 + input.discipline * 3),
    relationships: clamp(42 + input.social * 3),
    creativity: clamp(36 + input.creativity * 3),
    discipline: clamp(68 + input.discipline * 3)
  };

  const riskStats: PathStats = {
    money: clamp(38 + input.risk * 6 + input.discipline),
    health: clamp(42 + input.discipline * 2 - Math.max(0, input.risk - 7) * 2),
    happiness: clamp(48 + input.risk * 4 + input.social),
    relationships: clamp(42 + input.social * 4),
    creativity: clamp(46 + input.creativity * 3 + input.risk),
    discipline: clamp(34 + input.discipline * 3)
  };

  const creativeStats: PathStats = {
    money: clamp(34 + input.creativity * 4 + input.discipline),
    health: clamp(42 + input.discipline * 2),
    happiness: clamp(52 + input.creativity * 4),
    relationships: clamp(42 + input.social * 3 + input.creativity),
    creativity: clamp(66 + input.creativity * 4),
    discipline: clamp(34 + input.discipline * 3)
  };

  const luckyStats: PathStats = {
    money: clamp(44 + input.social * 3 + input.risk * 3),
    health: clamp(44 + input.discipline * 2 + input.social),
    happiness: clamp(56 + input.social * 4 + input.risk),
    relationships: clamp(58 + input.social * 4),
    creativity: clamp(42 + input.creativity * 3 + input.risk),
    discipline: clamp(38 + input.discipline * 3)
  };

  const paths: LifePath[] = [
    createPath({
      id: "current",
      title: "Current Path",
      simpleMeaning: "Stayed the same",
      personalSummary: `If ${firstName} keeps discipline at ${input.discipline}/10, progress toward ${input.mainGoal} is real but slower.`,
      biggestTradeoff: "Comfort stays high, but big change takes longer.",
      stats: currentStats,
      accent: "from-cyan-300 to-violet-400",
      color: "#22d3ee",
      milestones: [
        milestone("current", years[0], ages[0], "You notice the fork", `${firstName} turns "${input.mainGoal}" into a real target.`, `The what-if "${input.regret}" keeps bothering ${firstName}.`, "Naming the goal is the first move.", "SAFE", { happiness: 3, discipline: 4 }, "Awake but unsure"),
        milestone("current", years[1], ages[1], "Progress stays slow", `${firstName} improves, but only when motivation shows up.`, `Discipline is still ${input.discipline}/10, so the system is not automatic yet.`, "A weak system makes strong goals feel heavy.", "SAFE", { money: 4, discipline: 5, happiness: -2 }, "Frustrated but still trying"),
        milestone("current", years[2], ages[2], "A weekly rhythm appears", `Work on ${input.mainGoal} becomes more regular.`, `${firstName} learns which distractions keep repeating in ${input.country}.`, "Consistency beats intensity.", "FOCUS", { discipline: 8, health: 3, creativity: 4 }, "Cautiously proud"),
        milestone("current", years[3], ages[3], "People notice the effort", `${firstName}'s work starts looking serious.`, "Small repetitions finally become visible to other people.", "Being seen is easier after doing the reps.", "SAFE", { relationships: 5, money: 6, happiness: 4 }, "More confident"),
        milestone("current", years[4], ages[4], "The path stabilizes", `${firstName} has a calmer life, but still wonders about bolder choices.`, "The current path protected stability more than speed.", "A safe path still needs brave upgrades.", "SAFE", { health: 5, money: 5, happiness: 5 }, "Stable, with a quiet itch")
      ]
    }),
    createPath({
      id: "disciplined",
      title: "Disciplined Path",
      simpleMeaning: "Built discipline",
      personalSummary: `If ${firstName} raises discipline from ${input.discipline}/10 to 8/10, ${input.mainGoal} starts compounding by 2027.`,
      biggestTradeoff: "You gain control, but spontaneity drops.",
      stats: disciplinedStats,
      accent: "from-emerald-300 to-cyan-300",
      color: "#34d399",
      milestones: [
        milestone("disciplined", years[0], ages[0], "You install the routine", `${firstName} starts showing up every week.`, `The old regret "${input.regret}" becomes fuel instead of shame.`, "Small daily consistency beats one big motivation burst.", "FOCUS", { discipline: 18, health: 6, happiness: 3 }, "Locked in"),
        milestone("disciplined", years[1], ages[1], "You finally become consistent", `${input.mainGoal} improves because ${firstName} shows up every week.`, "Discipline becomes the default, not a mood.", "A routine is a cheat code for future you.", "HIGH REWARD", { discipline: 20, money: 8, health: 7, relationships: -5 }, "Proud but intense"),
        milestone("disciplined", years[2], ages[2], "Your work becomes reliable", `${firstName} can now predict progress.`, "The system removes daily negotiation.", "Predictable action creates predictable growth.", "FOCUS", { money: 12, discipline: 10, creativity: 4 }, "Calm and powerful"),
        milestone("disciplined", years[3], ages[3], "You become the dependable one", "People trust this version because follow-through is obvious.", "Consistency changes reputation.", "Trust is earned in boring weeks.", "RARE", { relationships: 8, money: 8, health: 5 }, "Respected"),
        milestone("disciplined", years[4], ages[4], "The compound effect hits", `${firstName} is far closer to ${input.mainGoal}.`, "Five years of discipline beats five years of wishing.", "The future rewards repetition.", "HIGH REWARD", { money: 15, health: 10, happiness: 8, discipline: 12 }, "Secure")
      ]
    }),
    createPath({
      id: "risk",
      title: "Risk Path",
      simpleMeaning: "Took bigger risks",
      personalSummary: `If ${firstName} pushes risk tolerance beyond ${input.risk}/10, the upside gets bigger but the floor gets shakier.`,
      biggestTradeoff: "You earn more upside, but stress rises.",
      stats: riskStats,
      accent: "from-rose-400 to-orange-300",
      color: "#fb7185",
      milestones: [
        milestone("risk", years[0], ages[0], "You make the public move", `${firstName} starts before feeling fully ready.`, `Risk tolerance is ${input.risk}/10, so courage is available but not free.`, "A visible bet creates visible feedback.", "RISKY", { money: -5, happiness: 8, creativity: 6, relationships: 3 }, "Exposed and alive"),
        milestone("risk", years[1], ages[1], "The first bet gets messy", "One choice costs money or comfort, but teaches fast.", "Risk creates sharper lessons than planning.", "A scar can become a map.", "RISKY", { money: -8, health: -4, creativity: 10, happiness: -3 }, "Bruised but sharper"),
        milestone("risk", years[2], ages[2], "A bigger door opens", `${firstName} meets someone or finds an opportunity tied to ${input.mainGoal}.`, "The path moved fast enough for luck to notice.", "Momentum attracts options.", "HIGH REWARD", { money: 18, relationships: 10, creativity: 7 }, "Hungry"),
        milestone("risk", years[3], ages[3], "You learn controlled risk", "The chaos becomes a playbook.", "The best risks are measured, not random.", "Boldness needs rules.", "RARE", { discipline: 8, money: 10, health: 4 }, "Dangerously competent"),
        milestone("risk", years[4], ages[4], "You have the wildest story", "This version wins big or learns big. Either way, life expands.", "Risk changed the size of the game board.", "No bold path is emotionally neutral.", "HIGH REWARD", { money: 16, happiness: 8, health: -5, relationships: 5 }, "Alive, slightly haunted")
      ]
    }),
    createPath({
      id: "creative",
      title: "Creative Path",
      simpleMeaning: "Focused on creativity",
      personalSummary: `If ${firstName} leans into creativity at ${input.creativity}/10, the path becomes more expressive and less predictable.`,
      biggestTradeoff: "You become more original, but money grows slower at first.",
      stats: creativeStats,
      accent: "from-fuchsia-400 to-indigo-400",
      color: "#d946ef",
      milestones: [
        milestone("creative", years[0], ages[0], "You share the private idea", `${firstName} starts making the work visible.`, `${input.regret} becomes material instead of a hidden ache.`, "Expression turns regret into fuel.", "RARE", { creativity: 16, happiness: 6, money: -2 }, "Nervous and lit up"),
        milestone("creative", years[1], ages[1], "Your style gets clearer", "People can tell what feels like you.", `Creativity is already ${input.creativity}/10, so the signal is there.`, "Taste becomes power when it is repeated.", "FOCUS", { creativity: 18, relationships: 6, money: 3 }, "Seen"),
        milestone("creative", years[2], ages[2], "A community forms", "The right people start responding to the work.", "Visibility attracts collaborators.", "Your audience is a mirror and a battery.", "RARE", { relationships: 12, creativity: 10, happiness: 7 }, "Inspired"),
        milestone("creative", years[3], ages[3], "Creativity becomes income", `${input.mainGoal} starts connecting to paid opportunities.`, "The work is now specific enough to sell.", "Originality needs a container.", "HIGH REWARD", { money: 10, creativity: 12, discipline: 4 }, "Confident"),
        milestone("creative", years[4], ages[4], "You own a body of work", `${firstName} has proof that the inner world became real.`, "Five years of publishing creates a visible archive.", "Make enough things and identity catches up.", "RARE", { creativity: 18, happiness: 10, relationships: 5 }, "Proud and softer")
      ]
    }),
    createPath({
      id: "lucky",
      title: "Lucky Path",
      simpleMeaning: "Got lucky breaks",
      personalSummary: `If ${firstName} uses social energy at ${input.social}/10 and says yes more often, lucky breaks become more likely.`,
      biggestTradeoff: "You get surprise opportunities, but control is lower.",
      stats: luckyStats,
      accent: "from-amber-300 to-lime-300",
      color: "#facc15",
      milestones: [
        milestone("lucky", years[0], ages[0], "You say yes", `${firstName} accepts an invitation that seems small.`, `Social energy is ${input.social}/10, so people can become portals.`, "Luck often arrives as a person.", "LUCK", { relationships: 10, happiness: 6 }, "Open"),
        milestone("lucky", years[1], ages[1], "The right intro happens", "Someone connects you to a useful opportunity.", "You stayed visible instead of disappearing.", "Being findable is part of being lucky.", "LUCK", { money: 8, relationships: 12, happiness: 5 }, "Delighted"),
        milestone("lucky", years[2], ages[2], "A lucky break accelerates the goal", `${input.mainGoal} moves faster than expected.`, "Preparation met timing.", "Luck helps people who are already moving.", "HIGH REWARD", { money: 15, happiness: 10, creativity: 5 }, "Astonished"),
        milestone("lucky", years[3], ages[3], "You protect the win", "The lucky break becomes a system.", "Good fortune needs structure or it leaks away.", "Protect the door after it opens.", "FOCUS", { discipline: 8, money: 8, health: 3 }, "Grateful and serious"),
        milestone("lucky", years[4], ages[4], "Prepared luck becomes your brand", "People think it was magic, but it was openness plus movement.", "You learned to notice doors early.", "Luck found you moving.", "LUCK", { relationships: 10, money: 10, happiness: 8 }, "Fortunate")
      ]
    })
  ];

  return { userSummary, paths };
}

export function mergeLifePaths(first: LifePath, second: LifePath, user: UserSummary): LifePath {
  const stats: PathStats = {
    money: clamp((first.stats.money + second.stats.money) / 2 + 5),
    health: clamp((first.stats.health + second.stats.health) / 2 + 4),
    happiness: clamp((first.stats.happiness + second.stats.happiness) / 2 + 5),
    relationships: clamp((first.stats.relationships + second.stats.relationships) / 2 + 3),
    creativity: clamp((first.stats.creativity + second.stats.creativity) / 2 + 4),
    discipline: clamp((first.stats.discipline + second.stats.discipline) / 2 + 4)
  };

  return createPath({
    id: `merged-${first.id}-${second.id}`,
    title: "Merged Path",
    simpleMeaning: `${first.simpleMeaning} + ${second.simpleMeaning}`,
    personalSummary: `${user.name} combines ${first.title.toLowerCase()} with ${second.title.toLowerCase()} instead of choosing only one future.`,
    biggestTradeoff: "More balanced, but harder to keep simple.",
    stats,
    accent: "from-cyan-300 via-fuchsia-400 to-amber-300",
    color: "#a78bfa",
    milestones: first.milestones.map((item, index) => {
      const other = second.milestones[index] ?? item;
      return milestone(
        `merged-${first.id}-${second.id}`,
        item.year,
        item.age,
        `Merged: ${item.title}`,
        `${item.simpleResult} Plus: ${other.simpleResult}`,
        `${user.name} borrows the strongest move from both timelines.`,
        "You can merge paths, but you still need one next action.",
        "RARE",
        {
          money: Math.round((item.statsChange.money + other.statsChange.money) / 2),
          health: Math.round((item.statsChange.health + other.statsChange.health) / 2),
          happiness: Math.round((item.statsChange.happiness + other.statsChange.happiness) / 2),
          relationships: Math.round((item.statsChange.relationships + other.statsChange.relationships) / 2),
          creativity: Math.round((item.statsChange.creativity + other.statsChange.creativity) / 2),
          discipline: Math.round((item.statsChange.discipline + other.statsChange.discipline) / 2)
        },
        `${item.emotionalState} + ${other.emotionalState}`
      );
    })
  });
}

// Backwards-compatible export name for older app code/tests.
export const generateParallelLives = generateLifeSimulation;
