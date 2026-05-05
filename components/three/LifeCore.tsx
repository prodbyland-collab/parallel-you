import type { HiddenTraits } from "@/lib/story-types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createLifeCore(THREE: ThreeApi) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.95 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  group.position.set(0.72, 1.62, 0.06);
  group.add(core, ring);
  return { group, core, ring };
}

export function updateLifeCore(THREE: ThreeApi, lifeCore: Record<string, ThreeObject>, traits: HiddenTraits, baseColor: string, elapsed: number) {
  const stability = (traits.discipline + traits.consistency) / 2;
  const brightness = (traits.creativity + traits.luck + stability) / 300;
  const flicker = stability < 42 ? Math.sin(elapsed * 22) * 0.08 : Math.sin(elapsed * 3) * 0.025;
  const scale = 0.85 + brightness + flicker;
  const color = new THREE.Color(baseColor).lerp(new THREE.Color(0xffffff), traits.luck / 180);

  lifeCore.group.scale.setScalar(scale);
  lifeCore.group.position.x = 0.72 + Math.sin(elapsed * 1.2) * 0.035;
  lifeCore.core.material.color.copy(color);
  lifeCore.core.material.opacity = Math.max(0.42, 0.7 + brightness + flicker);
  lifeCore.ring.material.color.copy(color);
  lifeCore.ring.rotation.z = elapsed * (0.4 + traits.risk / 110);
  lifeCore.ring.material.opacity = Math.max(0.18, stability / 120);
}
