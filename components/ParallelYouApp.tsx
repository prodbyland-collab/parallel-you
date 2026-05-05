"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Check,
  Dices,
  Heart,
  Loader2,
  RefreshCcw,
  Save,
  Sparkles,
  Split,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  generateParallelLives,
  mergeParallelLives,
  type LifeMilestone,
  type MilestoneCategory,
  type OnboardingInput,
  type ParallelVersion
} from "@/lib/life-generator";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { StatBars } from "@/components/StatBars";

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

const categoryStyles: Record<MilestoneCategory, string> = {
  money: "bg-amber-300/15 text-amber-100 border-amber-300/30",
  health: "bg-emerald-300/15 text-emerald-100 border-emerald-300/30",
  love: "bg-rose-300/15 text-rose-100 border-rose-300/30",
  career: "bg-cyan-300/15 text-cyan-100 border-cyan-300/30",
  creativity: "bg-fuchsia-300/15 text-fuchsia-100 border-fuchsia-300/30",
  mindset: "bg-violet-300/15 text-violet-100 border-violet-300/30"
};

export function ParallelYouApp() {
  const [input, setInput] = useState<OnboardingInput>(initialInput);
  const [versions, setVersions] = useState<ParallelVersion[]>([]);
  const [activePathIds, setActivePathIds] = useState<string[]>([]);
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<{ versionId: string; milestone: LifeMilestone } | null>(null);
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const activeVersions = useMemo(() => {
    const selected = versions.filter((version) => activePathIds.includes(version.id));
    return selected.length ? selected : versions.slice(0, 2);
  }, [activePathIds, versions]);

  const selectedVersion = useMemo(() => {
    if (!selectedMilestone) return activeVersions[0] ?? versions[0];
    return versions.find((version) => version.id === selectedMilestone.versionId) ?? activeVersions[0] ?? versions[0];
  }, [activeVersions, selectedMilestone, versions]);

  const years = useMemo(() => Array.from(new Set(activeVersions.flatMap((version) => version.timeline.map((item) => item.year)))).sort(), [activeVersions]);

  const updateInput = (key: keyof OnboardingInput, value: string | number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const generate = () => {
    setStatus("loading");
    setError("");
    window.setTimeout(() => {
      const generated = generateParallelLives(input);
      setVersions(generated);
      setActivePathIds([generated[0].id, generated[1].id]);
      setSelectedMilestone({ versionId: generated[0].id, milestone: generated[0].timeline[0] });
      setCompareYear(generated[0].timeline[0].year);
      setMergeIds([]);
      setStatus("idle");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 650);
  };

  const togglePath = (id: string) => {
    setActivePathIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id].slice(-3);
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
      setError("Select two life paths to merge.");
      return;
    }
    const first = versions.find((version) => version.id === mergeIds[0]);
    const second = versions.find((version) => version.id === mergeIds[1]);
    if (!first || !second) return;
    const merged = mergeParallelLives(first, second);
    setVersions((current) => [merged, ...current.filter((version) => version.id !== merged.id)]);
    setActivePathIds([merged.id, first.id]);
    setSelectedMilestone({ versionId: merged.id, milestone: merged.timeline[0] });
    setCompareYear(merged.timeline[0].year);
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
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-void">
              <Split size={18} />
            </span>
            Parallel You
          </div>
          <button
            onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:bg-white/10"
          >
            Start
          </button>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
              <Sparkles size={16} />
              Tiny choices. Wild timelines.
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Meet the lives you almost became.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Answer a few personal questions and watch your future split into glowing paths: the current life, the bold
              life, the disciplined life, and the strange lucky branch that keeps winking from the corner.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-void transition hover:scale-[1.02] hover:bg-cyan-100"
              >
                Generate My Parallel Life <ArrowRight size={18} />
              </button>
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-4 text-slate-200">
                <Zap size={18} className="text-amber-300" />
                Timeline simulator
              </div>
            </div>
          </div>

          <div className="glass animate-float rounded-[2rem] p-4 shadow-glow">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-white/14 to-white/5 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Simulator preview</p>
                  <h2 className="text-2xl font-bold">Future split map</h2>
                </div>
                <Dices className="text-cyan-200" />
              </div>
              <div className="space-y-5">
                {["Current Life", "Alternative Life", "Merged Timeline"].map((item, index) => (
                  <div key={item}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold">{item}</span>
                      <span className="text-slate-400">202{6 + index} - 2030</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/10">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300" style={{ width: `${72 + index * 10}%` }} />
                      <span className="absolute -top-1 left-1/4 h-4 w-4 rounded-full border border-white/60 bg-cyan-200 shadow-cyan" />
                      <span className="absolute -top-1 left-2/3 h-4 w-4 rounded-full border border-white/60 bg-fuchsia-200 shadow-glow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="onboarding" className="relative border-y border-white/10 bg-black/20 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">Onboarding</p>
            <h2 className="text-3xl font-black sm:text-4xl">Feed the timeline engine.</h2>
            <p className="mt-4 text-slate-300">
              The generator uses editable milestone templates in one file, so every future branch stays easy to tune.
            </p>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => (
                <label key={question.key} className={question.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 block text-sm font-medium text-slate-300">{question.label}</span>
                  {question.type === "textarea" ? (
                    <textarea
                      value={String(input[question.key])}
                      onChange={(event) => updateInput(question.key, event.target.value)}
                      placeholder={question.placeholder}
                      className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                    />
                  ) : (
                    <input
                      value={String(input[question.key])}
                      onChange={(event) => updateInput(question.key, question.type === "number" ? Number(event.target.value) : event.target.value)}
                      placeholder={question.placeholder}
                      type={question.type}
                      className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {sliders.map((slider) => (
                <label key={slider.key}>
                  <span className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                    {slider.label}
                    <b className="text-white">{input[slider.key]}/10</b>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={input[slider.key]}
                    onChange={(event) => updateInput(slider.key, Number(event.target.value))}
                    className="w-full accent-cyan-300"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={status === "loading"}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 px-6 py-4 font-black text-void transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
            >
              {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
              Generate My Parallel Life
            </button>
          </div>
        </div>
      </section>

      <section id="results" className="relative px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-200">Timeline results</p>
              <h2 className="text-3xl font-black sm:text-4xl">Watch your future split.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={mergeTimelines} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">
                <Split size={16} /> Merge two paths
              </button>
              <button onClick={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">
                <RefreshCcw size={16} /> Try another decision
              </button>
              <button onClick={saveTimeline} disabled={!selectedVersion || status === "loading"} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-void disabled:opacity-50">
                {status === "saved" ? <Check size={16} /> : <Save size={16} />} Save this timeline
              </button>
            </div>
          </div>

          {error && <div className="mb-5 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-rose-100">{error}</div>}
          {!versions.length && (
            <div className="glass rounded-3xl p-8 text-center text-slate-300">
              Your timeline field is empty. Generate your first set of parallel lives to see the split.
            </div>
          )}

          {!!versions.length && (
            <div className="space-y-6">
              <div className="glass rounded-3xl p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-bold">Life paths</h3>
                    <p className="text-sm text-slate-400">Show up to three paths. Select two for comparison or merge.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => togglePath(version.id)}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          activeVersions.some((item) => item.id === version.id)
                            ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-50"
                            : "border-white/10 bg-white/6 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {version.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {versions.map((version) => (
                    <label key={version.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-300">
                      <input type="checkbox" checked={mergeIds.includes(version.id)} onChange={() => toggleMerge(version.id)} className="accent-cyan-300" />
                      Merge: {version.title}
                    </label>
                  ))}
                </div>
              </div>

              <div className="glass overflow-hidden rounded-3xl p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Future branches</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Click any milestone to inspect the hidden personality data, life changes, and emotional state behind that year.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => setCompareYear(year)}
                        className={`rounded-full px-3 py-2 text-sm transition ${
                          compareYear === year ? "bg-white text-void" : "border border-white/10 bg-white/6 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 lg:space-y-10">
                  {activeVersions.map((version, pathIndex) => (
                    <TimelinePath
                      key={version.id}
                      version={version}
                      index={pathIndex}
                      selectedMilestone={selectedMilestone}
                      onSelect={(milestone) => {
                        setSelectedMilestone({ versionId: version.id, milestone });
                        setCompareYear(milestone.year);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <MilestoneDetails version={selectedVersion} milestone={selectedMilestone?.milestone ?? selectedVersion?.timeline[0]} />
                <YearComparison year={compareYear} versions={activeVersions} />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function TimelinePath({
  version,
  index,
  selectedMilestone,
  onSelect
}: {
  version: ParallelVersion;
  index: number;
  selectedMilestone: { versionId: string; milestone: LifeMilestone } | null;
  onSelect: (milestone: LifeMilestone) => void;
}) {
  return (
    <div className="relative">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className={`mb-2 h-1.5 w-24 rounded-full bg-gradient-to-r ${version.accent} shadow-lg ${version.glow}`} />
          <h4 className="text-xl font-black">{version.title}</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{version.summary}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          Path 0{index + 1}
        </span>
      </div>

      <div className="relative lg:px-2">
        <div className={`absolute left-4 top-0 h-full w-1 rounded-full bg-gradient-to-b ${version.accent} opacity-70 shadow-lg ${version.glow} lg:left-0 lg:top-16 lg:h-1 lg:w-full lg:bg-gradient-to-r`} />
        <div className="grid gap-4 pl-12 lg:grid-cols-5 lg:gap-3 lg:pl-0">
          {version.timeline.map((milestone, milestoneIndex) => {
            const isSelected = selectedMilestone?.versionId === version.id && selectedMilestone.milestone.year === milestone.year;
            return (
              <button
                key={`${version.id}-${milestone.year}`}
                onClick={() => onSelect(milestone)}
                className={`timeline-pop group relative rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${
                  isSelected ? "border-white/60 bg-white/15" : "border-white/10 bg-white/[0.07] hover:bg-white/[0.12]"
                }`}
                style={{ animationDelay: `${milestoneIndex * 80}ms` }}
              >
                <span className={`absolute -left-[2.65rem] top-5 h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br ${version.accent} shadow-lg ${version.glow} lg:left-1/2 lg:top-[-2.15rem] lg:-translate-x-1/2`} />
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-black text-white">{milestone.dateLabel}</span>
                  <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${categoryStyles[milestone.category]}`}>{milestone.category}</span>
                </div>
                <h5 className="min-h-12 font-bold leading-6 text-white">{milestone.title}</h5>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{milestone.description}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full bg-gradient-to-r ${version.accent}`} style={{ width: `${milestone.impactScore}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Impact {milestone.impactScore}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MilestoneDetails({ version, milestone }: { version?: ParallelVersion; milestone?: LifeMilestone }) {
  if (!version || !milestone) {
    return (
      <div className="glass rounded-3xl p-6 text-slate-300">
        Select a milestone to open its hidden timeline data.
      </div>
    );
  }

  return (
    <article className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">{version.title} / {milestone.dateLabel}</p>
          <h3 className="mt-2 text-2xl font-black">{milestone.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs uppercase ${categoryStyles[milestone.category]}`}>{milestone.category}</span>
      </div>
      <p className="leading-7 text-slate-300">{milestone.description}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Delta label="Emotional state" value={milestone.emotionalState} />
        <Delta label="Money" value={milestone.moneyChange} />
        <Delta label="Relationships" value={milestone.relationshipChange} />
        <Delta label="Health" value={milestone.healthChange} />
        <Delta label="Creativity" value={milestone.creativityChange} />
        <Delta label="Impact score" value={`${milestone.impactScore}/100`} />
      </div>

      <details className="mt-5 rounded-2xl border border-white/10 bg-white/6 p-4">
        <summary className="cursor-pointer font-bold text-white">Open full life profile</summary>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-300 md:grid-cols-2">
          <ProfileLine label="Traits" value={version.personalityTraits.join(", ")} />
          <ProfileLine label="Career" value={version.careerDirection} />
          <ProfileLine label="Money situation" value={version.moneySituation} />
          <ProfileLine label="Social life" value={version.socialLife} />
          <ProfileLine label="Mental state" value={version.mentalState} />
          <ProfileLine label="Achievement" value={version.biggestAchievement} />
          <ProfileLine label="Weakness" value={version.biggestWeakness} />
          <ProfileLine label="Quote" value={`"${version.quote}"`} />
        </div>
        <div className="mt-5">
          <StatBars scores={version.scores} compact />
        </div>
      </details>
    </article>
  );
}

function YearComparison({ year, versions }: { year: number | null; versions: ParallelVersion[] }) {
  const rows = versions
    .map((version) => ({ version, milestone: version.timeline.find((item) => item.year === year) }))
    .filter((row): row is { version: ParallelVersion; milestone: LifeMilestone } => Boolean(row.milestone));

  if (!year || !rows.length) {
    return (
      <div className="glass rounded-3xl p-6 text-slate-300">
        Choose a year to compare the same moment across timelines.
      </div>
    );
  }

  return (
    <aside className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <TrendingUp className="text-amber-200" />
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100">Same-year comparison</p>
          <h3 className="text-2xl font-black">{year}</h3>
        </div>
      </div>
      <div className="space-y-4">
        {rows.map(({ version, milestone }) => (
          <div key={version.id} className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="font-black">{version.title}</h4>
              <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${categoryStyles[milestone.category]}`}>{milestone.category}</span>
            </div>
            <p className="text-sm font-semibold text-white">{milestone.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{milestone.description}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <span><Heart className="mr-1 inline h-3 w-3 text-rose-200" /> {milestone.emotionalState}</span>
              <span>Impact {milestone.impactScore}/100</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
      <p className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
