"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, RotateCcw, Sparkles } from "lucide-react";
import { CinematicStoryScene } from "@/components/story/CinematicStoryScene";
import { Letterbox } from "@/components/story/Letterbox";
import { clearStoryState, loadEnding, loadStoryState } from "@/lib/story-storage";
import type { EndingResult, StoryRunState } from "@/lib/story-types";

export default function EndingPage() {
  const router = useRouter();
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [state, setState] = useState<StoryRunState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedEnding = loadEnding();
    const savedState = loadStoryState();
    if (!savedEnding || !savedState) {
      router.replace("/start");
      return;
    }
    setEnding(savedEnding);
    setState(savedState);
  }, [router]);

  const replay = () => {
    clearStoryState();
    router.push("/start");
  };

  const share = async () => {
    if (!ending) return;
    await navigator.clipboard.writeText(`${ending.title}\n\n${ending.reflection}\n\n${ending.finalLine}`);
    setCopied(true);
  };

  if (!ending || !state) {
    return <main className="grid min-h-screen place-items-center bg-[#03040a] text-slate-200">Rolling credits...</main>;
  }

  const endingScene = {
    id: "ending",
    act: 3 as const,
    title: ending.title,
    year: 2031,
    narration: ending.finalLine,
    environment: ending.environment,
    mood: ending.mood,
    choices: []
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03040a]">
      <div className="absolute inset-0 h-screen">
        <CinematicStoryScene scene={endingScene} traits={state.traits} />
      </div>
      <div className="absolute inset-0 bg-black/45" />
      <Letterbox />

      <section className="relative z-30 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-24 sm:px-8">
        <p className="cinema-kicker">This was one version of your life</p>
        <h1 className="cinema-title mt-4 text-5xl font-black leading-[0.92] text-white md:text-7xl">{ending.title}</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{ending.identity}</span>
          <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-100">{ending.outcome}</span>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">Lost: {ending.tradeoff}</span>
        </div>

        <article className="mt-8 max-w-3xl whitespace-pre-line rounded-3xl border border-white/10 bg-black/50 p-5 text-lg leading-9 text-slate-100 shadow-glow backdrop-blur-xl">
          {ending.reflection}
          <span className="mt-6 block text-2xl font-black leading-tight text-white">{ending.finalLine}</span>
        </article>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <button onClick={replay} className="story-choice text-left"><RotateCcw size={18} /> <span className="ml-2 font-black">Replay</span></button>
          <Link href="/start" onClick={clearStoryState} className="story-choice text-left"><Sparkles size={18} /> <span className="ml-2 font-black">Different mindset</span></Link>
          <button onClick={share} className="story-choice text-left"><Copy size={18} /> <span className="ml-2 font-black">{copied ? "Copied" : "Share summary"}</span></button>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="cinema-kicker">Locked scenes from other cuts</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ending.hints.map((hint) => (
              <div key={hint} className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-slate-300">
                {hint}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
