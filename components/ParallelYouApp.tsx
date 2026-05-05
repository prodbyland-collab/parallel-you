"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, GitCompare, GitMerge, Loader2, RotateCcw, Save, Sparkles, Split, Target } from "lucide-react";
import {
  generateLifeSimulation,
  mergeLifePaths,
  type GameMilestone,
  type LifePath,
  type LifeSimulationResult,
  type OnboardingInput,
  type PathStats
} from "@/lib/life-generator";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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

const statLabels: Array<[keyof PathStats, string]> = [
  ["money", "Money"],
  ["health", "Health"],
  ["happiness", "Happiness"],
  ["relationships", "Relationships"],
  ["creativity", "Creativity"],
  ["discipline", "Discipline"]
];

const badgeClass: Record<GameMilestone["badge"], string> = {
  SAFE: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  RISKY: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  RARE: "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100",
  "HIGH REWARD": "border-amber-300/40 bg-amber-300/10 text-amber-100",
  FOCUS: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  LUCK: "border-lime-300/40 bg-lime-300/10 text-lime-100"
};

export function ParallelYouApp() {
  const [input, setInput] = useState<OnboardingInput>(initialInput);
  const [result, setResult] = useState<LifeSimulationResult | null>(null);
  const [selectedPathId, setSelectedPathId] = useState("current");
  const [selectedNode, setSelectedNode] = useState<{ pathId: string; milestone: GameMilestone } | null>(null);
  const [comparePathId, setComparePathId] = useState<string | null>(null);
  const [mergePathId, setMergePathId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ path: LifePath; milestone: GameMilestone; x: number; y: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const paths = result?.paths ?? [];
  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0];
  const currentPath = paths.find((path) => path.id === "current") ?? paths[0];
  const currentNode = selectedNode?.milestone ?? selectedPath?.milestones[0];
  const comparePath = paths.find((path) => path.id === comparePathId);

  const comparisonLines = useMemo(() => {
    if (!currentPath || !comparePath || currentPath.id === comparePath.id) return [];
    return getComparisonLines(currentPath, comparePath);
  }, [comparePath, currentPath]);

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
            <p className="mt-4 text-slate-300">Your answers become the “YOU TODAY” node and shape every future branch.</p>
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
          <div className="sim-shell relative mx-auto min-h-[calc(100vh-3rem)] max-w-[1700px] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#050712]/95 shadow-[0_0_80px_rgba(34,211,238,0.15)]">
            <div className="particle-field" />
            <div className="relative z-10 grid min-h-[calc(100vh-3rem)] grid-rows-[auto_1fr]">
              <header className="hud-panel flex flex-col gap-3 border-b border-cyan-300/20 bg-cyan-300/[0.04] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Life Game Map</span>
                  <span className="text-sm text-slate-300">Player: <b className="text-white">{result.userSummary.name}</b></span>
                  <span className="text-sm text-slate-300">Age: <b className="text-white">{result.userSummary.currentAge}</b></span>
                  <span className="text-sm text-slate-300">Country: <b className="text-white">{result.userSummary.country}</b></span>
                  <span className="text-sm text-slate-300">Selected year: <b className="text-cyan-200">{currentNode.year}</b></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={replayFromYear} className="game-button"><RotateCcw size={15} /> Replay from this year</button>
                  <button onClick={saveTimeline} className="game-button bg-white text-void hover:bg-cyan-100">{status === "saved" ? <Check size={15} /> : <Save size={15} />} Save</button>
                </div>
              </header>

              {error && <div className="mx-4 mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</div>}

              <div className="grid min-h-0 gap-4 p-4 xl:grid-cols-[310px_1fr_340px]">
                <LeftPanel result={result} selectedPath={selectedPath} onChoosePath={choosePath} />
                <GameMap
                  result={result}
                  selectedPath={selectedPath}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  onHover={setHoveredNode}
                  onSelect={(path, milestone) => {
                    setSelectedPathId(path.id);
                    setSelectedNode({ pathId: path.id, milestone });
                  }}
                />
                <RightPanel
                  paths={paths}
                  currentPath={currentPath}
                  selectedPath={selectedPath}
                  node={currentNode}
                  comparePath={comparePath}
                  comparisonLines={comparisonLines}
                  mergePathId={mergePathId}
                  onChoosePath={() => choosePath(selectedPath)}
                  onCompare={() => setComparePathId(selectedPath.id === "current" ? null : selectedPath.id)}
                  onMergePathChange={setMergePathId}
                  onMerge={mergeWithSelected}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function LeftPanel({ result, selectedPath, onChoosePath }: { result: LifeSimulationResult; selectedPath: LifePath; onChoosePath: (path: LifePath) => void }) {
  return (
    <aside className="hud-panel min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-black/35 p-4">
      <p className="mb-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">You Today</p>
      <div className="rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-4 shadow-cyan">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-black text-void shadow-glow">YOU</span>
          <div>
            <h3 className="text-xl font-black">{result.userSummary.name}</h3>
            <p className="text-sm text-slate-300">Age {result.userSummary.currentAge} / {result.userSummary.country}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-200"><b>Goal:</b> {result.userSummary.goal}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300"><b>What-if:</b> {result.userSummary.whatIf}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
          <span>Discipline {result.userSummary.disciplineScore}/10</span>
          <span>Risk {result.userSummary.riskScore}/10</span>
          <span>Creativity {result.userSummary.creativityScore}/10</span>
          <span>Social {result.userSummary.socialScore}/10</span>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">Playable Paths</p>
        <div className="space-y-2">
          {result.paths.map((path) => (
            <button
              key={path.id}
              onClick={() => onChoosePath(path)}
              className={`w-full cursor-pointer rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                selectedPath.id === path.id ? "border-cyan-300/50 bg-cyan-300/12" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-black text-white">{path.title}</span>
                <span className="h-3 w-3 rounded-full" style={{ background: path.color, boxShadow: `0 0 18px ${path.color}` }} />
              </div>
              <p className="text-sm text-cyan-100">{path.simpleMeaning}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{path.personalSummary}</p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GameMap({ result, selectedPath, selectedNode, hoveredNode, onHover, onSelect }: {
  result: LifeSimulationResult;
  selectedPath: LifePath;
  selectedNode: { pathId: string; milestone: GameMilestone } | null;
  hoveredNode: { path: LifePath; milestone: GameMilestone; x: number; y: number } | null;
  onHover: (node: { path: LifePath; milestone: GameMilestone; x: number; y: number } | null) => void;
  onSelect: (path: LifePath, milestone: GameMilestone) => void;
}) {
  const origin = { x: 105, y: 310 };
  const branchYs = [130, 220, 310, 400, 490, 560];
  const mobileRows = result.paths;

  return (
    <section className="hud-panel relative min-h-[640px] overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/30">
      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
        Click nodes / hover for intel
      </div>

      <div className="hidden h-full overflow-auto md:block">
        <svg viewBox="0 0 980 650" className="h-full min-h-[640px] w-[980px] max-w-none lg:w-full">
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g opacity="0.14">
            {Array.from({ length: 15 }).map((_, index) => <line key={`v-${index}`} x1={index * 70} y1="0" x2={index * 70} y2="650" stroke="#fff" />)}
            {Array.from({ length: 11 }).map((_, index) => <line key={`h-${index}`} x1="0" y1={index * 65} x2="980" y2={index * 65} stroke="#fff" />)}
          </g>

          <circle cx={origin.x} cy={origin.y} r="42" fill="#ffffff" filter="url(#glow)" />
          <circle cx={origin.x} cy={origin.y} r="31" fill="#050712" stroke="#22d3ee" strokeWidth="3" />
          <text x={origin.x - 34} y={origin.y - 6} fill="#fff" fontSize="13" fontWeight="900">YOU</text>
          <text x={origin.x - 45} y={origin.y + 12} fill="#a5f3fc" fontSize="12" fontWeight="900">TODAY</text>
          <text x={origin.x - 72} y={origin.y + 66} fill="#cbd5e1" fontSize="12">{result.userSummary.name}, {result.userSummary.currentAge}</text>

          {result.paths.map((path, pathIndex) => {
            const y = branchYs[pathIndex] ?? 560;
            const selected = selectedPath.id === path.id;
            const points = path.milestones.map((milestone, index) => ({ milestone, x: 270 + index * 135, y: y + Math.sin(index + pathIndex) * 18 }));
            const pathLine = `M ${origin.x + 36} ${origin.y} C 190 ${origin.y} 195 ${y} 250 ${y} ${points.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
            return (
              <g key={path.id}>
                <path d={pathLine} fill="none" stroke={path.color} strokeWidth={selected ? 7 : 4} strokeLinecap="round" opacity={selected ? 0.95 : 0.48} filter="url(#glow)" className="path-draw" />
                <text x="195" y={y - 18} fill={path.color} fontSize="13" fontWeight="900">{path.title}</text>
                <text x="195" y={y} fill="#cbd5e1" fontSize="11">{path.simpleMeaning}</text>
                {points.map(({ milestone, x, y: nodeY }) => {
                  const nodeSelected = selectedNode?.pathId === path.id && selectedNode.milestone.id === milestone.id;
                  return (
                    <g key={milestone.id} className="cursor-pointer" onClick={() => onSelect(path, milestone)} onMouseEnter={() => onHover({ path, milestone, x, y: nodeY })} onMouseLeave={() => onHover(null)}>
                      <circle cx={x} cy={nodeY} r={nodeSelected ? 22 : 17} fill="#050712" stroke={path.color} strokeWidth={nodeSelected ? 5 : 3} filter="url(#glow)" className="node-pulse" />
                      <circle cx={x} cy={nodeY} r="7" fill={path.color} />
                      <text x={x - 16} y={nodeY + 42} fill="#e2e8f0" fontSize="12" fontWeight="900">{milestone.year}</text>
                      <text x={x - 30} y={nodeY - 28} fill="#94a3b8" fontSize="10">{milestone.badge}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-5 overflow-y-auto p-4 pt-14 md:hidden">
        <div className="rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-4 shadow-cyan">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">YOU TODAY</p>
          <p className="mt-1 text-xl font-black">{result.userSummary.name}</p>
          <p className="text-sm text-slate-300">{result.userSummary.goal}</p>
        </div>
        {mobileRows.map((path) => (
          <div key={path.id} className="relative border-l-2 pl-5" style={{ borderColor: path.color }}>
            <p className="font-black" style={{ color: path.color }}>{path.title}</p>
            <p className="mb-3 text-sm text-slate-400">{path.simpleMeaning}</p>
            {path.milestones.map((milestone) => (
              <button key={milestone.id} onClick={() => onSelect(path, milestone)} className="mb-3 block w-full rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left">
                <span className="text-sm font-black">{milestone.year}: {milestone.title}</span>
                <span className="mt-1 block text-xs text-slate-400">{milestone.simpleResult}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {hoveredNode && (
        <div className="pointer-events-none absolute z-30 max-w-xs rounded-2xl border border-white/15 bg-black/90 p-3 text-sm shadow-glow" style={{ left: `min(${hoveredNode.x}px, calc(100% - 18rem))`, top: `${Math.max(68, hoveredNode.y - 28)}px` }}>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: hoveredNode.path.color }}>{hoveredNode.path.title}</p>
          <p className="mt-1 font-black text-white">{hoveredNode.milestone.year}: {hoveredNode.milestone.title}</p>
          <p className="mt-1 text-slate-400">{hoveredNode.milestone.simpleResult}</p>
        </div>
      )}
    </section>
  );
}

function RightPanel({
  paths,
  currentPath,
  selectedPath,
  node,
  comparePath,
  comparisonLines,
  mergePathId,
  onChoosePath,
  onCompare,
  onMergePathChange,
  onMerge
}: {
  paths: LifePath[];
  currentPath?: LifePath;
  selectedPath: LifePath;
  node: GameMilestone;
  comparePath?: LifePath;
  comparisonLines: string[];
  mergePathId: string | null;
  onChoosePath: () => void;
  onCompare: () => void;
  onMergePathChange: (id: string) => void;
  onMerge: () => void;
}) {
  return (
    <aside className="hud-panel min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="event-pop rounded-3xl border border-fuchsia-300/30 bg-fuchsia-300/[0.06] p-4 shadow-glow">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100">Event Unlocked</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-black">{node.title}</h3>
          <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${badgeClass[node.badge]}`}>{node.badge}</span>
        </div>
        <p className="mt-2 text-sm text-cyan-100">Year {node.year} / Age {node.age} / {selectedPath.title}</p>
        <p className="mt-4 text-sm leading-6 text-slate-200"><b>What happened:</b> {node.simpleResult}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300"><b>Why:</b> {node.whyItHappened}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm leading-6 text-amber-100"><b>Lesson:</b> {node.lesson}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onChoosePath} className="game-button justify-center"><Target size={15} /> Choose path</button>
        <button onClick={onCompare} disabled={selectedPath.id === currentPath?.id} className="game-button justify-center disabled:cursor-not-allowed disabled:opacity-40"><GitCompare size={15} /> Compare</button>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">RPG Stats</p>
        <div className="space-y-3">
          {statLabels.map(([key, label]) => (
            <StatBar key={key} label={label} value={selectedPath.stats[key]} delta={node.statsChange[key]} />
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-300">
          <p><b className="text-emerald-200">Best stat:</b> {formatStat(selectedPath.bestStat)}</p>
          <p><b className="text-rose-200">Weakest stat:</b> {formatStat(selectedPath.weakestStat)}</p>
          <p><b className="text-amber-200">Biggest tradeoff:</b> {selectedPath.biggestTradeoff}</p>
          <p><b className="text-cyan-200">Emotional state:</b> {node.emotionalState}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-amber-100">Stats changed</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
          {statLabels.map(([key, label]) => (
            <span key={key} className={node.statsChange[key] >= 0 ? "text-emerald-100" : "text-rose-100"}>
              {label} {node.statsChange[key] >= 0 ? "+" : ""}{node.statsChange[key]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100">Compare with Current Path</p>
        {comparePath && comparisonLines.length ? (
          <div className="space-y-2 text-sm leading-6 text-slate-300">
            {comparisonLines.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-400">Select a non-current path, then hit Compare.</p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-lime-100">Merge with another path</p>
        <select value={mergePathId ?? ""} onChange={(event) => onMergePathChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white">
          <option value="">Choose path</option>
          {paths.filter((path) => path.id !== selectedPath.id).map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
        </select>
        <button onClick={onMerge} className="game-button merge-preview mt-3 w-full justify-center"><GitMerge size={15} /> Generate merged path</button>
      </div>
    </aside>
  );
}

function StatBar({ label, value, delta }: { label: string; value: number; delta: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className={delta >= 0 ? "text-emerald-200" : "text-rose-200"}>{value} XP ({delta >= 0 ? "+" : ""}{delta})</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
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

function formatStat(stat: keyof PathStats) {
  return stat === "relationships" ? "Relationships" : stat[0].toUpperCase() + stat.slice(1);
}
