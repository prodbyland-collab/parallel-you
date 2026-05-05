const weakPhrases = [
  "believe in yourself",
  "follow your dreams",
  "this is your moment",
  "take control of your destiny",
  "every decision shapes your destiny",
  "unlock your potential",
  "achieve greatness"
];

export function cleanAIText(text: string) {
  return text
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUnsafeOrCringe(text: string) {
  const lower = text.toLowerCase();
  return weakPhrases.some((phrase) => lower.includes(phrase)) || text.length > 360;
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
  const cleaned = lines.map(cleanAIText).filter((line) => line && !isUnsafeOrCringe(line)).slice(0, 3);
  return cleaned.length ? cleaned : fallback;
}

function tokenize(text: string) {
  return cleanAIText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}
