import type { HiddenTraits, StoryEnvironment } from "@/lib/story-types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function rebuildEnvironment(THREE: ThreeApi, group: ThreeObject, environment: StoryEnvironment, traits: HiddenTraits, color: string) {
  group.clear();
  const accent = new THREE.Color(color);
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2 + traits.consistency / 80, 3.8, 0.18, 96),
    new THREE.MeshStandardMaterial({ color: 0x070914, emissive: accent, emissiveIntensity: 0.06 + traits.discipline / 700, roughness: 0.35, metalness: 0.3 })
  );
  platform.position.y = -0.12;
  group.add(platform);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.07, side: THREE.DoubleSide }));
  back.position.set(0, 2.8, -3.6);
  group.add(back);

  if (environment === "bedroom") addBedroom(THREE, group, accent);
  if (environment === "studio") addStudio(THREE, group, accent, traits);
  if (environment === "city") addCity(THREE, group, accent, traits);
  if (environment === "sunrise") addSunrise(THREE, group, accent);
  if (environment === "void") addVoid(THREE, group, accent, traits);
  if (environment === "spotlight") addSpotlight(THREE, group, accent);
}

function addBedroom(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.13, 0.62), new THREE.MeshStandardMaterial({ color: 0x111827, emissive: color, emissiveIntensity: 0.08 }));
  desk.position.set(-1.85, 0.5, -1.2);
  const windowLight = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 }));
  windowLight.position.set(2, 1.7, -2.8);
  group.add(desk, windowLight);
}

function addStudio(THREE: ThreeApi, group: ThreeObject, color: ThreeObject, traits: HiddenTraits) {
  const count = 10 + Math.floor(traits.creativity / 8);
  for (let index = 0; index < count; index += 1) {
    const shape = new THREE.Mesh(new THREE.TorusGeometry(0.06 + (index % 3) * 0.02, 0.008, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }));
    shape.position.set(Math.sin(index * 1.7) * 3, 0.8 + (index % 6) * 0.34, -1.7 + Math.cos(index) * 0.8);
    group.add(shape);
  }
}

function addCity(THREE: ThreeApi, group: ThreeObject, color: ThreeObject, traits: HiddenTraits) {
  for (let index = 0; index < 12; index += 1) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8 + (index % 5) * 0.42 + traits.risk / 120, 0.38), new THREE.MeshStandardMaterial({ color: 0x05060d, emissive: color, emissiveIntensity: 0.14 }));
    tower.position.set(-4.4 + index * 0.8, tower.geometry.parameters.height / 2 - 0.12, -2.45);
    group.add(tower);
  }
}

function addSunrise(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.85, 48, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78 }));
  sun.position.set(2.4, 2.05, -2.9);
  group.add(sun);
}

function addVoid(THREE: ThreeApi, group: ThreeObject, color: ThreeObject, traits: HiddenTraits) {
  const ringCount = traits.consistency < 45 ? 4 : 2;
  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7 + index * 0.42, 0.018, 10, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 }));
    ring.position.set(0, 1.15, -1.8);
    ring.rotation.x = Math.PI / (2.5 + index * 0.2);
    ring.rotation.z = index * 0.6;
    group.add(ring);
  }
}

function addSpotlight(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.45, 4.4, 56, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.13, side: THREE.DoubleSide }));
  cone.position.set(0, 2.15, 0);
  cone.rotation.x = Math.PI;
  group.add(cone);
}
