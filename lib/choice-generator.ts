import { seededRandom } from "@/lib/random-engine";
import type { StoryChoice, StoryRunState, StoryScene } from "@/lib/story-types";

const groundedAlternates: Record<string, string[]> = {
  "one-hour": ["Open it and fix one small part", "Set a timer and begin badly", "Do the first tiny step"],
  rest: ["Close it and try tomorrow", "Go to sleep before making it worse", "Rest, but leave it open for morning"],
  message: ["Text someone: I need a push", "Send the uncomfortable honest message", "Ask one person to check on you"],
  routine: ["Do it before your phone gets you", "Keep the small habit boring", "Repeat the one thing that worked"],
  "big-plan": ["Make a plan instead of starting", "Rewrite the plan again", "Organize everything except the work"],
  scroll: ["Check your phone and lose time", "Scroll until the guilt comes back", "Say five minutes and disappear"],
  share: ["Send it anyway", "Post it before deleting it", "Let people see the rough version"],
  "keep-private": ["Save it in drafts again", "Hide it and keep editing", "Keep it to yourself one more night"],
  "ask-feedback": ["Ask one honest person", "Send it to the person who will not lie", "Ask for one specific note"],
  "break-loop": ["Do one useful thing before bed", "Break the loop with a tiny task", "Start again without announcing it"],
  "stay-loop": ["Say tomorrow again", "Avoid it and let the week pass", "Do nothing and feel it later"],
  "small-help": ["Ask someone to check in tomorrow", "Let one person know you are stuck", "Ask for a small push"],
  "say-yes": ["Say yes before fear edits the reply", "Take the chance while nervous", "Reply yes and breathe after"],
  wait: ["Ask for more time", "Delay until you feel ready", "Prepare instead of answering yet"],
  "bring-friend": ["Send the screenshot to a friend", "Ask someone what they honestly think", "Talk it out before replying"],
  return: ["Restart smaller", "Come back with less pressure", "Pick up the part you dropped"],
  quit: ["Stop for now", "Tell yourself it is not for you", "Leave it alone and call it peace"],
  "risk-reset": ["Change the plan completely", "Try the version that scares you", "Delete the old plan and move"],
  "own-it": ["Keep showing up while people watch", "Post again even if it feels weird", "Stay visible for one more day"],
  hide: ["Go quiet", "Pull back from attention", "Stop posting for a while"],
  learn: ["Improve one specific thing", "Use the feedback instead of spiraling", "Make the next version cleaner"],
  "make-time": ["Put the work down and show up", "See them tonight", "Choose the person for one evening"],
  "lock-in": ["Ignore the message and keep working", "Choose the work tonight", "Keep going and let the distance grow"],
  explain: ["Tell the truth before it gets worse", "Reply honestly", "Say what has been happening"],
  repair: ["Cancel one thing and recover", "Sleep before deciding anything", "Make the week smaller"],
  force: ["Push through with coffee", "Keep going even though you are tired", "Force it and pay later"],
  vanish: ["Stop replying for a while", "Disappear until it feels easier", "Go silent"],
  "step-through": ["Say yes and figure it out", "Take the chance scared", "Walk in before you feel ready"],
  "prepare-first": ["Ask clear questions first", "Prepare properly before saying yes", "Slow down and answer carefully"],
  "miss-it": ["Leave the message unanswered", "Avoid the chance", "Let it pass and pretend it is fine"],
  "come-back": ["Fix one mistake and try again", "Look at what failed and repair it", "Try again without the speech"],
  "blame-world": ["Blame the situation", "Avoid looking at your part", "Stay angry a little longer"],
  "ask-mentor": ["Ask someone better", "Ask for boring practical advice", "Let someone experienced see the mess"],
  "build-system": ["Write down what worked", "Turn it into a weekly routine", "Make the win repeatable"],
  "chase-high": ["Try to force another win", "Chase the feeling", "Push too hard after the first proof"],
  "share-credit": ["Call someone and say it worked", "Let someone celebrate with you", "Share the small win"],
  "choose-known": ["Choose stability", "Take the slower safer path", "Keep the life that lets you breathe"],
  "choose-next": ["Take the bigger risk", "Choose the thing you might regret avoiding", "Step toward the larger version"],
  "choose-balanced": ["Grow without burning out", "Choose progress you can live with", "Protect peace and keep moving"],
  "call-someone": ["Call the person who stayed", "Let someone hear the good news", "Do not carry it alone"],
  "stand-alone": ["Keep the win private", "Sit with it alone", "Do not tell anyone yet"],
  "thank-them": ["Send the thank-you now", "Tell them they mattered", "Thank the person before the moment passes"],
  forgive: ["Stop punishing yourself for starting late", "Let the old delay be human", "Forgive the slow beginning"],
  "keep-hunger": ["Keep improving, but speak kindly", "Want more without hurting yourself", "Stay hungry, not cruel"],
  "begin-again": ["Pick one small thing for tomorrow", "Begin again quietly", "Leave one simple task for morning"]
};

export function generateSceneChoices(scene: StoryScene, state: StoryRunState): StoryChoice[] {
  if (scene.noChoiceMoment) {
    return [{ id: `auto-${scene.id}`, text: "Continue", effect: {}, auto: true }];
  }

  const usedTexts = new Set(state.choices.map((choice) => choice.choiceText));
  const random = seededRandom(state.seed + state.choices.length * 71 + scene.id.length * 19 + state.replayCount * 211);

  return scene.choices.map((choice) => {
    const alternates = groundedAlternates[choice.id] ?? [];
    const pool = [choice.text, ...alternates].filter((text) => !usedTexts.has(text));
    const text = pool.length ? pool[Math.floor(random() * pool.length)] : `${choice.text}, this time`;
    usedTexts.add(text);
    return { ...choice, text };
  });
}
