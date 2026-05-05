import type { EmotionalTone, ExperienceLevel, GoalCategory, ParsedUserProfile, PlayerProfile } from "@/lib/story-types";

type ProfileInput = Pick<PlayerProfile, "doneSoFar" | "goals"> & Partial<Pick<PlayerProfile, "goal" | "whatIf">>;

const clamp = (value: number) => Math.max(1, Math.min(10, Math.round(value)));

const categoryPatterns: Array<{ category: GoalCategory; vocabulary: string[]; pattern: RegExp }> = [
  { category: "music", vocabulary: ["studio", "track", "sound", "release", "listeners"], pattern: /(music|beat|beats|producer|song|songs|album|track|artist|rap|sing|vocal|mix|sound|studio)/i },
  { category: "business", vocabulary: ["project", "launch", "clients", "growth", "product"], pattern: /(business|startup|client|clients|website|product|brand|shop|sales|agency|company|money|launch)/i },
  { category: "fitness", vocabulary: ["training", "routine", "body", "energy", "progress"], pattern: /(fitness|gym|train|training|body|health|weight|sport|running|workout|diet)/i },
  { category: "writing", vocabulary: ["draft", "page", "publish", "reader", "voice"], pattern: /(write|writing|book|script|film|design|art|photo|creative|draw|novel|story)/i },
  { category: "career", vocabulary: ["work", "role", "portfolio", "interview", "salary"], pattern: /(career|job|work|interview|promotion|salary|portfolio|remote|office)/i },
  { category: "school", vocabulary: ["study", "exam", "class", "notes", "semester"], pattern: /(school|study|exam|university|college|class|degree|student|course)/i },
  { category: "relationship", vocabulary: ["message", "conversation", "distance", "trust", "time"], pattern: /(relationship|friend|family|partner|love|dating|people|lonely|connection)/i }
];

export function parseUserProfile(input: ProfileInput): ParsedUserProfile {
  const text = `${input.doneSoFar ?? ""} ${input.goals ?? ""} ${input.goal ?? ""} ${input.whatIf ?? ""}`.toLowerCase();
  const categoryMatch = categoryPatterns.find((entry) => entry.pattern.test(text));
  const goalCategory = categoryMatch?.category ?? "general";
  const personalVocabulary = categoryMatch?.vocabulary ?? ["work", "step", "progress", "people", "future"];

  const disciplineSignals = scoreSignals(text, {
    positive: /(every day|daily|consistent|disciplined|routine|show up|working hard|practice|improving|focused|committed)/g,
    negative: /(lazy|inconsistent|procrastinat|quit|gave up|can't focus|cant focus|delay|stuck|scroll|waste time|tomorrow)/g
  });
  const riskSignals = scoreSignals(text, {
    positive: /(risk|brave|move|post|share|start|launch|try|change|new city|quit my job)/g,
    negative: /(scared|afraid|safe|overthink|fear|nervous|not ready|avoid|hide)/g
  });
  const confidenceSignals = scoreSignals(text, {
    positive: /(confident|ready|believe|proud|better|improving|good at|strong)/g,
    negative: /(doubt|lost|confused|behind|failure|failed|not enough|insecure|tired|burned out|burnt out)/g
  });

  const discipline = clamp(5 + disciplineSignals);
  const consistency = clamp(5 + disciplineSignals - (/(inconsistent|procrastinat|quit|gave up|tomorrow)/i.test(text) ? 2 : 0));
  const risk = clamp(5 + riskSignals);
  const creativity = clamp(5 + countMatches(text, /(music|write|design|art|creative|song|film|photo|ideas|producer|beats)/g) * 2);
  const social = clamp(5 + countMatches(text, /(friend|family|people|team|client|audience|listeners|support|partner)/g) - countMatches(text, /(alone|lonely|isolated|nobody|no one)/g));
  const confidence = clamp(5 + confidenceSignals);

  return {
    mainGoal: extractMainGoal(input.goals || input.goal || ""),
    goalCategory,
    experienceLevel: getExperienceLevel(text),
    emotionalTone: getEmotionalTone(text, consistency, confidence),
    discipline,
    consistency,
    risk,
    creativity,
    social,
    confidence,
    keyThemes: getThemes(text),
    possibleRegrets: getRegrets(text),
    personalVocabulary
  };
}

function scoreSignals(text: string, patterns: { positive: RegExp; negative: RegExp }) {
  return countMatches(text, patterns.positive) * 2 - countMatches(text, patterns.negative) * 2;
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

function extractMainGoal(goals: string) {
  const cleaned = goals.trim();
  if (!cleaned) return "build a life that feels real";
  return cleaned.length > 140 ? `${cleaned.slice(0, 137).trim()}...` : cleaned;
}

function getExperienceLevel(text: string): ExperienceLevel {
  if (/(years|clients|released|launched|paid|professional|already|portfolio|audience|followers)/i.test(text)) return "experienced";
  if (/(started|learning|sometimes|a little|made|built|posted|trained|practice)/i.test(text)) return "some experience";
  return "starting";
}

function getEmotionalTone(text: string, consistency: number, confidence: number): EmotionalTone {
  if (/(burned out|burnt out|exhausted|tired|drained)/i.test(text)) return "tired";
  if (/(stuck|lost|confused|behind)/i.test(text)) return "stuck";
  if (/(inconsistent|lazy|procrastinat|quit|gave up)/i.test(text)) return "frustrated but hopeful";
  if (confidence >= 8 && consistency >= 7) return "confident";
  if (confidence <= 4) return "uncertain";
  return "hopeful";
}

function getThemes(text: string) {
  const themes: string[] = [];
  if (/(inconsistent|procrastinat|lazy|tomorrow|delay)/i.test(text)) themes.push("inconsistency");
  if (/(money|client|job|salary|rent|expense)/i.test(text)) themes.push("money pressure");
  if (/(family|friend|partner|people|lonely|alone)/i.test(text)) themes.push("relationships");
  if (/(move|country|city|abroad|travel)/i.test(text)) themes.push("place");
  if (/(confidence|doubt|fear|scared|afraid|overthink)/i.test(text)) themes.push("self-doubt");
  if (/(health|body|sleep|tired|burned out|burnt out)/i.test(text)) themes.push("energy");
  return themes.length ? themes : ["starting again"];
}

function getRegrets(text: string) {
  const regrets: string[] = [];
  if (/(started earlier|start earlier|late|behind|wasted time)/i.test(text)) regrets.push("not starting earlier");
  if (/(quit|gave up|stopped)/i.test(text)) regrets.push("quitting when it got hard");
  if (/(didn't post|didnt post|hide|private|afraid)/i.test(text)) regrets.push("hiding the work");
  if (/(family|friend|partner|message|ignored)/i.test(text)) regrets.push("not showing up for people");
  return regrets;
}
