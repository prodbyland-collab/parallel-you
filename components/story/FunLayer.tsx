"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { Clock, Coins, FileText, Music, NotebookPen, Orbit, Play, Send, Sparkles, UserRound, Zap } from "lucide-react";
import type { ChaosEvent, MemoryObject, MiniGameType, RelationshipMoment } from "@/lib/story-types";

const memoryIcons: Record<MemoryObject["id"], ElementType> = {
  "old-notebook": NotebookPen,
  "voice-note": Play,
  photo: FileText,
  "broken-clock": Clock,
  "lucky-coin": Coins,
  "unfinished-song": Music,
  "message-draft": Send
};

export function FunLayer({
  memory,
  memories,
  chaosUsed,
  latestChaos,
  relationship,
  moodShift,
  movieMomentTitle,
  miniGame,
  sceneId,
  choicesVisible,
  onChaos,
  onCollectMemory,
  onMiniGameComplete
}: {
  memory?: MemoryObject;
  memories: MemoryObject[];
  chaosUsed: boolean;
  latestChaos?: ChaosEvent;
  relationship?: RelationshipMoment;
  moodShift?: string;
  movieMomentTitle?: string;
  miniGame?: MiniGameType;
  sceneId: string;
  choicesVisible: boolean;
  onChaos: () => void;
  onCollectMemory: (memory: MemoryObject) => void;
  onMiniGameComplete: (miniGameId: string) => void;
}) {
  const hasMemory = memory ? memories.some((item) => item.id === memory.id) : false;

  return (
    <div className="pointer-events-auto grid gap-3">
      <button
        onClick={onChaos}
        disabled={chaosUsed || !choicesVisible}
        className="fun-button border-amber-200/30 bg-amber-300/12 text-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Zap size={16} />
        {chaosUsed ? "You already used your surprise" : "Do Something Unexpected"}
      </button>

      {latestChaos && (
        <div className="event-pop rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">{latestChaos.kind}</p>
          <b>{latestChaos.title}</b>: {latestChaos.narration}
        </div>
      )}

      {relationship && (
        <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-3 text-sm leading-6 text-fuchsia-50">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200"><UserRound size={14} /> {relationship.role}</p>
          <b>{relationship.name}</b>: <span>&quot;{relationship.line}&quot;</span>
        </div>
      )}

      {moodShift && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">The mood changes</p>
          {moodShift}
        </div>
      )}

      {movieMomentTitle && (
        <div className="movie-flash rounded-2xl border border-white/20 bg-white/10 p-3 text-sm font-black uppercase tracking-[0.18em] text-white">
          {movieMomentTitle}
        </div>
      )}

      {memory && (
        <MemoryPickup memory={memory} collected={hasMemory} onCollect={() => onCollectMemory(memory)} />
      )}

      {miniGame && (
        <MiniGame type={miniGame} sceneId={sceneId} disabled={!choicesVisible} onComplete={onMiniGameComplete} hasMemory={memories.length > 0} />
      )}

      <MemoryShelf memories={memories} />
    </div>
  );
}

function MemoryPickup({ memory, collected, onCollect }: { memory: MemoryObject; collected: boolean; onCollect: () => void }) {
  const Icon = memoryIcons[memory.id];
  return (
    <button onClick={onCollect} disabled={collected} className="memory-pickup text-left disabled:cursor-default disabled:opacity-70">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-void"><Icon size={18} /></span>
      <span>
        <span className="block text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{collected ? "Collected" : "Memory item"}</span>
        <span className="block font-black text-white">{memory.name}</span>
        <span className="block text-xs leading-5 text-slate-300">{memory.description}</span>
      </span>
    </button>
  );
}

function MemoryShelf({ memories }: { memories: MemoryObject[] }) {
  if (!memories.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-slate-400">
        No memories yet. Collect small items during the story.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-300">Your memories</p>
      <div className="flex flex-wrap gap-2">
        {memories.map((memory) => {
          const Icon = memoryIcons[memory.id];
          return (
            <span key={memory.id} title={memory.quote} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-slate-100">
              <Icon size={13} /> {memory.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MiniGame({ type, sceneId, disabled, onComplete, hasMemory }: { type: MiniGameType; sceneId: string; disabled: boolean; onComplete: (miniGameId: string) => void; hasMemory: boolean }) {
  const miniGameId = `${sceneId}:${type}`;
  const [done, setDone] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [taps, setTaps] = useState(0);
  const particles = useMemo(() => Array.from({ length: 5 }, (_, index) => ({ id: index, left: 12 + index * 17, top: 28 + ((index * 23) % 42) })), []);

  const finish = useCallback(() => {
    setDone(true);
    onComplete(miniGameId);
  }, [miniGameId, onComplete]);

  useEffect(() => {
    if (type !== "timed-choice" || disabled || done) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          finish();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [disabled, done, finish, type]);

  useEffect(() => {
    setDone(false);
    setHoldProgress(0);
    setTimeLeft(5);
    setTaps(0);
  }, [miniGameId]);

  const holdStart = () => {
    if (disabled || done) return;
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 12;
      setHoldProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        finish();
      }
    }, 90);
    const stop = () => window.clearInterval(timer);
    window.addEventListener("pointerup", stop, { once: true });
  };

  if (done) {
    return <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-100">Nice. The Life Core got stronger.</div>;
  }

  if (type === "hold") {
    return (
      <button onPointerDown={holdStart} disabled={disabled} className="mini-game text-left disabled:opacity-55">
        <b>Hold to keep going</b>
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-cyan-200" style={{ width: `${holdProgress}%` }} /></span>
      </button>
    );
  }

  if (type === "timed-choice") {
    return (
      <button onClick={finish} disabled={disabled} className="mini-game text-left disabled:opacity-55">
        <b>Choose before time runs out</b>
        <span className="mt-1 block text-sm text-amber-100">{timeLeft}s left</span>
      </button>
    );
  }

  if (type === "drag-memory") {
    return (
      <button onClick={finish} disabled={disabled || !hasMemory} className="mini-game text-left disabled:opacity-55">
        <b>Add a memory to the Life Core</b>
        <span className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Orbit size={14} /> {hasMemory ? "Tap to add one of your memories" : "Collect a memory first"}</span>
      </button>
    );
  }

  return (
    <div className={`mini-game relative h-28 ${disabled ? "opacity-55" : ""}`}>
      <b>Tap the glowing particles</b>
      {particles.map((particle) => (
        <button
          key={particle.id}
          onClick={() => {
            const next = taps + 1;
            setTaps(next);
            if (next >= 3) finish();
          }}
          disabled={disabled}
          className="particle-tap"
          style={{ left: `${particle.left}%`, top: `${particle.top}%` }}
          aria-label="Tap glowing particle"
        />
      ))}
      <span className="absolute bottom-3 left-3 text-xs font-bold text-slate-300">{taps}/3 caught</span>
      <Sparkles className="absolute bottom-3 right-3 text-cyan-200" size={15} />
    </div>
  );
}
