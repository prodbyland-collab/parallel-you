import { getActiveButterflies } from "@/lib/butterfly-engine";
import type { StoryRunState } from "@/lib/story-types";

export type CallbackMoment = {
  type:
    | "object_returns"
    | "message_returns"
    | "person_returns"
    | "unfinished_work_returns"
    | "missed_chance_returns"
    | "repeated_phrase_returns"
    | "place_returns";
  line: string;
  butterflyId: string;
};

export function generateCallbacks(state: StoryRunState): CallbackMoment[] {
  const callbacks: CallbackMoment[] = [];

  for (const effect of getActiveButterflies(state)) {
    if (state.sceneHistory.length - effect.createdAtChoiceIndex < 2) continue;

    switch (effect.theme) {
      case "avoidance":
        callbacks.push({
          type: "message_returns",
          line: "The message is still there. Now it feels older.",
          butterflyId: effect.id
        });
        break;
      case "perfectionism":
        callbacks.push({
          type: "unfinished_work_returns",
          line: "Another file. Another clean beginning. Nothing finished.",
          butterflyId: effect.id
        });
        break;
      case "connection":
        callbacks.push({
          type: "person_returns",
          line: "They remember what you said. You forgot how rare that was.",
          butterflyId: effect.id
        });
        break;
      case "risk":
        callbacks.push({
          type: "object_returns",
          line: "Someone replied to the thing you almost didn't send.",
          butterflyId: effect.id
        });
        break;
      case "consistency":
        callbacks.push({
          type: "object_returns",
          line: "The small work kept existing after the mood left.",
          butterflyId: effect.id
        });
        break;
      case "isolation":
        callbacks.push({
          type: "place_returns",
          line: "The room got quieter. Not calmer. Just quieter.",
          butterflyId: effect.id
        });
        break;
      case "returning":
        callbacks.push({
          type: "object_returns",
          line: "The unfinished thing waited without judging you.",
          butterflyId: effect.id
        });
        break;
      default:
        callbacks.push({
          type: "repeated_phrase_returns",
          line: effect.delayedEffect,
          butterflyId: effect.id
        });
    }
  }

  return callbacks.slice(0, 3);
}
