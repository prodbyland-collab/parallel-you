"use client";

import type { GameMilestone, LifePath } from "@/lib/life-generator";

type TimelineStripProps = {
  paths: LifePath[];
  selectedPathId: string;
  selectedMilestoneId: string;
  onSelectPath: (path: LifePath) => void;
  onSelectMilestone: (path: LifePath, milestone: GameMilestone) => void;
};

export function TimelineStrip({ paths, selectedPathId, selectedMilestoneId, onSelectPath, onSelectMilestone }: TimelineStripProps) {
  return (
    <div className="cinema-panel p-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {paths.map((path) => (
          <div key={path.id} className="min-w-[260px] flex-1">
            <button
              onClick={() => onSelectPath(path)}
              className={`mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                selectedPathId === path.id ? "border-white/30 bg-white/12" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span>
                <b className="block text-sm text-white">{path.title}</b>
                <span className="text-xs text-slate-400">{path.simpleMeaning}</span>
              </span>
              <span className="h-3 w-3 rounded-full" style={{ background: path.color, boxShadow: `0 0 18px ${path.color}` }} />
            </button>
            <div className="flex gap-2">
              {path.milestones.map((milestone, index) => {
                const selected = path.id === selectedPathId && milestone.id === selectedMilestoneId;
                return (
                  <button
                    key={milestone.id}
                    onClick={() => onSelectMilestone(path, milestone)}
                    className={`group min-w-20 rounded-2xl border p-2 text-left transition hover:-translate-y-1 ${
                      selected ? "border-white/40 bg-white/15" : "border-white/10 bg-black/30 hover:bg-white/[0.08]"
                    }`}
                    style={{ boxShadow: selected ? `0 0 28px ${path.color}55` : undefined }}
                  >
                    <span className="block text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: path.color }}>E{index + 1}</span>
                    <span className="block text-sm font-black text-white">{milestone.year}</span>
                    <span className="block truncate text-xs text-slate-400">{milestone.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
