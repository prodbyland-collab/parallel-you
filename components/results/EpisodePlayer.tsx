"use client";

import { GitCompare, GitMerge, Pause, Play, RotateCcw, Save, SkipBack, SkipForward, Star } from "lucide-react";
import type { GameMilestone, LifePath } from "@/lib/life-generator";

type EpisodePlayerProps = {
  path: LifePath;
  milestone: GameMilestone;
  episodeIndex: number;
  episodeCount: number;
  isPlaying: boolean;
  status: "idle" | "loading" | "saved" | "error";
  canCompare: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPlayToggle: () => void;
  onChoose: () => void;
  onCompare: () => void;
  onReplay: () => void;
  onSave: () => void;
  onMerge: () => void;
};

export function EpisodePlayer({
  path,
  milestone,
  episodeIndex,
  episodeCount,
  isPlaying,
  status,
  canCompare,
  onPrevious,
  onNext,
  onPlayToggle,
  onChoose,
  onCompare,
  onReplay,
  onSave,
  onMerge
}: EpisodePlayerProps) {
  return (
    <aside className="cinema-panel flex min-h-0 flex-col p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="cinema-kicker">Cinematic Player</p>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200">
          Episode {episodeIndex + 1}/{episodeCount}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-bold" style={{ color: path.color }}>{path.title}</p>
        <h3 className="mt-2 text-3xl font-black leading-none text-white">Season {path.id === "current" ? "1" : "2"}: {path.title.replace(" Path", " Arc")}</h3>
        <p className="mt-3 text-lg font-black text-cyan-100">Episode {episodeIndex + 1}: {milestone.title}</p>
        <p className="mt-2 text-sm text-slate-400">{milestone.year} / Age {milestone.age} / {milestone.avatarState.sceneType.toUpperCase()} SCENE</p>
      </div>

      <div className="event-pop mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
        <p className="cinema-kicker">Narration</p>
        <p className="mt-3 text-base leading-7 text-slate-100">{milestone.simpleResult}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">{milestone.whyItHappened}</p>
        <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          <b>Lesson:</b> {milestone.lesson}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
        <Delta label="Money" value={milestone.statsChange.money} />
        <Delta label="Health" value={milestone.statsChange.health} />
        <Delta label="Happy" value={milestone.statsChange.happiness} />
        <Delta label="Create" value={milestone.statsChange.creativity} />
      </div>

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onPrevious} className="cinema-control" aria-label="Previous scene"><SkipBack size={17} /></button>
          <button onClick={onPlayToggle} className="cinema-control bg-white text-void" aria-label={isPlaying ? "Pause trailer" : "Play trailer"}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={onNext} className="cinema-control" aria-label="Next scene"><SkipForward size={17} /></button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onChoose} className="game-button justify-center"><Star size={15} /> Choose Arc</button>
          <button onClick={onCompare} disabled={!canCompare} className="game-button justify-center disabled:cursor-not-allowed disabled:opacity-40"><GitCompare size={15} /> Compare</button>
          <button onClick={onReplay} className="game-button justify-center"><RotateCcw size={15} /> Replay</button>
          <button onClick={onMerge} className="game-button justify-center"><GitMerge size={15} /> Merge</button>
          <button onClick={onSave} className="game-button col-span-2 justify-center bg-white text-void hover:bg-cyan-100">
            <Save size={15} /> {status === "saved" ? "Saved" : "Save Timeline"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function Delta({ label, value }: { label: string; value: number }) {
  return (
    <span className={`rounded-2xl border px-3 py-2 ${value >= 0 ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>
      {label} {value >= 0 ? "+" : ""}{value}
    </span>
  );
}
