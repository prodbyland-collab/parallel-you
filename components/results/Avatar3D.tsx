import type { GameMilestone } from "@/lib/life-generator";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createStylizedAvatar(THREE: ThreeApi) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.05, 8, 18), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25, metalness: 0.25 }));
  body.position.y = 1.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshStandardMaterial({ color: 0xdbeafe, emissive: 0x172554, roughness: 0.45 }));
  head.position.y = 1.9;
  const aura = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.018, 10, 96), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.72 }));
  aura.position.y = 1.25;
  aura.rotation.x = Math.PI / 2;
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x0f172a }));
  shoulder.position.y = 1.48;
  group.add(body, head, aura, shoulder);
  return { group, body, head, aura, shoulder };
}

export function updateStylizedAvatar(THREE: ThreeApi, avatar: Record<string, ThreeObject>, milestone: GameMilestone, elapsed: number) {
  const state = milestone.avatarState;
  const color = new THREE.Color(state.cinematicColor);
  const breath = Math.sin(elapsed * 2) * 0.035;
  const postureTilt = state.posture === "slouched" ? 0.18 : state.posture === "strong" ? -0.08 : state.posture === "walking" ? Math.sin(elapsed * 3) * 0.08 : 0;
  const celebrationLift = state.posture === "celebrating" ? Math.sin(elapsed * 4) * 0.12 + 0.12 : 0;

  avatar.group.position.y = breath + celebrationLift;
  avatar.body.rotation.z = postureTilt;
  avatar.head.position.x = state.posture === "slouched" ? 0.08 : 0;
  avatar.head.position.y = state.posture === "slouched" ? 1.82 : 1.9;
  avatar.body.material.color.copy(color).lerp(new THREE.Color(0x111827), 0.55 - state.outfitLevel * 0.06);
  avatar.body.material.emissive.copy(color);
  avatar.body.material.emissiveIntensity = state.auraIntensity / 180;
  avatar.shoulder.material.color.copy(color).lerp(new THREE.Color(0x1e293b), 0.38);
  avatar.aura.material.color.copy(color);
  avatar.aura.material.opacity = 0.18 + state.auraIntensity / 130;
  avatar.aura.scale.setScalar(0.8 + state.auraIntensity / 160 + Math.sin(elapsed * 1.7) * 0.03);
  avatar.aura.rotation.z = elapsed * (state.mood === "breakthrough" ? 0.9 : 0.35);
}
