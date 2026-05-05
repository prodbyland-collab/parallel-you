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

export type ParallelVersion = {
  id: string;
  title: string;
  archetype: "current" | "disciplined" | "risk" | "creative" | "lucky";
  accent: string;
  shortStory: string;
  personalityTraits: string[];
  careerDirection: string;
  moneySituation: string;
  socialLife: string;
  mentalState: string;
  biggestAchievement: string;
  biggestWeakness: string;
  quote: string;
  timeline: string[];
  scores: LifeScores;
};

const clamp = (value: number, min = 1, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const score10 = (value: number | undefined) => clamp(value ?? 5, 1, 10);

const toneFor = (value: number, high: string, mid: string, low: string) => {
  if (value >= 8) return high;
  if (value >= 5) return mid;
  return low;
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
  const disciplineMood = toneFor(input.discipline, "already trusts routines", "can build routines with the right stakes", "needs tiny rituals before big promises");
  const riskMood = toneFor(input.risk, "moves fast when the door opens", "tests the door before walking through", "protects stability before gambling");
  const socialMood = toneFor(input.social, "gets energy from rooms full of people", "keeps a tight circle and expands carefully", "recharges alone before showing up fully");

  return [
    {
      id: "current-you",
      title: "Current You",
      archetype: "current",
      accent: "from-cyan-400 to-violet-500",
      shortStory: `${input.name} in ${input.country} is standing at the fork between comfort and the goal: ${input.mainGoal}. This version ${disciplineMood}, ${riskMood}, and still thinks about "${input.regret}" when choosing what matters next.`,
      personalityTraits: ["self-aware", "adaptive", "quietly ambitious", socialMood],
      careerDirection: `A realistic path toward ${input.mainGoal}, built from current strengths instead of fantasy shortcuts.`,
      moneySituation: input.discipline >= 6 ? "Stable but ready for a sharper plan." : "Uneven, with clear upside once habits become automatic.",
      socialLife: input.social >= 6 ? "Connected and responsive, though boundaries decide the quality." : "Selective, low-noise, and strongest with people who respect focus.",
      mentalState: "Curious, slightly restless, and ready for a visible win.",
      biggestAchievement: `Finally naming the life you actually want: ${input.mainGoal}.`,
      biggestWeakness: "Overthinking the first move while waiting for perfect certainty.",
      quote: "I do not need a new universe. I need a cleaner next move.",
      timeline: [
        "Year 1: Turns the main goal into a weekly system.",
        "Year 2: Makes one decision that removes a recurring drain.",
        "Year 3: Builds proof that the new direction is real.",
        "Year 4: Becomes known for consistency in one chosen lane.",
        "Year 5: Lives with fewer open loops and more deliberate choices."
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
      title: "Disciplined You",
      archetype: "disciplined",
      accent: "from-emerald-300 to-cyan-400",
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
        "Year 1: Builds a morning and money system.",
        "Year 2: Cuts the habit that used to steal momentum.",
        "Year 3: Ships a major milestone tied to the main goal.",
        "Year 4: Mentors others through the same transformation.",
        "Year 5: Owns a stable life with fewer compromises."
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
      title: "Risk-Taking You",
      archetype: "risk",
      accent: "from-rose-400 to-orange-300",
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
        "Year 1: Makes one public bet on the main goal.",
        "Year 2: Recovers from a messy lesson and gets sharper.",
        "Year 3: Finds a partner, market, or audience that changes the odds.",
        "Year 4: Converts chaos into a repeatable playbook.",
        "Year 5: Has a story people ask about twice."
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
      title: "Creative You",
      archetype: "creative",
      accent: "from-fuchsia-400 to-indigo-400",
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
        "Year 1: Starts a visible creative practice.",
        "Year 2: Publishes work inspired by the biggest what-if.",
        "Year 3: Finds a community that understands the signal.",
        "Year 4: Turns taste into income.",
        "Year 5: Owns a body of work with emotional gravity."
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
      title: "Lucky You",
      archetype: "lucky",
      accent: "from-amber-300 to-lime-300",
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
        "Year 1: Says yes to an invitation that changes the map.",
        "Year 2: Meets someone who accelerates the main goal.",
        "Year 3: Turns a coincidence into a serious opportunity.",
        "Year 4: Learns to protect the win with better systems.",
        "Year 5: Looks lucky from the outside and prepared up close."
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
  return {
    id: `merged-${first.id}-${second.id}`,
    title: `${first.title.split(" ")[0]} x ${second.title}`,
    archetype: "current",
    accent: "from-cyan-300 via-fuchsia-400 to-amber-300",
    shortStory: `This merged timeline borrows the strongest instincts from ${first.title} and ${second.title}. It keeps the ambition without copying either life completely.`,
    personalityTraits: Array.from(new Set([...first.personalityTraits.slice(0, 2), ...second.personalityTraits.slice(0, 2), "integrated"])),
    careerDirection: `${first.careerDirection} Then it borrows momentum from ${second.title.toLowerCase()}.`,
    moneySituation: `Balanced path: ${first.moneySituation} ${second.moneySituation}`,
    socialLife: `A hybrid social rhythm: ${first.socialLife}`,
    mentalState: "Focused, emotionally awake, and less trapped by one identity.",
    biggestAchievement: `Combines ${first.biggestAchievement.toLowerCase()} with ${second.biggestAchievement.toLowerCase()}.`,
    biggestWeakness: "Trying to optimize every possible self instead of choosing today's action.",
    quote: "I can borrow from every timeline, but I still have to live this one.",
    timeline: first.timeline.map((item, index) => `${item.replace(".", "")}; adds ${second.timeline[index]?.toLowerCase().replace(/^year \d: /, "").replace(".", "")}.`),
    scores: {
      happiness: clamp((first.scores.happiness + second.scores.happiness) / 2 + 4),
      money: clamp((first.scores.money + second.scores.money) / 2 + 4),
      health: clamp((first.scores.health + second.scores.health) / 2 + 3),
      relationships: clamp((first.scores.relationships + second.scores.relationships) / 2 + 3),
      creativity: clamp((first.scores.creativity + second.scores.creativity) / 2 + 4)
    }
  };
}
