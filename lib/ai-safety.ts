const weakPhrases = [
  "believe in yourself",
  "follow your dreams",
  "this is your moment",
  "take control of your destiny",
  "every decision shapes your destiny",
  "unlock your potential",
  "achieve greatness",
  "your journey",
  "journey toward",
  "future self",
  "version of yourself",
  "embrace",
  "transform",
  "level up",
  "chase your dreams",
  "step into",
  "realize the importance",
  "shape your future"
];

const abstractReplacements: Array<[RegExp, string]> = [
  [/\byour journey\b/gi, "the day"],
  [/\bthe journey\b/gi, "the day"],
  [/\byour future self\b/gi, "you later"],
  [/\bversion of yourself\b/gi, "you"],
  [/\bembrace\b/gi, "take"],
  [/\btransform\b/gi, "change"],
  [/\bpotential\b/gi, "work"],
  [/\bdestiny\b/gi, "life"]
];

export function cleanAIText(text: string) {
  const cleaned = text
    .replace(/[""]/g, "\"")
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return abstractReplacements.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), cleaned);
}

export function isUnsafeOrCringe(text: string) {
  const lower = text.toLowerCase();
  return weakPhrases.some((phrase) => lower.includes(phrase)) || text.length > 220 || countAbstractWords(lower) >= 4;
}

export function isTooSimilar(newText: string, previousTexts: string[]) {
  const normalized = tokenize(newText);
  if (!normalized.length) return false;
  return previousTexts.some((text) => {
    const previous = tokenize(text);
    if (!previous.length) return false;
    const previousSet = new Set(previous);
    const shared = normalized.filter((word) => previousSet.has(word)).length;
    return shared / Math.max(normalized.length, previous.length) > 0.72 || cleanAIText(text).toLowerCase() === cleanAIText(newText).toLowerCase();
  });
}

export function sanitizeLines(lines: string[], fallback: string[]) {
  const cleaned = lines.map(cleanAIText).map(tightenLine).filter((line) => line && !isUnsafeOrCringe(line)).slice(0, 3);
  return cleaned.length ? cleaned : fallback;
}

export function scoreHumanWriting(lines: string[]) {
  const text = lines.join(" ").toLowerCase();
  let score = 0;
  score += (text.match(/\b(phone|desk|file|message|cup|alarm|window|cursor|shoes|draft|tab|page|coffee|headphones|notebook)\b/g)?.length ?? 0) * 2;
  score += (text.match(/\b(open|close|send|read|delete|sit|stand|walk|sleep|reply|export|fix|miss)\b/g)?.length ?? 0);
  score -= countAbstractWords(text) * 2;
  score -= weakPhrases.filter((phrase) => text.includes(phrase)).length * 6;
  return score;
}

function tightenLine(line: string) {
  const words = line.split(/\s+/);
  if (words.length <= 18) return line;
  return `${words.slice(0, 18).join(" ")}.`;
}

function countAbstractWords(text: string) {
  return text.match(/\b(progress|success|future|journey|potential|dream|destiny|purpose|growth|mindset|greatness|transformation)\b/g)?.length ?? 0;
}

function tokenize(text: string) {
  return cleanAIText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}
