import type { StoryMemory } from "@/lib/story-memory";
import type { StoryChoice } from "@/lib/story-types";

const writingRules = `
Write like real life.
Short lines.
Human tone.
Plain words.
Specific objects.
Tiny actions.
Use contractions.
Write like a camera noticed something private.
Sound like a person, not an app.
No motivational quotes.
No fake deep sentences.
No "believe in yourself".
No "follow your dreams".
No "journey".
No "destiny".
No "unlock".
No "potential".
No "version of yourself".
No "your future self".
No "embrace".
No "transform".
No long paragraphs.
No explaining emotions.
Show through actions.
Avoid abstract words when an object would work.
Use the user's real goal naturally, not in every line.
If the user makes music, mention files, loops, export, notes, headphones, silence.
If the user builds a business, mention messages, pages, clients, invoices, calls, tabs.
If the user trains, mention shoes, shower, food, soreness, alarms, weather.
If the user writes, mention drafts, pages, cursor, notes, deleted sentences.
Never make the choice obviously heroic or obviously wrong.
When in doubt, write less.

Good:
"You open it... then close it again."
"You almost send it. Then you don't."
"Nobody noticed. You did."
"The file name is still bad."
"The message sits there with no reply."
"You say tomorrow, and somehow mean it."

Bad:
"You feel anxious about your future."
"This is your moment."
"Every decision shapes your destiny."
"You realize the importance of consistency."
"Your journey toward success begins."
`;

export function buildScenePrompt(memory: StoryMemory) {
  const profile = memory.profile.parsedProfile;
  return `
SYSTEM = director. AI = writer.
The app controls structure, acts, pacing, traits, flags, randomness, anti-repeat logic, and ending rules.
You only write this next scene.

${writingRules}

User:
- name: ${safe(memory.profile.name)}
- age: ${memory.profile.age}
- country: ${safe(memory.profile.country)}
- what life has been like: ${safe(memory.profile.doneSoFar)}
- goal: ${safe(memory.profile.goals || memory.profile.goal)}
- goal category: ${profile?.goalCategory ?? "general"}
- emotional tone: ${profile?.emotionalTone ?? "hopeful"}
- vocabulary to use naturally: ${(profile?.personalVocabulary ?? []).join(", ")}

Story position:
- act: ${memory.currentAct}
- scene index: ${memory.sceneIndex}
- purpose: ${memory.scenePurpose}
- hidden traits: ${JSON.stringify(memory.hiddenTraits)}
- flags: ${memory.flags.join(", ") || "none"}
- memory objects: ${memory.memoryObjects.map((item) => item.name).join(", ") || "none"}
- missed moments: ${memory.missedMoments.slice(-5).join(" | ") || "none"}
- emotional consequences: ${memory.emotionalConsequences.slice(-5).join(" | ") || "none"}
- wildcards used: ${memory.wildcardsUsed.map((item) => item.title).join(", ") || "none"}
- rare events: ${memory.rareEventsTriggered.map((item) => item.title).join(", ") || "none"}

Last choices made:
${memory.choiceHistory.map((choice) => `${choice.sceneTitle}: ${choice.choiceText}`).join("\n") || "none"}

Avoid repeating these exact choices:
${memory.recentChoices.join("\n") || "none"}

Avoid repeating these lines/titles:
${memory.previousGeneratedText.slice(-18).join("\n") || "none"}

Return ONLY valid JSON:
{
  "sceneTitle": "short title",
  "narrationLines": ["1 short line", "optional second short line", "optional third short line"],
  "firstPersonCutType": "screen|message|walk|still|late_night|phone|thinking|desk",
  "environment": "bedroom|studio|city|sunrise|void|spotlight",
  "mood": "hopeful|tired|tense|focused|lost|breakthrough",
  "choices": [
    {
      "text": "specific real action",
      "effect": { "discipline": 0, "consistency": 0, "risk": 0, "creativity": 0, "social": 0, "confidence": 0, "luck": 0 },
      "flags": ["stayed_consistent"],
      "consequenceHint": "short hint of what changes",
      "delayedCallbackPossible": true
    }
  ]
}

Rules:
- 1 to 3 narration lines.
- Each narration line under 12 words if possible.
- 2 to 3 choices.
- Choices must be specific to the user's goal.
- Include imperfect options.
- Sometimes include "Do nothing", but only if it fits.
- No repeated choice text.
- Do not say "goal", "dream", "success", "destiny", or "journey" unless the user wrote those words.
- Make this scene feel caused by the last choice.
`;
}

export function buildConsequencePrompt(choice: StoryChoice, memory: StoryMemory) {
  return `
Write a consequence for the choice: "${safe(choice.text)}"

${writingRules}

Context:
- goal: ${safe(memory.profile.goals || memory.profile.goal)}
- recent choices: ${memory.choiceHistory.map((item) => item.choiceText).join(" | ")}
- rejected choices this scene: ${memory.rejectedChoices.join(" | ") || "none"}
- flags: ${memory.flags.join(", ") || "none"}
- missed moments: ${memory.missedMoments.slice(-4).join(" | ") || "none"}
- memory objects: ${memory.memoryObjects.map((item) => item.name).join(", ") || "none"}

Return ONLY valid JSON:
{
  "consequenceLines": ["short line", "short line", "optional short line"],
  "updatedMood": "hopeful|tired|tense|focused|lost|breakthrough",
  "memoryCallback": "optional short callback",
  "delayedFlag": "optional valid flag"
}
`;
}

export function buildEndingPrompt(memory: StoryMemory) {
  return `
Write the ending for this DIRECT YOUR LIFE run.

${writingRules}

Base it on:
- profile: ${safe(memory.profile.doneSoFar)} / ${safe(memory.profile.goals || memory.profile.goal)}
- choice history: ${memory.choiceHistory.map((choice) => choice.choiceText).join(" -> ")}
- repeated patterns: ${memory.flags.join(", ") || "none"}
- missed opportunities: ${memory.missedMoments.join(" | ") || "none"}
- memory objects: ${memory.memoryObjects.map((item) => item.name).join(", ") || "none"}
- hidden traits: ${JSON.stringify(memory.hiddenTraits)}
- emotional consequences: ${memory.emotionalConsequences.join(" | ") || "none"}

Never repeat these ending titles:
${memory.previousEndingTitles.join("\n") || "none"}

Never repeat these final lines:
${memory.previousFinalLines.join("\n") || "none"}

Return ONLY valid JSON:
{
  "endingTitle": "short ending title",
  "identity": "The ...",
  "whatHappened": "plain specific outcome",
  "whatItCost": "plain specific tradeoff",
  "memoryCallback": "short callback to one object or missed moment",
  "finalLine": "one quiet final line",
  "finalSceneObject": "ordinary object"
}
`;
}

export function buildRewritePrompt(original: string, previousTexts: string[]) {
  return `
Rewrite this. It is too similar to previous scenes.
Keep the same meaning, but use different real-life details.
Keep it short and grounded.

Original:
${original}

Avoid:
${previousTexts.slice(-20).join("\n")}

Return ONLY valid JSON with the same schema as before.
`;
}

function safe(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").slice(0, 900);
}
