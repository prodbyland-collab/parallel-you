"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clapperboard, Play } from "lucide-react";
import Link from "next/link";
import { parseUserProfile } from "@/lib/profile-parser";
import { createInitialRun } from "@/lib/story-engine";
import { clearStoryState, saveStoryState } from "@/lib/story-storage";
import type { PlayerProfile, StoryPreferences } from "@/lib/story-types";

type IntroInput = {
  name: string;
  age: number;
  country: string;
  doneSoFar: string;
  goals: string;
  importantPeople: string[];
  behaviorPatterns: string[];
  likes: string[];
  dislikes: string[];
  pressureSources: string[];
  supportStyle: string[];
  storyVibe: string[];
};

const initialInput: IntroInput = {
  name: "",
  age: 25,
  country: "",
  doneSoFar: "",
  goals: "",
  importantPeople: [],
  behaviorPatterns: [],
  likes: [],
  dislikes: [],
  pressureSources: [],
  supportStyle: [],
  storyVibe: []
};

const selectGroups = {
  importantPeople: ["Friend", "Stranger", "Mentor", "Old connection", "Family", "No one right now"],
  behaviorPatterns: ["I overthink", "I start then stop", "I avoid messages", "I work late", "I compare myself", "I come back after quitting"],
  likes: ["Quiet rooms", "Night walks", "Coffee", "Music", "Clean desks", "Rain", "Small wins", "Honest people"],
  dislikes: ["Fake motivation", "Being rushed", "Loud advice", "Messy plans", "Feeling watched", "Waiting too long"],
  pressureSources: ["Money", "Family", "Time", "Social media", "No progress", "Someone expecting an answer"],
  supportStyle: ["Push me gently", "Tell me the truth", "Make it funny", "Leave me alone first", "Remind me later", "Give me one small step"],
  storyVibe: ["Grounded", "A little funny", "Quiet", "Emotional", "Tense", "Hopeful", "Lonely", "Warm"]
} satisfies Record<keyof StoryPreferences, string[]>;

const steps = [
  { key: "name", question: "What should we call you?", hint: "A name, nickname, or whatever feels like you.", placeholder: "Giorgi", type: "text" },
  { key: "age", question: "How old are you?", hint: "This helps place the story in your real life.", placeholder: "25", type: "number" },
  { key: "country", question: "Where are you right now?", hint: "Country, city, or the place this chapter starts.", placeholder: "Georgia", type: "text" },
  { key: "doneSoFar", question: "What has your life been like so far?", hint: "Write naturally. What have you tried, avoided, built, lost, repeated, or kept thinking about?", placeholder: "I make music but I am inconsistent. I have posted a few beats, but I keep stopping...", type: "textarea" },
  { key: "goals", question: "What do you want to become?", hint: "Say it plainly. The story will listen for the real goal underneath.", placeholder: "I want to become a successful producer and finally release music people care about.", type: "textarea" },
  { key: "importantPeople", question: "Who should life bring into the story?", hint: "Pick the kinds of people that feel real in your life.", type: "select" },
  { key: "behaviorPatterns", question: "What do you usually do when things get hard?", hint: "Choose the habits the story should notice.", type: "select" },
  { key: "likes", question: "What small details feel like you?", hint: "These become objects, rooms, and callbacks.", type: "select" },
  { key: "dislikes", question: "What should the story avoid?", hint: "This helps the writing feel less fake.", type: "select" },
  { key: "pressureSources", question: "What pressure follows you around?", hint: "Pick what makes choices harder.", type: "select" },
  { key: "supportStyle", question: "How should the story push you?", hint: "Not scores. Just the kind of voice that fits.", type: "select" },
  { key: "storyVibe", question: "What should the movie of your life feel like?", hint: "Pick a few tones.", type: "select" }
] as const;

export default function StartPage() {
  const router = useRouter();
  const [input, setInput] = useState<IntroInput>(initialInput);
  const [stepIndex, setStepIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const step = steps[stepIndex];
  const isFinalScreen = stepIndex === steps.length;
  const progressLabel = isFinalScreen ? "Ready" : `${stepIndex + 1} / ${steps.length}`;
  const canContinue = useMemo(() => {
    if (isFinalScreen) return true;
    const value = input[step.key as keyof IntroInput];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return value > 0;
    return value.trim().length > 0;
  }, [input, isFinalScreen, step]);

  const updateInput = (key: keyof IntroInput, value: string | number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const toggleOption = (key: keyof StoryPreferences, option: string) => {
    setInput((current) => {
      const selected = current[key];
      const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option].slice(0, 4);
      return { ...current, [key]: next };
    });
  };

  const next = () => {
    if (!canContinue) return;
    setStepIndex((current) => Math.min(current + 1, steps.length));
  };

  const previous = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const begin = () => {
    setIsStarting(true);
    clearStoryState();
    const storyPreferences: StoryPreferences = {
      importantPeople: input.importantPeople,
      behaviorPatterns: input.behaviorPatterns,
      likes: input.likes,
      dislikes: input.dislikes,
      pressureSources: input.pressureSources,
      supportStyle: input.supportStyle,
      storyVibe: input.storyVibe
    };
    const parsedProfile = parseUserProfile({ ...input, storyPreferences });
    const profile: PlayerProfile = {
      name: input.name,
      age: input.age,
      country: input.country,
      doneSoFar: input.doneSoFar,
      goals: input.goals,
      goal: parsedProfile.mainGoal,
      whatIf: parsedProfile.possibleRegrets[0] ?? input.doneSoFar,
      discipline: parsedProfile.discipline,
      consistency: parsedProfile.consistency,
      risk: parsedProfile.risk,
      creativity: parsedProfile.creativity,
      social: parsedProfile.social,
      confidence: parsedProfile.confidence,
      storyPreferences,
      parsedProfile
    };
    const run = createInitialRun(profile);
    saveStoryState(run);
    window.setTimeout(() => router.push("/story"), 700);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d] px-5 py-6 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(148,163,184,0.13),transparent_24rem),radial-gradient(circle_at_78%_62%,rgba(251,191,36,0.08),transparent_22rem)]" />
      <div className="ambient-dust" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <nav className="flex items-center justify-between">
          <Link href="/" className="game-button"><ArrowLeft size={16} /> Back</Link>
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.24em] text-slate-100">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-void"><Clapperboard size={18} /></span>
            Direct Your Life
          </div>
        </nav>

        <section className="grid flex-1 place-items-center py-12">
          <div className="w-full max-w-3xl">
            <div className="mb-8 flex items-center justify-between text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <span>Opening scene</span>
              <span>{progressLabel}</span>
            </div>

            <div className="intro-scene rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
              {!isFinalScreen ? (
                <div key={step.key} className="intro-step">
                  <p className="cinema-kicker">Before the story starts</p>
                  <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-6xl">{step.question}</h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{step.hint}</p>

                  <div className="mt-8">
                    {step.type === "textarea" ? (
                      <textarea value={String(input[step.key])} onChange={(event) => updateInput(step.key, event.target.value)} placeholder={step.placeholder} autoFocus className="min-h-52 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-lg leading-8 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30" />
                    ) : step.type === "select" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectGroups[step.key].map((option) => {
                          const selected = input[step.key].includes(option);
                          return (
                            <button key={option} onClick={() => toggleOption(step.key, option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold leading-6 transition ${selected ? "border-cyan-200 bg-cyan-200/15 text-white" : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/25"}`}>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input value={String(input[step.key])} onChange={(event) => updateInput(step.key, step.type === "number" ? Number(event.target.value) : event.target.value)} placeholder={step.placeholder} type={step.type} autoFocus className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-2xl font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-white/30" />
                    )}
                  </div>

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button onClick={previous} disabled={stepIndex === 0} className="game-button justify-center disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                    <button onClick={next} disabled={!canContinue} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-void transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45">
                      Continue <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="intro-step py-8 text-center">
                  <p className="cinema-kicker">Opening scene ready</p>
                  <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-tight text-white sm:text-6xl">Alright... let&apos;s see where your story goes.</h1>
                  <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">
                    Your words, habits, people, likes, dislikes, and pressure points will shape the scenes.
                  </p>
                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
                    <button onClick={previous} className="game-button justify-center">Previous</button>
                    <button onClick={begin} disabled={isStarting} className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-base font-black text-void transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60">
                      <Play size={18} fill="currentColor" /> {isStarting ? "Starting..." : "Start the Story"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
