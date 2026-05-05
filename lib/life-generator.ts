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

export type LifeScores = {
  happiness: number;
  money: number;
  health: number;
  relationships: number;
  creativity: number;
};

export type MilestoneCategory = "money" | "health" | "love" | "career" | "creativity" | "mindset";

export type LifeMilestone = {
  id: string;
  year: number;
  dateLabel: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  impactScore: number;
  statsChange: {
    money: number;
    health: number;
    relationships: number;
    creativity: number;
    happiness: number;
  };
  emotionalState: string;
  thought: string;
  isMajorEvent: boolean;
  moneyChange: string;
  relationshipChange: string;
  healthChange: string;
  creativityChange: string;
};

export type ParallelVersion = {
  id: string;
  title: string;
  summary: string;
  archetype: "current" | "disciplined" | "risk" | "creative" | "lucky" | "merged";
  accent: string;
  glow: string;
  shortStory: string;
  personalityTraits: string[];
  careerDirection: string;
  moneySituation: string;
  socialLife: string;
  mentalState: string;
  biggestAchievement: string;
  biggestWeakness: string;
  quote: string;
  timeline: LifeMilestone[];
  scores: LifeScores;
};

const clamp = (value: number, min = 1, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const score10 = (value: number | undefined) => clamp(value ?? 5, 1, 10);

const toneFor = (value: number, high: string, mid: string, low: string) => {
  if (value >= 8) return high;
  if (value >= 5) return mid;
  return low;
};

const milestone = (
  year: number,
  title: string,
  description: string,
  category: MilestoneCategory,
  impactScore: number,
  emotionalState: string,
  moneyChange: string,
  relationshipChange: string,
  healthChange: string,
  creativityChange: string
): LifeMilestone => ({
  id: `${year}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  year,
  dateLabel: `${year}`,
  title,
  description,
  category,
  impactScore: clamp(impactScore, 1, 100),
  statsChange: statDelta(category, impactScore),
  emotionalState,
  thought: thoughtFor(category, title),
  isMajorEvent: impactScore >= 80,
  moneyChange,
  relationshipChange,
  healthChange,
  creativityChange
});

const statDelta = (category: MilestoneCategory, impactScore: number) => {
  const power = Math.max(2, Math.round((impactScore - 50) / 8));
  const base = { money: 0, health: 0, relationships: 0, creativity: 0, happiness: Math.max(1, Math.round(power / 2)) };
  if (category === "money") return { ...base, money: power + 2 };
  if (category === "health") return { ...base, health: power + 2 };
  if (category === "love") return { ...base, relationships: power + 2, happiness: base.happiness + 1 };
  if (category === "career") return { ...base, money: power, happiness: base.happiness + 1 };
  if (category === "creativity") return { ...base, creativity: power + 2 };
  return { ...base, health: 1, creativity: 1, happiness: base.happiness + 2 };
};

const thoughtFor = (category: MilestoneCategory, title: string) => {
  const thoughts: Record<MilestoneCategory, string> = {
    money: "I can feel the future getting less fragile.",
    health: "The body is part of the timeline, not a side quest.",
    love: "The people around me are changing the map.",
    career: "This is where intention becomes evidence.",
    creativity: "I made something real enough to answer back.",
    mindset: "A different thought created a different route."
  };
  return `${thoughts[category]} (${title})`;
};

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

export function generateParallelLives(rawInput: OnboardingInput): ParallelVersion[] {
  const input = normalizeInput(rawInput);
  const startYear = 2026;
  const years = Array.from({ length: 5 }, (_, index) => startYear + index);
  const disciplineMood = toneFor(input.discipline, "already trusts routines", "can build routines with the right stakes", "needs tiny rituals before big promises");
  const riskMood = toneFor(input.risk, "moves fast when the door opens", "tests the door before walking through", "protects stability before gambling");
  const socialMood = toneFor(input.social, "gets energy from rooms full of people", "keeps a tight circle and expands carefully", "recharges alone before showing up fully");

  const currentSummary = `${input.name} in ${input.country} is standing at the fork between comfort and the goal: ${input.mainGoal}. This version ${disciplineMood}, ${riskMood}, and still thinks about "${input.regret}" when choosing what matters next.`;

  return [
    {
      id: "current-you",
      title: "Current Life",
      summary: currentSummary,
      archetype: "current",
      accent: "from-cyan-400 to-violet-500",
      glow: "shadow-cyan-400/30",
      shortStory: currentSummary,
      personalityTraits: ["self-aware", "adaptive", "quietly ambitious", socialMood],
      careerDirection: `A realistic path toward ${input.mainGoal}, built from current strengths instead of fantasy shortcuts.`,
      moneySituation: input.discipline >= 6 ? "Stable but ready for a sharper plan." : "Uneven, with clear upside once habits become automatic.",
      socialLife: input.social >= 6 ? "Connected and responsive, though boundaries decide the quality." : "Selective, low-noise, and strongest with people who respect focus.",
      mentalState: "Curious, slightly restless, and ready for a visible win.",
      biggestAchievement: `Finally naming the life you actually want: ${input.mainGoal}.`,
      biggestWeakness: "Overthinking the first move while waiting for perfect certainty.",
      quote: "I do not need a new universe. I need a cleaner next move.",
      timeline: [
        milestone(years[0], "The fork becomes visible", `${input.name} turns ${input.mainGoal} into something concrete instead of keeping it as a cloud of possibility.`, "mindset", 56 + input.discipline, "restless but awake", "+ small budgeting clarity", "+ honest conversations begin", "+ notices energy patterns", "+ ideas start collecting"),
        milestone(years[1], "A recurring drain gets cut", `The regret around "${input.regret}" becomes a warning signal, not a life sentence.`, "health", 60 + input.discipline * 2, "lighter and less reactive", "+ fewer impulse leaks", "+ fewer performative commitments", "+ better recovery rhythm", "+ more room to think"),
        milestone(years[2], "Proof replaces theory", `A visible milestone proves this path can actually move toward ${input.mainGoal}.`, "career", 62 + input.discipline * 3, "cautiously proud", "+ income path clarifies", "+ respected for consistency", "+ stress becomes more manageable", "+ practical creativity rises"),
        milestone(years[3], "The identity settles", "People start describing this version by what they repeatedly do, not what they occasionally promise.", "mindset", 66 + input.social * 2, "steady and less noisy", "+ predictable baseline", "+ stronger boundaries", "+ fewer crashes", "+ cleaner focus"),
        milestone(years[4], "Fewer open loops", "The current life does not become perfect. It becomes chosen, which is much more useful.", "love", 70 + input.discipline + input.social, "quietly satisfied", "+ stable savings habits", "+ deeper trusted circle", "+ sustainable pace", "+ creative confidence")
      ],
      scores: {
        happiness: clamp(48 + input.discipline * 3 + input.social * 2),
        money: clamp(42 + input.discipline * 4 + input.risk),
        health: clamp(45 + input.discipline * 4),
        relationships: clamp(38 + input.social * 5),
        creativity: clamp(40 + input.creativity * 5)
      }
    },
    {
      id: "disciplined-you",
      title: "Disciplined Life",
      summary: `${input.name} treats ${input.mainGoal} like a daily appointment with destiny. The regret about "${input.regret}" turns into fuel, not shame.`,
      archetype: "disciplined",
      accent: "from-emerald-300 to-cyan-400",
      glow: "shadow-emerald-300/30",
      shortStory: `${input.name} becomes the version who treats ${input.mainGoal} like a daily appointment with destiny. The regret about "${input.regret}" turns into fuel, not shame.`,
      personalityTraits: ["structured", "patient", "hard to distract", "calm under pressure"],
      careerDirection: `Deep specialist or focused operator, steadily compounding toward ${input.mainGoal}.`,
      moneySituation: "Predictable growth, fewer impulsive leaks, and a serious emergency fund.",
      socialLife: "Smaller but healthier. People trust this version to show up when it counts.",
      mentalState: "Grounded, proud, occasionally too rigid.",
      biggestAchievement: "Turns a boring routine into an unfair advantage.",
      biggestWeakness: "Can confuse rest with weakness and spontaneity with danger.",
      quote: "The future stopped being a wish when I put it on the calendar.",
      timeline: [
        milestone(years[0], "The calendar takes command", "This life begins with small systems: sleep, money, work blocks, and one daily action that cannot be negotiated.", "mindset", 68 + input.discipline * 2, "locked in", "+ spending gets named", "+ less flaky, more trusted", "+ energy stabilizes", "+ output becomes repeatable"),
        milestone(years[1], "The old habit loses power", "A behavior that used to steal momentum becomes boring enough to quit.", "health", 72 + input.discipline * 2, "clean and slightly intense", "+ savings rate climbs", "+ fewer chaotic apologies", "+ body feels more reliable", "+ fewer scattered starts"),
        milestone(years[2], "The serious milestone ships", `${input.mainGoal} moves from plan to public proof.`, "career", 74 + input.discipline * 2, "proud but demanding", "+ reliable income growth", "+ respected by peers", "+ routines protect health", "+ creative taste becomes disciplined"),
        milestone(years[3], "Mastery has a reputation", "This version becomes known for finishing what other people only announce.", "career", 78 + input.discipline * 2, "calmly formidable", "+ higher leverage offers", "+ smaller, loyal circle", "+ rest must be scheduled", "+ high-quality repetition"),
        milestone(years[4], "The compound effect arrives", "Five years of repetition quietly bends the timeline.", "money", 82 + input.discipline, "secure and watchful", "+ strong financial base", "+ dependable relationships", "+ excellent baseline", "+ may need more play")
      ],
      scores: {
        happiness: clamp(54 + input.discipline * 4 - Math.max(0, 5 - input.social)),
        money: clamp(52 + input.discipline * 5),
        health: clamp(58 + input.discipline * 4),
        relationships: clamp(42 + input.social * 3),
        creativity: clamp(34 + input.creativity * 3)
      }
    },
    {
      id: "risk-taking-you",
      title: "Risk-Taking Life",
      summary: `${input.name} pitches the idea, books the flight, sends the message, and starts before feeling ready.`,
      archetype: "risk",
      accent: "from-rose-400 to-orange-300",
      glow: "shadow-rose-400/30",
      shortStory: `${input.name} chooses the bolder timeline: pitches the idea, books the flight, sends the message, starts before feeling ready. The life in ${input.country} gets louder, faster, and more cinematic.`,
      personalityTraits: ["bold", "fast-learning", "magnetic", "occasionally reckless"],
      careerDirection: `Founder, creator, investor, or high-upside builder chasing ${input.mainGoal} at full speed.`,
      moneySituation: "Volatile early, potentially excellent later if risk gets paired with discipline.",
      socialLife: "Expands quickly through chance meetings, big rooms, and unexpected allies.",
      mentalState: "Alive and intense, with occasional anxiety spikes.",
      biggestAchievement: "Takes the decision everyone else only talked about.",
      biggestWeakness: "May mistake motion for progress.",
      quote: "I would rather have a scar from trying than a museum of maybes.",
      timeline: [
        milestone(years[0], "The public bet", `${input.name} makes a visible move toward ${input.mainGoal}, before certainty has time to sedate the idea.`, "career", 62 + input.risk * 3, "electric and exposed", "- unstable short-term cash", "+ new attention", "- adrenaline tax", "+ bold experiments"),
        milestone(years[1], "The messy lesson", "Something breaks, but it breaks loudly enough to teach the correct lesson.", "money", 58 + input.risk * 3, "bruised but sharper", "- expensive mistake, better instincts", "+ filters weak ties", "- recovery required", "+ sharper taste"),
        milestone(years[2], "The strange ally appears", "A person, market, or audience changes the odds because this life was moving where luck could see it.", "love", 72 + input.social * 2 + input.risk, "surprised and hungry", "+ upside opens", "+ magnetic new circle", "+ stress remains high", "+ wider references"),
        milestone(years[3], "Chaos becomes a playbook", "The risk does not disappear. It gets named, measured, and used.", "mindset", 74 + input.discipline + input.risk, "dangerously competent", "+ better bets", "+ respect from other risk-takers", "+ learns recovery", "+ fast iteration"),
        milestone(years[4], "The story people repeat", "The timeline is less stable than others, but it has a plot nobody forgets.", "career", 78 + input.risk * 2, "alive and a little haunted", "+ major upside possible", "+ big network", "- burnout risk", "+ original voice")
      ],
      scores: {
        happiness: clamp(48 + input.risk * 5 + input.social * 2 - Math.max(0, 6 - input.discipline) * 2),
        money: clamp(38 + input.risk * 6 + input.discipline * 2),
        health: clamp(42 + input.discipline * 3 - Math.max(0, input.risk - 7) * 2),
        relationships: clamp(40 + input.social * 5),
        creativity: clamp(45 + input.creativity * 4 + input.risk)
      }
    },
    {
      id: "creative-you",
      title: "Creative Life",
      summary: `${input.name} turns the what-if into material and makes ${input.mainGoal} feel expressive instead of obligatory.`,
      archetype: "creative",
      accent: "from-fuchsia-400 to-indigo-400",
      glow: "shadow-fuchsia-400/30",
      shortStory: `${input.name} turns the "what if" into material. This timeline makes art from the regret, experiments with identity, and finds a way to make ${input.mainGoal} feel expressive instead of obligatory.`,
      personalityTraits: ["imaginative", "sensitive", "inventive", "allergic to stale routines"],
      careerDirection: `Designer, writer, strategist, maker, or independent brand around ${input.mainGoal}.`,
      moneySituation: "Project-based at first, then stronger when creative taste becomes a recognizable asset.",
      socialLife: "Full of collaborators, late-night conversations, and a few dramatic exits.",
      mentalState: "Inspired, emotionally rich, and sometimes scattered.",
      biggestAchievement: "Builds something only this version could have made.",
      biggestWeakness: "Can keep polishing instead of publishing.",
      quote: "The alternate life was not hidden. It was waiting for me to make it visible.",
      timeline: [
        milestone(years[0], "The visible practice begins", `${input.name} starts publishing the ideas that used to stay private.`, "creativity", 62 + input.creativity * 3, "nervous and lit up", "+ uncertain income", "+ attracts curious people", "+ mood improves through expression", "+ daily creative signal"),
        milestone(years[1], "The regret becomes material", `"${input.regret}" gets transformed into work instead of remaining a private ache.`, "mindset", 66 + input.creativity * 3, "tender but powerful", "+ small paid work", "+ deeper conversations", "+ emotional relief", "+ signature themes emerge"),
        milestone(years[2], "A scene finds the signal", "A community, audience, or collaborator recognizes the emotional frequency of this path.", "love", 70 + input.social * 2 + input.creativity, "seen and slightly overwhelmed", "+ project income grows", "+ richer network", "+ social fatigue possible", "+ collaboration expands"),
        milestone(years[3], "Taste turns into leverage", "What used to look like weird preference becomes a recognizable asset.", "money", 72 + input.creativity * 2, "confident and experimental", "+ better creative fees", "+ selective alliances", "+ needs routine support", "+ stronger body of work"),
        milestone(years[4], "The body of work speaks", "Five years later, this timeline has emotional gravity and a visible archive.", "creativity", 82 + input.creativity, "proud, softened, alive", "+ diversified income", "+ people know the real voice", "+ healthier expression", "+ original legacy")
      ],
      scores: {
        happiness: clamp(50 + input.creativity * 5 + input.social),
        money: clamp(34 + input.creativity * 4 + input.discipline * 2),
        health: clamp(40 + input.discipline * 3),
        relationships: clamp(42 + input.social * 4 + input.creativity),
        creativity: clamp(62 + input.creativity * 5)
      }
    },
    {
      id: "lucky-you",
      title: "Lucky Life",
      summary: `${input.name} keeps saying yes to tiny openings until coincidence starts looking suspiciously like strategy.`,
      archetype: "lucky",
      accent: "from-amber-300 to-lime-300",
      glow: "shadow-amber-300/30",
      shortStory: `${input.name} keeps saying yes to tiny openings, and coincidence starts looking suspiciously like strategy. In this version, ${input.country} becomes the launchpad for a fortunate chain reaction.`,
      personalityTraits: ["open", "optimistic", "socially alert", "quick to notice openings"],
      careerDirection: `A surprising hybrid path where ${input.mainGoal} meets the right person at the right time.`,
      moneySituation: "Improves through timing, referrals, and one unexpectedly valuable opportunity.",
      socialLife: "Warm and serendipitous. Luck arrives disguised as people.",
      mentalState: "Light, grateful, and occasionally too dependent on momentum.",
      biggestAchievement: "Recognizes the door while it is still open.",
      biggestWeakness: "Can wait for magic instead of building leverage.",
      quote: "Luck found me moving.",
      timeline: [
        milestone(years[0], "The invitation", `${input.name} says yes to a small thing that a more guarded timeline would ignore.`, "love", 60 + input.social * 3, "open and curious", "+ no immediate gain", "+ new warm contact", "+ mood lifts", "+ fresh input"),
        milestone(years[1], "The right introduction", "Someone connects this life to an opportunity that fits the goal too neatly to dismiss.", "career", 66 + input.social * 2 + input.risk, "delighted and alert", "+ referral value", "+ network expands", "+ energized", "+ new possibilities"),
        milestone(years[2], "The fortunate chain reaction", `A coincidence accelerates ${input.mainGoal}, mostly because this version stayed visible.`, "money", 72 + input.risk * 2 + input.social, "astonished but ready", "+ income jump possible", "+ allies gather", "+ must stay grounded", "+ playful experimentation"),
        milestone(years[3], "Luck needs structure", "The gift gets protected with better systems, contracts, and boundaries.", "mindset", 74 + input.discipline * 2, "grateful and serious", "+ protects upside", "+ clearer expectations", "+ steadier rhythm", "+ less random output"),
        milestone(years[4], "Prepared luck", "From the outside it looks like magic. Up close, it looks like openness plus preparation.", "career", 80 + input.social + input.discipline, "fortunate and responsible", "+ strong opportunity base", "+ generous relationships", "+ balanced optimism", "+ flexible creativity")
      ],
      scores: {
        happiness: clamp(56 + input.social * 4 + input.risk * 2),
        money: clamp(44 + input.social * 3 + input.risk * 3 + input.discipline),
        health: clamp(44 + input.discipline * 3 + input.social),
        relationships: clamp(54 + input.social * 5),
        creativity: clamp(42 + input.creativity * 3 + input.risk)
      }
    }
  ];
}

export function mergeParallelLives(first: ParallelVersion, second: ParallelVersion): ParallelVersion {
  const mergedTimeline = first.timeline.map((item, index) => {
    const other = second.timeline[index] ?? item;
    return milestone(
      item.year,
      `Merged: ${item.title}`,
      `${item.description} It also borrows from ${second.title}: ${other.description}`,
      item.impactScore >= other.impactScore ? item.category : other.category,
      (item.impactScore + other.impactScore) / 2 + 5,
      `${item.emotionalState} + ${other.emotionalState}`,
      `${item.moneyChange}; ${other.moneyChange}`,
      `${item.relationshipChange}; ${other.relationshipChange}`,
      `${item.healthChange}; ${other.healthChange}`,
      `${item.creativityChange}; ${other.creativityChange}`
    );
  });

  return {
    id: `merged-${first.id}-${second.id}`,
    title: `${first.title.split(" ")[0]} x ${second.title}`,
    summary: `This merged timeline borrows the strongest instincts from ${first.title} and ${second.title}. It keeps the ambition without copying either life completely.`,
    archetype: "merged",
    accent: "from-cyan-300 via-fuchsia-400 to-amber-300",
    glow: "shadow-cyan-300/30",
    shortStory: `This merged timeline borrows the strongest instincts from ${first.title} and ${second.title}. It keeps the ambition without copying either life completely.`,
    personalityTraits: Array.from(new Set([...first.personalityTraits.slice(0, 2), ...second.personalityTraits.slice(0, 2), "integrated"])),
    careerDirection: `${first.careerDirection} Then it borrows momentum from ${second.title.toLowerCase()}.`,
    moneySituation: `Balanced path: ${first.moneySituation} ${second.moneySituation}`,
    socialLife: `A hybrid social rhythm: ${first.socialLife}`,
    mentalState: "Focused, emotionally awake, and less trapped by one identity.",
    biggestAchievement: `Combines ${first.biggestAchievement.toLowerCase()} with ${second.biggestAchievement.toLowerCase()}.`,
    biggestWeakness: "Trying to optimize every possible self instead of choosing today's action.",
    quote: "I can borrow from every timeline, but I still have to live this one.",
    timeline: mergedTimeline,
    scores: {
      happiness: clamp((first.scores.happiness + second.scores.happiness) / 2 + 4),
      money: clamp((first.scores.money + second.scores.money) / 2 + 4),
      health: clamp((first.scores.health + second.scores.health) / 2 + 3),
      relationships: clamp((first.scores.relationships + second.scores.relationships) / 2 + 3),
      creativity: clamp((first.scores.creativity + second.scores.creativity) / 2 + 4)
    }
  };
}
