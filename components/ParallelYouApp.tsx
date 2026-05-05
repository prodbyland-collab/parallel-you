"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Crosshair, GitMerge, Loader2, Maximize2, Minimize2, RefreshCcw, Save, Sparkles, Split, Zap } from "lucide-react";
import { generateParallelLives, mergeParallelLives, type LifeMilestone, type MilestoneCategory, type OnboardingInput, type ParallelVersion } from "@/lib/life-generator";
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
  { key: "name", label: "Name or nickname", type: "text", placeholder: "Nova" },
  { key: "age", label: "Age", type: "number", placeholder: "25" },
  { key: "country", label: "Country", type: "text", placeholder: "Georgia" },
  { key: "mainGoal", label: "Main goal", type: "textarea", placeholder: "Build a creative business, get fit, move abroad..." },
  { key: "regret", label: "Biggest regret or what-if", type: "textarea", placeholder: "What decision still echoes a little?" }
] as const;

const sliders = [
  { key: "discipline", label: "Discipline level" },
  { key: "risk", label: "Risk tolerance" },
  { key: "creativity", label: "Creativity level" },
  { key: "social", label: "Social energy" }
] as const;

const pathColors = ["#22d3ee", "#34d399", "#fb7185", "#d946ef", "#facc15", "#a78bfa"];
const categoryColor: Record<MilestoneCategory, string> = {
  money: "#facc15",
  health: "#34d399",
  love: "#fb7185",
  career: "#22d3ee",
  creativity: "#d946ef",
  mindset: "#a78bfa"
};

export function ParallelYouApp() {
  const [input, setInput] = useState<OnboardingInput>(initialInput);
  const [versions, setVersions] = useState<ParallelVersion[]>([]);
  const [activePathIds, setActivePathIds] = useState<string[]>([]);
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ versionId: string; milestone: LifeMilestone } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ versionId: string; milestone: LifeMilestone; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const activeVersions = useMemo(() => {
    const selected = versions.filter((version) => activePathIds.includes(version.id));
    return selected.length ? selected : versions.slice(0, 4);
  }, [activePathIds, versions]);

  const selectedVersion = useMemo(() => {
    if (!selectedNode) return activeVersions[0] ?? versions[0];
    return versions.find((version) => version.id === selectedNode.versionId) ?? activeVersions[0] ?? versions[0];
  }, [activeVersions, selectedNode, versions]);

  const currentMilestone = selectedNode?.milestone ?? selectedVersion?.timeline[0];
  const playerName = input.name.trim() || "Player One";
  const currentYear = currentMilestone?.year ?? 2026;

  const updateInput = (key: keyof OnboardingInput, value: string | number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const generate = () => {
    setStatus("loading");
    setError("");
    window.setTimeout(() => {
      const generated = generateParallelLives(input);
      setVersions(generated);
      setActivePathIds(generated.slice(0, 4).map((version) => version.id));
      setSelectedNode({ versionId: generated[0].id, milestone: generated[0].timeline[0] });
      setMergeIds([]);
      setStatus("idle");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 780);
  };

  const togglePath = (id: string) => {
    setActivePathIds((current) => {
      if (current.includes(id)) return current.length === 1 ? current : current.filter((item) => item !== id);
      return [...current, id].slice(-4);
    });
  };

  const toggleMerge = (id: string) => {
    setMergeIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current.slice(-1), id];
    });
  };

  const mergeTimelines = () => {
    if (mergeIds.length !== 2) {
      setError("Select exactly two paths before activating merge.");
      return;
    }
    const first = versions.find((version) => version.id === mergeIds[0]);
    const second = versions.find((version) => version.id === mergeIds[1]);
    if (!first || !second) return;
    const merged = mergeParallelLives(first, second);
    setVersions((current) => [merged, ...current.filter((version) => version.id !== merged.id)]);
    setActivePathIds([merged.id, first.id, second.id]);
    setSelectedNode({ versionId: merged.id, milestone: merged.timeline[0] });
    setMergeIds([]);
    setError("");
  };

  const saveTimeline = async () => {
    if (!selectedVersion) return;
    setStatus("loading");
    setError("");

    if (!supabase || !isSupabaseConfigured) {
      localStorage.setItem("parallel-you:last-timeline", JSON.stringify({ input, selectedVersion, versions }));
      setStatus("saved");
      return;
    }

    const { error: saveError } = await supabase.from("saved_timelines").insert({
      title: selectedVersion.title,
      input_snapshot: input,
      version_snapshot: selectedVersion
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
              <Sparkles size={16} /> Life Simulator Online
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Enter the future map of your alternate selves.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Answer a few questions and load a playable timeline map where choices branch like a strategy game skill tree.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-void transition hover:scale-[1.02] hover:bg-cyan-100">
                Generate My Parallel Life <ArrowRight size={18} />
              </button>
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-4 text-slate-200">
                <Zap size={18} className="text-amber-300" /> Futuristic RPG results
              </div>
            </div>
          </div>

          <div className="glass animate-float rounded-[2rem] p-4 shadow-glow">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-white/14 to-white/5 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Simulator preview</p>
                  <h2 className="text-2xl font-bold">Branching life map</h2>
                </div>
                <Crosshair className="text-cyan-200" />
              </div>
              <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                <div className="particle-field" />
                <svg viewBox="0 0 520 280" className="absolute inset-0 h-full w-full">
                  <path d="M60 140 C160 140 190 65 290 55 S410 70 465 35" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
                  <path d="M60 140 C165 142 200 142 300 142 S410 145 465 145" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
                  <path d="M60 140 C160 150 190 220 300 230 S410 215 465 245" fill="none" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
                  {[60, 180, 300, 420].map((x, index) => <circle key={x} cx={x} cy={index === 0 ? 140 : 55 + index * 45} r="9" fill="#fff" opacity="0.9" />)}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="onboarding" className="relative border-y border-white/10 bg-black/20 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">Character Setup</p>
            <h2 className="text-3xl font-black sm:text-4xl">Configure your life seed.</h2>
            <p className="mt-4 text-slate-300">Onboarding stays simple; the simulator uses your answers to generate playable timeline nodes.</p>
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
              Boot Life Simulator
            </button>
          </div>
        </div>
      </section>

      <section id="results" className="relative min-h-screen px-3 py-6 sm:px-5 lg:px-6">
        {!versions.length && (
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-300/20 bg-black/40 p-8 text-center text-slate-300 shadow-cyan">
            Simulator offline. Complete character setup to load the timeline map.
          </div>
        )}

        {!!versions.length && (
          <div className="sim-shell relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1600px] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#050712]/95 shadow-[0_0_80px_rgba(34,211,238,0.15)]">
            <div className="particle-field" />
            <div className="relative z-10 grid grid-rows-[auto_1fr]">
              <SimulatorHud playerName={playerName} age={input.age} year={currentYear} status={status} onSave={saveTimeline} onRetry={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} />
              {error && <div className="mx-4 mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div>}

              <div className="grid min-h-0 gap-4 p-4 xl:grid-cols-[290px_1fr_330px]">
                <PathConsole versions={versions} activeVersions={activeVersions} mergeIds={mergeIds} selectedVersion={selectedVersion} onTogglePath={togglePath} onToggleMerge={toggleMerge} onMerge={mergeTimelines} />
                <TimelineMap
                  versions={activeVersions}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  zoom={zoom}
                  mergeIds={mergeIds}
                  onZoom={setZoom}
                  onSelect={setSelectedNode}
                  onHover={setHoveredNode}
                />
                <StatsConsole version={selectedVersion} milestone={currentMilestone} comparedVersions={activeVersions} />
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SimulatorHud({ playerName, age, year, status, onSave, onRetry }: { playerName: string; age: number; year: number; status: string; onSave: () => void; onRetry: () => void }) {
  return (
    <header className="hud-panel flex flex-col gap-3 border-b border-cyan-300/20 bg-cyan-300/[0.04] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Life Simulator</span>
        <span className="text-sm text-slate-300">Player: <b className="text-white">{playerName}</b></span>
        <span className="text-sm text-slate-300">Age: <b className="text-white">{age}</b></span>
        <span className="text-sm text-slate-300">Current Year: <b className="text-cyan-200">{year}</b></span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onRetry} className="game-button"><RefreshCcw size={15} /> New Seed</button>
        <button onClick={onSave} className="game-button bg-white text-void hover:bg-cyan-100">{status === "saved" ? <Check size={15} /> : <Save size={15} />} Save</button>
      </div>
    </header>
  );
}

function PathConsole({ versions, activeVersions, mergeIds, selectedVersion, onTogglePath, onToggleMerge, onMerge }: {
  versions: ParallelVersion[];
  activeVersions: ParallelVersion[];
  mergeIds: string[];
  selectedVersion?: ParallelVersion;
  onTogglePath: (id: string) => void;
  onToggleMerge: (id: string) => void;
  onMerge: () => void;
}) {
  return (
    <aside className="hud-panel min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-black/35 p-4">
      <p className="mb-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Path Console</p>
      <h3 className="text-2xl font-black">{selectedVersion?.title ?? "No Path"}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{selectedVersion?.summary}</p>

      <div className="mt-5 space-y-2">
        {versions.map((version, index) => {
          const active = activeVersions.some((item) => item.id === version.id);
          const merging = mergeIds.includes(version.id);
          return (
            <div key={version.id} className={`rounded-2xl border p-3 transition ${active ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/[0.04]"}`}>
              <button onClick={() => onTogglePath(version.id)} className="flex w-full cursor-pointer items-center justify-between gap-3 text-left">
                <span>
                  <span className="block text-sm font-bold text-white">{version.title}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Path {index + 1}</span>
                </span>
                <span className="h-3 w-3 rounded-full" style={{ background: pathColors[index % pathColors.length], boxShadow: `0 0 18px ${pathColors[index % pathColors.length]}` }} />
              </button>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={merging} onChange={() => onToggleMerge(version.id)} className="accent-cyan-300" />
                Select for merge
              </label>
            </div>
          );
        })}
      </div>

      <div className={`mt-5 rounded-2xl border p-4 ${mergeIds.length === 2 ? "merge-preview border-fuchsia-300/40 bg-fuchsia-300/10" : "border-white/10 bg-white/[0.04]"}`}>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-white"><GitMerge size={16} /> Intersection Preview</div>
        <p className="text-sm leading-6 text-slate-400">
          {mergeIds.length === 2 ? "Two timelines are locked. Activate merge to form a new branching route." : "Select two paths to preview a merged future route."}
        </p>
        <button onClick={onMerge} className="game-button mt-4 w-full justify-center bg-fuchsia-300/15 text-fuchsia-50 hover:bg-fuchsia-300/25">
          Form Merged Path
        </button>
      </div>
    </aside>
  );
}

function TimelineMap({ versions, selectedNode, hoveredNode, zoom, mergeIds, onZoom, onSelect, onHover }: {
  versions: ParallelVersion[];
  selectedNode: { versionId: string; milestone: LifeMilestone } | null;
  hoveredNode: { versionId: string; milestone: LifeMilestone; x: number; y: number } | null;
  zoom: number;
  mergeIds: string[];
  onZoom: (zoom: number) => void;
  onSelect: (node: { versionId: string; milestone: LifeMilestone }) => void;
  onHover: (node: { versionId: string; milestone: LifeMilestone; x: number; y: number } | null) => void;
}) {
  const origin = { x: 92, y: 280 };
  const mapWidth = 920;
  const mapHeight = 560;

  const positioned = versions.map((version, pathIndex) => {
    const offset = (pathIndex - (versions.length - 1) / 2) * 86;
    const points = version.timeline.map((milestone, index) => ({
      milestone,
      x: origin.x + 145 * (index + 1),
      y: origin.y + offset + Math.sin(index * 1.15 + pathIndex) * 34
    }));
    return { version, pathIndex, color: pathColors[pathIndex % pathColors.length], points };
  });

  return (
    <section className="hud-panel relative min-h-[560px] overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/30">
      <div className="absolute left-4 top-4 z-20 flex gap-2">
        <button onClick={() => onZoom(Math.max(0.8, zoom - 0.1))} className="game-icon" aria-label="Zoom out"><Minimize2 size={15} /></button>
        <button onClick={() => onZoom(Math.min(1.25, zoom + 0.1))} className="game-icon" aria-label="Zoom in"><Maximize2 size={15} /></button>
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
        Pan-ready map / zoom {Math.round(zoom * 100)}%
      </div>

      <div className="h-full min-h-[560px] overflow-auto game-map-scroll">
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="h-full min-h-[560px] w-[920px] max-w-none transition-transform duration-300 lg:w-full" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          <defs>
            <filter id="nodeGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <radialGradient id="originGradient"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#22d3ee" /></radialGradient>
          </defs>
          <g opacity="0.18">
            {Array.from({ length: 14 }).map((_, index) => <line key={`v-${index}`} x1={index * 75} y1="0" x2={index * 75} y2={mapHeight} stroke="#fff" strokeWidth="1" />)}
            {Array.from({ length: 9 }).map((_, index) => <line key={`h-${index}`} x1="0" y1={index * 70} x2={mapWidth} y2={index * 70} stroke="#fff" strokeWidth="1" />)}
          </g>

          <circle cx={origin.x} cy={origin.y} r="16" fill="url(#originGradient)" filter="url(#nodeGlow)" />
          <text x={origin.x - 44} y={origin.y - 28} fill="#a5f3fc" fontSize="13" fontWeight="800">YOU ARE HERE</text>

          {positioned.map(({ version, color, points }) => {
            const path = `M ${origin.x} ${origin.y} ${points.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
            const isMergeSource = mergeIds.includes(version.id);
            return (
              <g key={version.id} className={isMergeSource ? "merge-source" : ""}>
                <path d={path} fill="none" stroke={color} strokeWidth={isMergeSource ? 7 : 4} strokeLinecap="round" opacity={isMergeSource ? 0.95 : 0.72} filter="url(#nodeGlow)" className="path-draw" />
                {points.map(({ milestone, x, y }) => {
                  const selected = selectedNode?.versionId === version.id && selectedNode.milestone.id === milestone.id;
                  const major = milestone.isMajorEvent;
                  return (
                    <g key={milestone.id} className="cursor-pointer" onMouseEnter={() => onHover({ versionId: version.id, milestone, x, y })} onMouseLeave={() => onHover(null)} onClick={() => onSelect({ versionId: version.id, milestone })}>
                      <circle cx={x} cy={y} r={major ? 18 : 14} fill="#050712" stroke={categoryColor[milestone.category]} strokeWidth={selected ? 5 : 3} filter="url(#nodeGlow)" className="node-pulse" />
                      <circle cx={x} cy={y} r={major ? 8 : 6} fill={color} />
                      {major && <text x={x - 5} y={y + 5} fill="#fff" fontSize="13" fontWeight="900">!</text>}
                      <text x={x - 18} y={y + 36} fill="#cbd5e1" fontSize="12" fontWeight="800">{milestone.year}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredNode && (
        <div className="pointer-events-none absolute z-30 max-w-xs rounded-2xl border border-white/15 bg-black/85 p-3 text-sm shadow-glow" style={{ left: `min(${hoveredNode.x}px, calc(100% - 18rem))`, top: `${Math.max(70, hoveredNode.y - 18)}px` }}>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{hoveredNode.milestone.year} / {hoveredNode.milestone.category}</p>
          <p className="mt-1 font-black text-white">{hoveredNode.milestone.title}</p>
          <p className="mt-1 text-slate-400">Impact {hoveredNode.milestone.impactScore}</p>
        </div>
      )}
    </section>
  );
}

function StatsConsole({ version, milestone, comparedVersions }: { version?: ParallelVersion; milestone?: LifeMilestone; comparedVersions: ParallelVersion[] }) {
  if (!version || !milestone) {
    return <aside className="hud-panel rounded-3xl border border-white/10 bg-black/35 p-4 text-slate-300">Select a node to inspect stats.</aside>;
  }

  const stats = [
    ["Health", version.scores.health, milestone.statsChange.health],
    ["Wealth", version.scores.money, milestone.statsChange.money],
    ["Happiness", version.scores.happiness, milestone.statsChange.happiness],
    ["Relationships", version.scores.relationships, milestone.statsChange.relationships],
    ["Creativity", version.scores.creativity, milestone.statsChange.creativity]
  ] as const;

  const sameYear = comparedVersions
    .map((item) => ({ version: item, event: item.timeline.find((node) => node.year === milestone.year) }))
    .filter((item): item is { version: ParallelVersion; event: LifeMilestone } => Boolean(item.event));

  return (
    <aside className="hud-panel min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">Event Panel</p>
      <div className="event-pop mt-3 rounded-3xl border border-fuchsia-300/30 bg-fuchsia-300/[0.06] p-4 shadow-glow">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-black text-cyan-100">{milestone.year}</span>
          <span className="rounded-full border px-2 py-1 text-[11px] uppercase" style={{ borderColor: categoryColor[milestone.category], color: categoryColor[milestone.category] }}>{milestone.category}</span>
        </div>
        <h3 className="text-2xl font-black">{milestone.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{milestone.description}</p>
        {milestone.isMajorEvent && <p className="level-up mt-4 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-amber-100">Major Event</p>}
      </div>

      <div className="mt-5 space-y-3">
        {stats.map(([label, value, delta]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>{label}</span>
              <span className={delta >= 0 ? "text-emerald-200" : "text-rose-200"}>{delta >= 0 ? "+" : ""}{delta}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 transition-all duration-500" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Emotional State</p>
        <p className="mt-2 text-white">{milestone.emotionalState}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Thought from this version</p>
        <p className="mt-2 text-sm leading-6 text-cyan-100">&ldquo;{milestone.thought}&rdquo;</p>
      </div>

      <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <summary className="cursor-pointer font-bold text-white">Consequences + profile</summary>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
          <p><b>Money:</b> {milestone.moneyChange}</p>
          <p><b>Health:</b> {milestone.healthChange}</p>
          <p><b>Relationships:</b> {milestone.relationshipChange}</p>
          <p><b>Creativity:</b> {milestone.creativityChange}</p>
          <p><b>Traits:</b> {version.personalityTraits.join(", ")}</p>
          <p><b>Career:</b> {version.careerDirection}</p>
          <p><b>Weakness:</b> {version.biggestWeakness}</p>
        </div>
      </details>

      <div className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-amber-100">Same-year diff</p>
        <div className="space-y-2">
          {sameYear.map(({ version: path, event }) => (
            <div key={path.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm font-bold text-white">{path.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{event.title} / Impact {event.impactScore}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
