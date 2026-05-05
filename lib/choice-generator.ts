import { seededRandom } from "@/lib/random-engine";
import type { GoalCategory, PlayerProfile, StoryChoice, StoryRunState, StoryScene } from "@/lib/story-types";

const categoryChoiceText: Record<GoalCategory, Partial<Record<string, string[]>>> = {
  music: {
    open_project: ["Open the project file you keep avoiding"],
    fix_small_part: ["Fix the part of the track that keeps bothering you"],
    send_unfinished: ["Send the rough beat to one person"],
    send_unfinished_again: ["Send the rough beat before you change your mind"],
    start_over_again: ["Start another loop instead of finishing this one"],
    finish_badly: ["Export it before you change your mind"],
    share_final_piece: ["Send the version that exists"],
    make_next_thing: ["Make one new section while the feeling is still there"]
  },
  business: {
    open_project: ["Open the page you keep avoiding"],
    fix_small_part: ["Fix one broken page"],
    send_unfinished: ["Show someone the ugly version"],
    send_unfinished_again: ["Send the client message before overthinking"],
    start_over_again: ["Start a cleaner plan instead of launching this one"],
    finish_badly: ["Publish the rough version"],
    share_final_piece: ["Send the offer to one real person"],
    make_next_thing: ["Fix the next thing a user would notice"]
  },
  fitness: {
    open_project: ["Put your shoes on before you negotiate with yourself"],
    fix_small_part: ["Do the ugly 20-minute workout"],
    send_unfinished: ["Tell one friend you are trying"],
    send_unfinished_again: ["Send the check-in before you hide"],
    start_over_again: ["Change the plan again instead of training"],
    finish_badly: ["Finish the short workout, even messy"],
    share_final_piece: ["Tell someone you showed up today"],
    make_next_thing: ["Cook something simple and call it a win"]
  },
  writing: {
    open_project: ["Open the draft you keep avoiding"],
    fix_small_part: ["Write one bad page"],
    send_unfinished: ["Send the unfinished draft"],
    send_unfinished_again: ["Send the draft before you protect it again"],
    start_over_again: ["Start another chapter instead"],
    finish_badly: ["End the scene badly and move on"],
    share_final_piece: ["Show the draft that exists"],
    make_next_thing: ["Delete the sentence you keep protecting"]
  },
  career: {},
  school: {},
  relationship: {},
  personal: {},
  general: {}
};

const genericChoiceText: Record<string, string[]> = {
  open_project: ["Open the thing you keep avoiding"],
  do_nothing: ["Do nothing"],
  message_someone: ["Text one person before you overthink it"],
  fix_small_part: ["Fix one small part"],
  start_over_again: ["Start over again"],
  close_try_tomorrow: ["Close it and try tomorrow"],
  answer_message: ["Answer before it becomes a whole thing"],
  ignore_message: ["Put the phone face down"],
  send_unfinished: ["Send it anyway"],
  push_late: ["Stay for twenty more minutes"],
  sleep_instead: ["Sleep before you make it worse"],
  scroll_late: ["Check your phone and lose the night"],
  save_proof: ["Save it before you judge it"],
  hide_small_win: ["Pretend it does not count"],
  tell_one_person: ["Tell one person it finally moved"],
  lower_the_bar: ["Lower the bar and still do something"],
  skip_today: ["Skip today and promise tomorrow"],
  ask_for_help: ["Say you are having a bad day"],
  finish_badly: ["Finish it badly on purpose"],
  polish_forever: ["Fix one more thing, then another"],
  send_unfinished_again: ["Send it before it feels safe"],
  reply_to_notice: ["Reply like it matters"],
  act_cool: ["Act like you do not care"],
  make_next_thing: ["Use the feeling and make the next thing"],
  name_pattern: ["Admit this is the same pattern"],
  repeat_pattern: ["Do the same thing again"],
  start_smaller: ["Restart smaller than your ego wants"],
  automatic_small_choice: ["You choose one small thing anyway"],
  answer_pressure: ["Answer with the truth"],
  avoid_pressure: ["Leave it unread"],
  take_shortcut: ["Take the shortcut and deal with it later"],
  come_back_quietly: ["Come back without announcing it"],
  make_big_return: ["Make a big plan again"],
  ask_someone_back: ["Ask someone to sit with you while you restart"],
  walk_through: ["Walk through before you feel ready"],
  prepare_at_door: ["Take one day to prepare properly"],
  let_door_close: ["Let it close and pretend you chose peace"],
  accept_not_nothing: ["Let it be enough for tonight"],
  keep_punishing: ["Only see what is missing"],
  share_final_piece: ["Show the version that exists"],
  see_ending: ["See what stayed"]
};

const softAlternates = [
  "Try the least dramatic version",
  "Make it smaller until it feels possible",
  "Leave the room for water, then come back",
  "Do the part nobody will see",
  "Stop pretending you need a perfect mood",
  "Send one honest sentence",
  "Open it for five minutes",
  "Let tonight be ugly but real"
];

export function generateChoices(scene: StoryScene, profile: PlayerProfile, state: StoryRunState): StoryChoice[] {
  if (scene.noChoiceMoment) {
    return scene.choices.map((choice) => ({ ...choice, auto: true, text: pickText(choice.id, choice.text, profile, state) }));
  }

  const used = new Set([
    ...state.choices.map((choice) => normalize(choice.choiceText)),
    ...(state.recentChoiceTexts ?? []).map(normalize)
  ]);

  return scene.choices.slice(0, 3).map((choice, index) => {
    const preferred = pickText(choice.id, choice.text, profile, state, index);
    const text = used.has(normalize(preferred)) ? pickUnusedFallback(used, state, index) : preferred;
    used.add(normalize(text));
    return { ...choice, text };
  });
}

export const generateSceneChoices = (scene: StoryScene, state: StoryRunState) => generateChoices(scene, state.profile, state);

function pickText(choiceId: string, fallback: string, profile: PlayerProfile, state: StoryRunState, index = 0) {
  const category = profile.parsedProfile?.goalCategory ?? "general";
  const pool = categoryChoiceText[category]?.[choiceId] ?? genericChoiceText[choiceId] ?? [fallback];
  const random = seededRandom(state.seed + state.choices.length * 47 + choiceId.length * 13 + index);
  return pool[Math.floor(random() * pool.length)] ?? fallback;
}

function pickUnusedFallback(used: Set<string>, state: StoryRunState, index: number) {
  const random = seededRandom(state.seed + state.choices.length * 71 + index * 19);
  const shuffled = softAlternates
    .map((text) => ({ text, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.text);
  return shuffled.find((text) => !used.has(normalize(text))) ?? `Do one small real thing ${state.choices.length + index + 1}`;
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}
