"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clapperboard, Play } from "lucide-react";
import Link from "next/link";
import { createInitialRun } from "@/lib/story-engine";
import { clearStoryState, saveStoryState } from "@/lib/story-storage";
import type { PlayerProfile } from "@/lib/story-types";

const initialProfile: PlayerProfile = {
  name: "",
  age: 25,
  country: "",
  goal: "",
  whatIf: "",
  discipline: 5,
  risk: 5,
  creativity: 5,
  social: 5
};

const questions = [
  { key: "name", label: "Name or nickname", placeholder: "Giorgi", type: "text" },
  { key: "age", label: "Age", placeholder: "25", type: "number" },
  { key: "country", label: "Country", placeholder: "Georgia", type: "text" },
  { key: "goal", label: "What do you want to work toward?", placeholder: "Make music, build a company, get healthier...", type: "textarea" },
  { key: "whatIf", label: "What question still follows you?", placeholder: "What if I had started earlier?", type: "textarea" }
] as const;

const sliders = [
  { key: "discipline", label: "How consistent are you right now?" },
  { key: "risk", label: "How comfortable are you with risk?" },
  { key: "creativity", label: "How creative do you feel lately?" },
  { key: "social", label: "How much do people energize you?" }
] as const;

export default function StartPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);

  const updateProfile = (key: keyof PlayerProfile, value: string | number) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const begin = () => {
    clearStoryState();
    const run = createInitialRun(profile);
    saveStoryState(run);
    router.push("/story");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03040a] px-5 py-6 sm:px-8">
      <div className="particle-field" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.16),transparent_28rem),radial-gradient(circle_at_80%_60%,rgba(217,70,239,0.12),transparent_25rem)]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="game-button"><ArrowLeft size={16} /> Back</Link>
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.24em] text-slate-100">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-void"><Clapperboard size={18} /></span>
            Story Setup
          </div>
        </nav>

        <section className="grid min-h-[calc(100vh-6rem)] items-center gap-8 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="cinema-kicker">Before we start</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.92] text-white md:text-7xl">Tell us a little about you.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Your answers shape the story. There are no grades or quiz results, just choices and a future that reacts to you.
            </p>
          </div>

          <div className="cinema-panel p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => (
                <label key={question.key} className={question.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 block text-sm font-bold text-slate-300">{question.label}</span>
                  {question.type === "textarea" ? (
                    <textarea value={String(profile[question.key])} onChange={(event) => updateProfile(question.key, event.target.value)} placeholder={question.placeholder} className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70" />
                  ) : (
                    <input value={String(profile[question.key])} onChange={(event) => updateProfile(question.key, question.type === "number" ? Number(event.target.value) : event.target.value)} placeholder={question.placeholder} type={question.type} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70" />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {sliders.map((slider) => (
                <label key={slider.key}>
                  <span className="mb-2 block text-sm font-bold text-slate-300">{slider.label}</span>
                  <input type="range" min="1" max="10" value={profile[slider.key]} onChange={(event) => updateProfile(slider.key, Number(event.target.value))} className="w-full accent-cyan-300" />
                </label>
              ))}
            </div>

            <button onClick={begin} className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-base font-black text-void transition hover:scale-[1.01] hover:bg-cyan-100">
              <Play size={18} fill="currentColor" /> Start the Story
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
