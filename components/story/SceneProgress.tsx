import type { StoryScene } from "@/lib/story-types";

export function SceneProgress({ scene, index, total }: { scene: StoryScene; index: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
      <span>Act {scene.act}</span>
      <span className="h-1 w-1 rounded-full bg-cyan-200" />
      <span>Scene {Math.min(index + 1, total)} / {total}</span>
    </div>
  );
}
