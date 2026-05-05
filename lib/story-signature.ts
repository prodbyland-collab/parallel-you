import type { StoryRunState } from "@/lib/story-types";

export function createStorySignature(state: StoryRunState) {
  const profile = state.profile.parsedProfile;
  const parts = [
    state.profile.name.toLowerCase().trim(),
    state.profile.age,
    state.profile.country.toLowerCase().trim(),
    profile?.goalCategory ?? "general",
    profile?.emotionalTone ?? "hopeful",
    profile?.keyThemes.join("|") ?? "",
    state.choices.map((choice) => choice.choiceId).join(">"),
    state.flags.slice().sort().join("|"),
    state.memories.map((memory) => memory.id).join("|"),
    state.chaosEvents.map((event) => event.id).join("|"),
    state.wildcardsUsed.map((event) => event.id).join("|"),
    state.seed % 97
  ];
  return parts.join("::");
}

export function areSignaturesSimilar(a: string, b: string) {
  const left = new Set(a.split("::").flatMap((part) => part.split(/[>|]/)).filter(Boolean));
  const right = new Set(b.split("::").flatMap((part) => part.split(/[>|]/)).filter(Boolean));
  if (!left.size || !right.size) return false;
  const shared = Array.from(left).filter((part) => right.has(part)).length;
  return shared / Math.max(left.size, right.size) > 0.72;
}
