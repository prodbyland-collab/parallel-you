import type { HiddenTraits, StoryMood } from "@/lib/story-types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createStoryAvatar(THREE: ThreeApi) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.06, 8, 18), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.22 }));
  body.position.y = 1.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.48 }));
  head.position.y = 1.9;
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.14, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  shoulders.position.y = 1.45;
  const aura = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.018, 10, 96), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 }));
  aura.position.y = 1.24;
  aura.rotation.x = Math.PI / 2;
  group.add(body, head, shoulders, aura);
  return { group, body, head, shoulders, aura };
}

export function updateStoryAvatar(THREE: ThreeApi, avatar: Record<string, ThreeObject>, traits: HiddenTraits, mood: StoryMood, color: string, elapsed: number) {
  const glow = new THREE.Color(color);
  const tired = mood === "tired" || mood === "lost" || traits.discipline < 35;
  const confident = mood === "breakthrough" || traits.consistency > 72;
  const posture = tired ? 0.18 : confident ? -0.08 : 0;
  const lift = mood === "breakthrough" ? Math.sin(elapsed * 4) * 0.1 + 0.08 : Math.sin(elapsed * 1.8) * 0.03;

  avatar.group.position.y = lift;
  avatar.body.rotation.z = posture;
  avatar.head.position.y = tired ? 1.8 : 1.9;
  avatar.head.position.x = tired ? 0.08 : 0;
  avatar.body.material.color.copy(glow).lerp(new THREE.Color(0x111827), confident ? 0.38 : 0.62);
  avatar.body.material.emissive.copy(glow);
  avatar.body.material.emissiveIntensity = traits.consistency / 190;
  avatar.shoulders.material.color.copy(glow).lerp(new THREE.Color(0x1e293b), 0.45);
  avatar.aura.material.color.copy(glow);
  avatar.aura.material.opacity = Math.max(0.16, (traits.creativity + traits.consistency) / 180);
  avatar.aura.scale.setScalar(0.78 + (traits.luck + traits.creativity) / 210 + Math.sin(elapsed * 2.1) * 0.025);
  avatar.aura.rotation.z = elapsed * (mood === "tense" ? 0.8 : 0.36);
}
