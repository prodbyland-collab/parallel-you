import type { HiddenTraits, StoryMood } from "@/lib/story-types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function updateCameraRig(THREE: ThreeApi, camera: ThreeObject, traits: HiddenTraits, mood: StoryMood, elapsed: number) {
  const tension = mood === "tense" ? 0.5 : 0;
  const riskMotion = traits.risk / 260 + tension;
  const target = new THREE.Vector3(0, mood === "lost" ? 1.0 : 1.25, 0);
  const desired = new THREE.Vector3(
    -2.6 + Math.sin(elapsed * (0.12 + riskMotion)) * (0.25 + riskMotion * 0.25),
    2.05 + traits.discipline / 160 + Math.sin(elapsed * 0.18) * 0.05,
    mood === "breakthrough" ? 5.7 : 6.7 - traits.consistency / 140
  );
  camera.position.lerp(desired, 0.035);
  camera.lookAt(target);
}
