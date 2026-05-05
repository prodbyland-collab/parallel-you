"use client";

import type { GameMilestone, LifePath, PathStats } from "@/lib/life-generator";

const statLabels: Array<[keyof PathStats, string]> = [
  ["money", "Wealth"],
  ["health", "Health"],
  ["happiness", "Happiness"],
  ["relationships", "Relationships"],
  ["creativity", "Creativity"],
  ["discipline", "Discipline"]
];

export function CinematicStats({ path, milestone }: { path: LifePath; milestone: GameMilestone }) {
  return (
    <div className="cinema-panel p-4">
      <p className="cinema-kicker">Character Stats</p>
      <div className="mt-4 space-y-3">
        {statLabels.map(([key, label]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>{label}</span>
              <span className={milestone.statsChange[key] >= 0 ? "text-emerald-200" : "text-rose-200"}>
                {path.stats[key]} XP ({milestone.statsChange[key] >= 0 ? "+" : ""}{milestone.statsChange[key]})
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${path.stats[key]}%`,
                  background: `linear-gradient(90deg, ${path.color}, rgba(255,255,255,0.9))`,
                  boxShadow: `0 0 18px ${path.color}`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-300">
        <p><b className="text-emerald-200">Best stat:</b> {formatStat(path.bestStat)}</p>
        <p><b className="text-rose-200">Weakest stat:</b> {formatStat(path.weakestStat)}</p>
        <p><b className="text-amber-200">Tradeoff:</b> {path.biggestTradeoff}</p>
      </div>
    </div>
  );
}

function formatStat(stat: keyof PathStats) {
  return stat === "relationships" ? "Relationships" : stat[0].toUpperCase() + stat.slice(1);
}
