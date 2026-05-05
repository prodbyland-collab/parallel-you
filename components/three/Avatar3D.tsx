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
  const aura = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.012, 10, 96), new THREE.MeshBasicMaterial({ color: 0xe5e7eb, transparent: true, opacity: 0.08 }));
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
  const lift = Math.sin(elapsed * 1.2) * (tired ? 0.012 : 0.025);

  avatar.group.position.y = lift;
  avatar.body.rotation.z = posture;
  avatar.body.rotation.x = tired ? 0.05 : confident ? -0.025 : 0;
  avatar.head.position.y = tired ? 1.8 : 1.9;
  avatar.head.position.x = tired ? 0.06 : 0;
  avatar.head.rotation.y = Math.sin(elapsed * 0.6) * (mood === "tense" ? 0.08 : 0.035);
  avatar.body.material.color.copy(glow).lerp(new THREE.Color(0x111827), confident ? 0.72 : 0.86);
  avatar.body.material.emissive.copy(glow);
  avatar.body.material.emissiveIntensity = traits.consistency / 520;
  avatar.shoulders.rotation.z = tired ? 0.08 : confident ? -0.03 : 0;
  avatar.shoulders.position.y = tired ? 1.4 : confident ? 1.48 : 1.45;
  avatar.shoulders.material.color.copy(glow).lerp(new THREE.Color(0x1e293b), 0.78);
  avatar.aura.material.color.copy(new THREE.Color(0xe5e7eb));
  avatar.aura.material.opacity = 0.035 + Math.max(0, traits.consistency - 40) / 1800;
  avatar.aura.scale.setScalar(0.72 + Math.sin(elapsed * 1.1) * 0.01);
  avatar.aura.rotation.z = elapsed * 0.08;
}
