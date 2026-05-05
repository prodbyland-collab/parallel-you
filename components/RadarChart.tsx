import type { LifeScores } from "@/lib/life-generator";

const axes: Array<keyof LifeScores> = ["happiness", "money", "health", "relationships", "creativity"];

export function RadarChart({ scores }: { scores: LifeScores }) {
  const center = 72;
  const radius = 56;
  const points = axes
    .map((axis, index) => {
      const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
      const valueRadius = (scores[axis] / 100) * radius;
      return `${center + Math.cos(angle) * valueRadius},${center + Math.sin(angle) * valueRadius}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 144 144" className="h-36 w-36 shrink-0 overflow-visible">
      {[0.35, 0.7, 1].map((scale) => (
        <polygon
          key={scale}
          points={axes
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
              return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
        />
      ))}
      {axes.map((axis, index) => {
        const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
        return (
          <line
            key={axis}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * radius}
            y2={center + Math.sin(angle) * radius}
            stroke="rgba(255,255,255,0.12)"
          />
        );
      })}
      <polygon points={points} fill="rgba(34,211,238,0.28)" stroke="rgb(34,211,238)" strokeWidth="2" />
      <circle cx={center} cy={center} r="2" fill="white" />
    </svg>
  );
}
