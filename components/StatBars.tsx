import type { LifeScores } from "@/lib/life-generator";

const labels: Array<[keyof LifeScores, string]> = [
  ["happiness", "Happiness"],
  ["money", "Money"],
  ["health", "Health"],
  ["relationships", "Relationships"],
  ["creativity", "Creativity"]
];

export function StatBars({ scores, compact = false }: { scores: LifeScores; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {labels.map(([key, label]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
            <span>{label}</span>
            <span>{scores[key]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300"
              style={{ width: `${scores[key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
