"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Dices, Loader2, RefreshCcw, Save, Sparkles, Split, Zap } from "lucide-react";
import { generateParallelLives, mergeParallelLives, type OnboardingInput, type ParallelVersion } from "@/lib/life-generator";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { RadarChart } from "@/components/RadarChart";
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

export function ParallelYouApp() {
  const [input, setInput] = useState<OnboardingInput>(initialInput);
  const [versions, setVersions] = useState<ParallelVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedId) ?? versions[0],
    [selectedId, versions]
  );

  const updateInput = (key: keyof OnboardingInput, value: string | number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const generate = () => {
    setStatus("loading");
    setError("");
    window.setTimeout(() => {
      const generated = generateParallelLives(input);
      setVersions(generated);
      setSelectedId(generated[0].id);
      setMergeIds([]);
      setStatus("idle");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 650);
  };

  const toggleMerge = (id: string) => {
    setMergeIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current.slice(-1), id];
    });
  };

  const mergeTimelines = () => {
    if (mergeIds.length !== 2) {
      setError("Select two timelines to merge.");
      return;
    }
    const first = versions.find((version) => version.id === mergeIds[0]);
    const second = versions.find((version) => version.id === mergeIds[1]);
    if (!first || !second) return;
    const merged = mergeParallelLives(first, second);
    setVersions((current) => [merged, ...current.filter((version) => version.id !== merged.id)]);
    setSelectedId(merged.id);
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
              Answer a few personal questions and Parallel You generates five alternate versions of your life: the focused one,
              the reckless one, the creative one, the lucky one, and the real one you can still shape.
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
                Deterministic, personal, instant
              </div>
            </div>
          </div>

          <div className="glass animate-float rounded-[2rem] p-4 shadow-glow">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-white/14 to-white/5 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Simulator preview</p>
                  <h2 className="text-2xl font-bold">5-year echo map</h2>
                </div>
                <Dices className="text-cyan-200" />
              </div>
              <div className="space-y-3">
                {["Disciplined You", "Risk-Taking You", "Creative You", "Lucky You"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{item}</span>
                      <span className="text-sm text-slate-400">Universe 0{index + 2}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400" style={{ width: `${64 + index * 8}%` }} />
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
              The generator uses editable templates in one file, so the app stays easy to manage while still feeling personal.
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
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-200">Results dashboard</p>
              <h2 className="text-3xl font-black sm:text-4xl">Your parallel lives</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={mergeTimelines} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">
                <Split size={16} /> Merge timelines
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
              Your dashboard is empty. Generate your first set of parallel lives to compare them here.
            </div>
          )}

          {!!versions.length && selectedVersion && (
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-4">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedId(version.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      selectedVersion.id === version.id ? "border-cyan-300/70 bg-white/14" : "border-white/10 bg-white/6 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{version.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{version.shortStory}</p>
                      </div>
                      <span className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${version.accent}`} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-300" onClick={(event) => event.stopPropagation()}>
                        <input type="checkbox" checked={mergeIds.includes(version.id)} onChange={() => toggleMerge(version.id)} className="accent-cyan-300" />
                        Select to merge
                      </label>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{version.archetype}</span>
                    </div>
                  </button>
                ))}
              </div>

              <article className="glass rounded-3xl p-5 sm:p-7">
                <div className={`mb-6 rounded-3xl bg-gradient-to-br ${selectedVersion.accent} p-px`}>
                  <div className="rounded-3xl bg-void/90 p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-3xl font-black">{selectedVersion.title}</h3>
                        <p className="mt-3 max-w-2xl leading-7 text-slate-300">{selectedVersion.shortStory}</p>
                      </div>
                      <RadarChart scores={selectedVersion.scores} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Info title="Career direction" value={selectedVersion.careerDirection} />
                  <Info title="Money situation" value={selectedVersion.moneySituation} />
                  <Info title="Social life" value={selectedVersion.socialLife} />
                  <Info title="Mental state" value={selectedVersion.mentalState} />
                  <Info title="Biggest achievement" value={selectedVersion.biggestAchievement} />
                  <Info title="Biggest weakness" value={selectedVersion.biggestWeakness} />
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/8 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Quote</p>
                  <blockquote className="mt-2 text-2xl font-black leading-tight text-white">&ldquo;{selectedVersion.quote}&rdquo;</blockquote>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-bold">5-year timeline</h4>
                    <ol className="space-y-3">
                      {selectedVersion.timeline.map((item) => (
                        <li key={item} className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm leading-6 text-slate-300">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4 className="mb-3 font-bold">Score comparison</h4>
                    <StatBars scores={selectedVersion.scores} />
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedVersion.personalityTraits.map((trait) => (
                        <span key={trait} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-slate-200">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="leading-6 text-slate-200">{value}</p>
    </div>
  );
}
