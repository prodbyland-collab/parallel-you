"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Film, RotateCcw, Sparkles, Trophy } from "lucide-react";
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
    await navigator.clipboard.writeText(`${ending.title}\n${ending.identity}\n"${ending.quote}"\nFound ${ending.discoveredCount}/${ending.totalMoments} moments`);
    setCopied(true);
  };

  if (!ending || !state) {
    return <main className="grid min-h-screen place-items-center bg-[#03040a] text-slate-200">Loading your ending...</main>;
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
        <p className="cinema-kicker">One possible version of your life</p>
        <h1 className="cinema-title mt-4 text-5xl font-black leading-[0.92] text-white md:text-7xl">{ending.title}</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{ending.identity}</span>
          <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-100">{ending.outcome}</span>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">Tradeoff: {ending.tradeoff}</span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">{ending.discoveredCount}/{ending.totalMoments} moments</span>
        </div>

        <article className="mt-8 max-w-3xl whitespace-pre-line rounded-3xl border border-white/10 bg-black/50 p-5 text-lg leading-9 text-slate-100 shadow-glow backdrop-blur-xl">
          {ending.reflection}
          <span className="mt-6 block text-2xl font-black leading-tight text-white">{ending.finalLine}</span>
        </article>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <button onClick={replay} className="story-choice text-left"><RotateCcw size={18} /> <span className="ml-2 font-black">Replay</span></button>
          <Link href="/start" onClick={clearStoryState} className="story-choice text-left"><Sparkles size={18} /> <span className="ml-2 font-black">Try different answers</span></Link>
          <button onClick={share} className="story-choice text-left"><Copy size={18} /> <span className="ml-2 font-black">{copied ? "Copied" : "Share summary"}</span></button>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="share-card rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl">
            <p className="cinema-kicker">Share card</p>
            <h2 className="mt-3 text-3xl font-black leading-none text-white">{ending.title}</h2>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-100">{ending.identity}</p>
            <p className="mt-5 text-2xl font-black leading-tight text-white">&quot;{ending.quote}&quot;</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              <Trophy size={14} /> Found {ending.discoveredCount}/{ending.totalMoments} moments
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">No spoilers. Easy to share.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl">
            <p className="cinema-kicker">What you found</p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-200">
              <ReplayLine label="Memories found" value={`${ending.memories.length}/7`} />
              <ReplayLine label="Secret scenes found" value={`${ending.secretScenesFound.length}/3`} />
              <ReplayLine label="Rare moments found" value={`${ending.rareMomentsTriggered.length + state.wildcardsUsed.filter((event) => event.rarity === "rare").length}/8`} />
              <ReplayLine label="Surprise button" value={state.chaosUsed ? "used" : "not used"} />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <CollectionPanel title="Memories found" empty="No memory items found this run." items={ending.memories.map((memory) => `${memory.name}: ${memory.quote}`)} />
          <CollectionPanel title="Secret scenes found" empty="No secret scenes found yet." items={ending.secretScenesFound.map((scene) => `${scene.title} - ${scene.unlockedBy}`)} />
          <CollectionPanel title="Rare moments" empty="No rare moments this time." items={[...ending.rareMomentsTriggered.map((moment) => `${moment.title}: ${moment.description}`), ...state.chaosEvents.map((event) => `${event.title}: ${event.kind}`)]} />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="cinema-kicker">Scenes you can still find</p>
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

function ReplayLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
      <span className="text-slate-300">{label}</span>
      <b className="text-white">{value}</b>
    </div>
  );
}

function CollectionPanel({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100"><Film size={14} /> {title}</p>
      <div className="mt-4 grid gap-2">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm leading-6 text-slate-200">{item}</div>
        )) : <p className="text-sm leading-6 text-slate-400">{empty}</p>}
      </div>
    </div>
  );
}
