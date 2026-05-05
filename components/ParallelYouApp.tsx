"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Loader2, Save, Sparkles, Split } from "lucide-react";
import {
  generateLifeSimulation,
  mergeLifePaths,
  type GameMilestone,
  type LifePath,
  type LifeSimulationResult,
  type OnboardingInput
} from "@/lib/life-generator";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { CinematicLifeScene } from "@/components/results/CinematicLifeScene";
import { CinematicStats } from "@/components/results/CinematicStats";
import { EpisodePlayer } from "@/components/results/EpisodePlayer";
import { TimelineStrip } from "@/components/results/TimelineStrip";

const initialInput: OnboardingInput = {
  name: "",
  age: 25,
  country: "",
  mainGoal: "",
  regret: "",
  discipline: 5,
  risk: 5,
  creativity: 5,
  social: 5
};

const questions = [
  { key: "name", label: "Name or nickname", type: "text", placeholder: "Giorgi" },
  { key: "age", label: "Age", type: "number", placeholder: "25" },
  { key: "country", label: "Country", type: "text", placeholder: "Georgia" },
  { key: "mainGoal", label: "Main goal", type: "textarea", placeholder: "Grow my music, build a business, move abroad..." },
  { key: "regret", label: "Biggest regret or what-if", type: "textarea", placeholder: "What decision still echoes a little?" }
] as const;

const sliders = [
  { key: "discipline", label: "Discipline level" },
  { key: "risk", label: "Risk tolerance" },
  { key: "creativity", label: "Creativity level" },
  { key: "social", label: "Social energy" }
] as const;

export function ParallelYouApp() {
  const [input, setInput] = useState<OnboardingInput>(initialInput);
  const [result, setResult] = useState<LifeSimulationResult | null>(null);
  const [selectedPathId, setSelectedPathId] = useState("current");
  const [selectedNode, setSelectedNode] = useState<{ pathId: string; milestone: GameMilestone } | null>(null);
  const [comparePathId, setComparePathId] = useState<string | null>(null);
  const [mergePathId, setMergePathId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const paths = result?.paths ?? [];
  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0];
  const currentPath = paths.find((path) => path.id === "current") ?? paths[0];
  const currentNode = selectedNode?.milestone ?? selectedPath?.milestones[0];
  const comparePath = paths.find((path) => path.id === comparePathId);
  const episodeIndex = selectedPath && currentNode ? Math.max(0, selectedPath.milestones.findIndex((milestone) => milestone.id === currentNode.id)) : 0;

  const comparisonLines = useMemo(() => {
    if (!currentPath || !comparePath || currentPath.id === comparePath.id) return [];
    return getComparisonLines(currentPath, comparePath);
  }, [comparePath, currentPath]);

  useEffect(() => {
    if (!isPlaying || !selectedPath) return;
    const timer = window.setInterval(() => {
      setSelectedNode((current) => {
        const activeMilestone = current?.pathId === selectedPath.id ? current.milestone : selectedPath.milestones[0];
        const activeIndex = Math.max(0, selectedPath.milestones.findIndex((milestone) => milestone.id === activeMilestone.id));
        const nextMilestone = selectedPath.milestones[(activeIndex + 1) % selectedPath.milestones.length];
        return { pathId: selectedPath.id, milestone: nextMilestone };
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isPlaying, selectedPath]);

  const updateInput = (key: keyof OnboardingInput, value: string | number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const generate = () => {
    setStatus("loading");
    setError("");
    window.setTimeout(() => {
      const simulation = generateLifeSimulation(input);
      setResult(simulation);
      setSelectedPathId("current");
      setSelectedNode({ pathId: "current", milestone: simulation.paths[0].milestones[0] });
      setComparePathId(null);
      setMergePathId(null);
      setStatus("idle");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 780);
  };

  const choosePath = (path: LifePath) => {
    setSelectedPathId(path.id);
    setSelectedNode({ pathId: path.id, milestone: path.milestones[0] });
    setIsPlaying(false);
  };

  const selectMilestone = (path: LifePath, milestone: GameMilestone) => {
    setSelectedPathId(path.id);
    setSelectedNode({ pathId: path.id, milestone });
    setIsPlaying(false);
  };

  const stepEpisode = (direction: 1 | -1) => {
    if (!selectedPath || !currentNode) return;
    const currentIndex = Math.max(0, selectedPath.milestones.findIndex((milestone) => milestone.id === currentNode.id));
    const nextIndex = (currentIndex + direction + selectedPath.milestones.length) % selectedPath.milestones.length;
    setSelectedNode({ pathId: selectedPath.id, milestone: selectedPath.milestones[nextIndex] });
  };

  const replayFromYear = () => {
    if (!currentNode) return;
    setError(`Replay loaded from ${currentNode.year}. Try changing one onboarding score, then boot the simulator again.`);
    document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" });
  };

  const mergeWithSelected = () => {
    if (!result || !selectedPath || !mergePathId) {
      setError("Pick another path in the merge slot first.");
      return;
    }
    const other = result.paths.find((path) => path.id === mergePathId);
    if (!other || other.id === selectedPath.id) {
      setError("Choose a different path to merge.");
      return;
    }
    const merged = mergeLifePaths(selectedPath, other, result.userSummary);
    setResult({ ...result, paths: [merged, ...result.paths.filter((path) => path.id !== merged.id)] });
    setSelectedPathId(merged.id);
    setSelectedNode({ pathId: merged.id, milestone: merged.milestones[0] });
    setMergePathId(null);
    setIsPlaying(false);
    setError("");
  };

  const saveTimeline = async () => {
    if (!result || !selectedPath) return;
    setStatus("loading");
    setError("");

    if (!supabase || !isSupabaseConfigured) {
      localStorage.setItem("parallel-you:last-timeline", JSON.stringify({ input, result, selectedPath }));
      setStatus("saved");
      return;
    }

    const { error: saveError } = await supabase.from("saved_timelines").insert({
      title: selectedPath.title,
      input_snapshot: input,
      version_snapshot: { result, selectedPath }
    });

    if (saveError) {
      setError(saveError.message);
      setStatus("error");
      return;
    }

    setStatus("saved");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="grid-mask pointer-events-none absolute inset-0 opacity-60" />
      <section className="relative px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between py-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-void"><Split size={18} /></span>
            Parallel You
          </div>
          <button onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:bg-white/10">
            Start
          </button>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
              <Sparkles size={16} /> Life Game Map
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Play through five versions of your future.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Build a personal life map where each branch shows what changes if you stay the same, get disciplined, take risks, create more, or catch lucky breaks.
            </p>
            <button onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-void transition hover:scale-[1.02] hover:bg-cyan-100">
              Generate My Parallel Life <ArrowRight size={18} />
            </button>
          </div>

          <div className="glass animate-float rounded-[2rem] p-4 shadow-glow">
            <div className="relative h-80 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
              <div className="particle-field" />
              <p className="text-sm text-slate-400">Preview</p>
              <h2 className="text-2xl font-bold">YOU TODAY &rarr; 5 playable paths</h2>
              <svg viewBox="0 0 520 230" className="absolute inset-x-0 bottom-4 h-56 w-full">
                <circle cx="70" cy="115" r="22" fill="#fff" opacity="0.92" />
                {([
                  ["#22d3ee", 75],
                  ["#34d399", 95],
                  ["#fb7185", 115],
                  ["#d946ef", 135],
                  ["#facc15", 155]
                ] as const).map(([color, y], index) => (
                  <g key={color}>
                    <path d={`M92 115 C190 115 230 ${y} 330 ${y} S430 ${y} 485 ${y}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                    <circle cx={220 + index * 34} cy={Number(y)} r="8" fill={color} />
                    <circle cx="485" cy={Number(y)} r="9" fill={color} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="onboarding" className="relative border-y border-white/10 bg-black/20 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">Player Setup</p>
            <h2 className="text-3xl font-black sm:text-4xl">Set your starting stats.</h2>
            <p className="mt-4 text-slate-300">Your answers become the YOU TODAY platform and shape every future branch.</p>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => (
                <label key={question.key} className={question.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 block text-sm font-medium text-slate-300">{question.label}</span>
                  {question.type === "textarea" ? (
                    <textarea value={String(input[question.key])} onChange={(event) => updateInput(question.key, event.target.value)} placeholder={question.placeholder} className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70" />
                  ) : (
                    <input value={String(input[question.key])} onChange={(event) => updateInput(question.key, question.type === "number" ? Number(event.target.value) : event.target.value)} placeholder={question.placeholder} type={question.type} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70" />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {sliders.map((slider) => (
                <label key={slider.key}>
                  <span className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                    {slider.label}<b className="text-white">{input[slider.key]}/10</b>
                  </span>
                  <input type="range" min="1" max="10" value={input[slider.key]} onChange={(event) => updateInput(slider.key, Number(event.target.value))} className="w-full accent-cyan-300" />
                </label>
              ))}
            </div>

            <button onClick={generate} disabled={status === "loading"} className="mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 px-6 py-4 font-black text-void transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70">
              {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
              Boot Life Game Map
            </button>
          </div>
        </div>
      </section>

      <section id="results" className="relative min-h-screen px-3 py-6 sm:px-5 lg:px-6">
        {!result && (
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-300/20 bg-black/40 p-8 text-center text-slate-300 shadow-cyan">
            Life Game Map locked. Complete player setup to reveal your paths.
          </div>
        )}

        {result && selectedPath && currentNode && (
          <div className="cinema-shell relative mx-auto min-h-[calc(100vh-3rem)] max-w-[1800px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#03040a]/95 shadow-[0_0_100px_rgba(34,211,238,0.14)]">
            <div className="particle-field" />
            <div className="relative z-10 grid min-h-[calc(100vh-3rem)] grid-rows-[auto_1fr_auto] gap-4 p-3 lg:p-4">
              <header className="cinema-panel flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Parallel You: Cinematic Mode</span>
                  <span className="text-sm text-slate-300">Viewer: <b className="text-white">{result.userSummary.name}</b></span>
                  <span className="text-sm text-slate-300">Age: <b className="text-white">{result.userSummary.currentAge}</b></span>
                  <span className="text-sm text-slate-300">Origin: <b className="text-white">{result.userSummary.country}</b></span>
                  <span className="text-sm text-slate-300">Now playing: <b style={{ color: selectedPath.color }}>{selectedPath.title}</b></span>
                </div>
                <button onClick={saveTimeline} className="game-button bg-white text-void hover:bg-cyan-100">
                  {status === "saved" ? <Check size={15} /> : <Save size={15} />} {status === "saved" ? "Saved" : "Save Timeline"}
                </button>
              </header>

              {error && <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</div>}

              <div className="grid min-h-0 gap-4 xl:grid-cols-[1fr_380px]">
                <div className="min-w-0">
                  <CinematicLifeScene result={result} path={selectedPath} milestone={currentNode} episodeIndex={episodeIndex} />
                </div>
                <div className="grid min-h-0 gap-4 lg:grid-cols-2 xl:grid-cols-1">
                  <EpisodePlayer
                    path={selectedPath}
                    milestone={currentNode}
                    episodeIndex={episodeIndex}
                    episodeCount={selectedPath.milestones.length}
                    isPlaying={isPlaying}
                    status={status}
                    canCompare={selectedPath.id !== currentPath?.id}
                    onPrevious={() => stepEpisode(-1)}
                    onNext={() => stepEpisode(1)}
                    onPlayToggle={() => setIsPlaying((playing) => !playing)}
                    onChoose={() => choosePath(selectedPath)}
                    onCompare={() => setComparePathId(selectedPath.id === "current" ? null : selectedPath.id)}
                    onReplay={replayFromYear}
                    onSave={saveTimeline}
                    onMerge={mergeWithSelected}
                  />
                  <div className="space-y-4">
                    <div className="cinema-panel p-4">
                      <p className="cinema-kicker">You Today</p>
                      <h3 className="mt-3 text-2xl font-black text-white">{result.userSummary.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Goal: {result.userSummary.goal}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">What-if: {result.userSummary.whatIf}</p>
                    </div>
                    <CinematicStats path={selectedPath} milestone={currentNode} />
                    <div className="cinema-panel p-4">
                      <p className="cinema-kicker">Compare / Merge</p>
                      {comparePath && comparisonLines.length ? (
                        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                          {comparisonLines.map((line) => <p key={line}>{line}</p>)}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-400">Pick another arc and compare it with Current Life.</p>
                      )}
                      <select value={mergePathId ?? ""} onChange={(event) => setMergePathId(event.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white">
                        <option value="">Merge with...</option>
                        {paths.filter((path) => path.id !== selectedPath.id).map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <TimelineStrip
                paths={paths}
                selectedPathId={selectedPath.id}
                selectedMilestoneId={currentNode.id}
                onSelectPath={choosePath}
                onSelectMilestone={selectMilestone}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function getComparisonLines(current: LifePath, other: LifePath) {
  const lines: string[] = [];
  if (other.stats.money > current.stats.money + 6) lines.push("You earn more, but the path asks for more pressure.");
  if (other.stats.creativity > current.stats.creativity + 6) lines.push("You become more creative, but money may grow slower at first.");
  if (other.stats.health > current.stats.health + 6) lines.push("You get healthier, but your free time becomes more structured.");
  if (other.stats.relationships < current.stats.relationships - 4) lines.push("Your social life drops slightly because this path needs more focus.");
  if (other.stats.discipline > current.stats.discipline + 8) lines.push("You become more consistent, and progress gets easier to predict.");
  if (!lines.length) lines.push("This path is close to Current Path, but the emotional rhythm changes.");
  return lines;
}
