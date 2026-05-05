"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameMilestone, LifePath, LifeSimulationResult } from "@/lib/life-generator";
import { createStylizedAvatar, updateStylizedAvatar } from "@/components/results/Avatar3D";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeObject = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    THREE?: ThreeApi;
  }
}

const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";

type CinematicLifeSceneProps = {
  result: LifeSimulationResult;
  path: LifePath;
  milestone: GameMilestone;
  episodeIndex: number;
};

export function CinematicLifeScene({ result, path, milestone, episodeIndex }: CinematicLifeSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneStateRef = useRef({ path, milestone, episodeIndex });
  const [loadError, setLoadError] = useState("");

  const sceneKey = useMemo(() => `${path.id}:${milestone.id}`, [milestone.id, path.id]);

  useEffect(() => {
    sceneStateRef.current = { path, milestone, episodeIndex };
  }, [episodeIndex, milestone, path]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    loadThree()
      .then((THREE) => {
        if (disposed || !mountRef.current) return;
        cleanup = createCinematicScene(THREE, mountRef.current, result, sceneStateRef);
      })
      .catch(() => {
        if (!disposed) setLoadError("3D cinematic engine failed to load. Refresh once your network is available.");
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [result]);

  return (
    <section className="cinema-stage relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 md:min-h-[680px]">
      <div className="letterbox top-0" />
      <div className="letterbox bottom-0" />
      <div ref={mountRef} className="three-cinema-scene absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-12 z-10 px-5 md:px-9">
        <p className="cinema-kicker">Parallel You: Cinematic Mode</p>
        <h2 key={sceneKey} className="cinema-title mt-3 max-w-4xl text-4xl font-black leading-[0.95] text-white md:text-7xl">
          Episode {episodeIndex + 1}: {milestone.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
          {result.userSummary.name} / {path.title} / {milestone.year}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 mx-auto max-w-4xl px-5 text-center">
        <p key={`${sceneKey}-subtitle`} className="cinema-subtitle inline-block rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm leading-6 text-slate-100 shadow-glow backdrop-blur-xl md:text-base">
          {milestone.simpleResult}
        </p>
      </div>
      {loadError && (
        <div className="absolute inset-4 z-20 grid place-items-center rounded-3xl border border-rose-300/30 bg-rose-950/70 p-6 text-center text-rose-100">
          {loadError}
        </div>
      )}
    </section>
  );
}

function createCinematicScene(
  THREE: ThreeApi,
  mount: HTMLDivElement,
  result: LifeSimulationResult,
  sceneStateRef: React.MutableRefObject<{ path: LifePath; milestone: GameMilestone; episodeIndex: number }>
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050510, 0.055);

  const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const root = new THREE.Group();
  scene.add(root);

  const avatar = createStylizedAvatar(THREE);
  root.add(avatar.group);

  const environment = new THREE.Group();
  root.add(environment);

  const particles = createParticles(THREE);
  scene.add(particles);

  const ambient = new THREE.AmbientLight(0x8fbfff, 0.22);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xffffff, 5, 26, Math.PI / 5, 0.55, 1.3);
  key.position.set(-3, 7, 5);
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.PointLight(0xd946ef, 3.2, 20);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 4.2, 0.22, 96),
    new THREE.MeshStandardMaterial({ color: 0x080a16, emissive: 0x111827, roughness: 0.35, metalness: 0.35 })
  );
  floor.position.y = -0.1;
  root.add(floor);

  const clock = new THREE.Clock();
  let animationFrame = 0;

  const resize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };

  const renderScene = () => {
    const elapsed = clock.getElapsedTime();
    const { path, milestone, episodeIndex } = sceneStateRef.current;
    const color = new THREE.Color(milestone.avatarState.cinematicColor);
    const progress = episodeIndex / Math.max(1, path.milestones.length - 1);

    updateStylizedAvatar(THREE, avatar, milestone, elapsed);
    updateEnvironment(THREE, environment, milestone, result.userSummary.name);

    key.color.copy(color).lerp(new THREE.Color(0xffffff), 0.35);
    key.intensity = 3.5 + milestone.avatarState.auraIntensity / 24;
    key.position.set(-3 + Math.sin(elapsed * 0.25) * 0.8, 6.4, 4.5);
    key.target.position.set(0, 1.25, 0);
    rim.color.copy(color);
    rim.intensity = 1.4 + milestone.avatarState.auraIntensity / 40;

    floor.material.emissive = color;
    floor.material.emissiveIntensity = 0.08 + milestone.avatarState.auraIntensity / 450;

    particles.rotation.y = elapsed * 0.018;
    particles.position.y = Math.sin(elapsed * 0.22) * 0.15;

    const targetCamera = {
      x: -2.5 + progress * 1.6 + Math.sin(elapsed * 0.18) * 0.28,
      y: 2.0 + progress * 0.7,
      z: 7.2 - progress * 1.6
    };
    camera.position.lerp(new THREE.Vector3(targetCamera.x, targetCamera.y, targetCamera.z), 0.035);
    camera.lookAt(0, 1.1 + Math.sin(elapsed * 0.2) * 0.06, 0);

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(renderScene);
  };

  resize();
  camera.position.set(-3.2, 2.2, 7.6);
  renderScene();
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    scene.traverse((object: ThreeObject) => {
      if (object.isMesh || object.isPoints || object.isSprite) {
        object.geometry?.dispose?.();
        object.material?.map?.dispose?.();
        object.material?.dispose?.();
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
  };
}

function updateEnvironment(THREE: ThreeApi, group: ThreeObject, milestone: GameMilestone, userName: string) {
  if (group.userData.sceneId === milestone.id) return;
  group.clear();
  group.userData.sceneId = milestone.id;
  const color = new THREE.Color(milestone.avatarState.cinematicColor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 7),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
  );
  backWall.position.set(0, 2.7, -3.4);
  group.add(backWall);

  if (milestone.avatarState.sceneType === "bedroom") addBedroom(THREE, group, color);
  if (milestone.avatarState.sceneType === "studio") addStudio(THREE, group, color);
  if (milestone.avatarState.sceneType === "city") addCity(THREE, group, color);
  if (milestone.avatarState.sceneType === "sunrise") addSunrise(THREE, group, color);
  if (milestone.avatarState.sceneType === "spotlight") addSpotlight(THREE, group, color);
  if (milestone.avatarState.sceneType === "void") addVoid(THREE, group, color);

  const title = makeTextSprite(THREE, `${userName}\n${milestone.emotionalState}`, "#f8fafc", 30);
  title.position.set(0, 3.05, -2.7);
  title.scale.set(2.6, 0.95, 1);
  group.add(title);
}

function addBedroom(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.62), new THREE.MeshStandardMaterial({ color: 0x111827, emissive: color, emissiveIntensity: 0.08 }));
  desk.position.set(-1.9, 0.55, -1.2);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }));
  lamp.position.set(-2.3, 1.05, -1.2);
  group.add(desk, lamp);
}

function addStudio(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  for (let i = 0; i < 14; i += 1) {
    const note = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }));
    note.position.set(Math.sin(i) * 2.8, 0.9 + (i % 5) * 0.42, -1.8 + Math.cos(i * 1.7) * 0.8);
    group.add(note);
  }
}

function addCity(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  for (let i = 0; i < 11; i += 1) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9 + (i % 4) * 0.44, 0.42), new THREE.MeshStandardMaterial({ color: 0x09090b, emissive: color, emissiveIntensity: 0.16 }));
    tower.position.set(-4 + i * 0.8, tower.geometry.parameters.height / 2 - 0.12, -2.35);
    group.add(tower);
  }
}

function addSunrise(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.75, 48, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
  sun.position.set(2.5, 2.1, -2.8);
  group.add(sun);
}

function addSpotlight(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.2, 48, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
  cone.position.set(0, 2.2, 0);
  cone.rotation.x = Math.PI;
  group.add(cone);
}

function addVoid(THREE: ThreeApi, group: ThreeObject, color: ThreeObject) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.025, 12, 128), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
  ring.position.set(0, 1.2, -1.8);
  ring.rotation.x = Math.PI / 2.7;
  group.add(ring);
}

function createParticles(THREE: ThreeApi) {
  const particleCount = 700;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = Math.random() * 7 - 0.3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xdbeafe, size: 0.022, transparent: true, opacity: 0.5 }));
}

function makeTextSprite(THREE: ThreeApi, text: string, color: string, fontSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  if (context) {
    context.font = `900 ${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = color;
    context.shadowBlur = 18;
    context.fillStyle = color;
    text.split("\n").forEach((line, index, lines) => {
      context.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * (fontSize + 8));
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.86 }));
}

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise<ThreeApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${THREE_CDN}"]`);
    if (existing) {
      existing.addEventListener("load", () => window.THREE ? resolve(window.THREE) : reject(new Error("THREE missing")));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = THREE_CDN;
    script.async = true;
    script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error("THREE missing"));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
