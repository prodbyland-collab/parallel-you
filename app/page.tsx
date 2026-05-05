import Link from "next/link";
import { Clapperboard, Play, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03040a]">
      <div className="particle-field" />
      <div className="grid-mask pointer-events-none absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,0.22),transparent_28rem),radial-gradient(circle_at_78%_60%,rgba(217,70,239,0.16),transparent_26rem)]" />
      <div className="letterbox top-0" />
      <div className="letterbox bottom-0" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.24em] text-slate-100">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-void"><Clapperboard size={18} /></span>
            Direct Your Life
          </div>
          <Link href="/start" className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-200/60 hover:bg-white/10">
            Start
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
              <Sparkles size={16} /> Interactive life film
            </div>
            <h1 className="max-w-5xl text-balance text-6xl font-black leading-[0.88] tracking-[-0.03em] text-white sm:text-7xl lg:text-8xl">
              Direct the scene where your life changes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A short interactive film about you. Make small choices, feel the world shift, and reach an ending that remembers what you did.
            </p>
            <Link href="/start" className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-base font-black text-void transition hover:scale-[1.02] hover:bg-cyan-100">
              <Play size={19} fill="currentColor" /> Start Your Story
            </Link>
          </div>

          <div className="cinema-panel animate-float min-h-[420px] p-5">
            <div className="relative h-full min-h-[390px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/45">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.2),transparent_14rem),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="cinema-kicker">Trailer Preview</p>
                <h2 className="mt-3 text-4xl font-black leading-none text-white">ACT 1: The night the room gets too loud</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">A quiet room. A floating Life Core. One choice that does not look important yet.</p>
              </div>
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/25 bg-cyan-300/10 blur-[1px] shadow-[0_0_80px_rgba(34,211,238,0.35)]" />
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_60px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
