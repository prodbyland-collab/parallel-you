"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createStoryAvatar, updateStoryAvatar } from "@/components/three/Avatar3D";
import { createLifeCore, updateLifeCore } from "@/components/three/LifeCore";
import { rebuildEnvironment } from "@/components/three/CinematicEnvironment";
import { updateCameraRig } from "@/components/three/CameraRig";
import type { HiddenTraits, StoryScene } from "@/lib/story-types";

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

const sceneColors: Record<StoryScene["environment"], string> = {
  bedroom: "#93a4b8",
  studio: "#c9a6b8",
  city: "#d6a06d",
  sunrise: "#e8c979",
  void: "#8b93a6",
  spotlight: "#e5e7eb"
};

const sceneBackdropClasses: Record<StoryScene["environment"], string> = {
  bedroom: "story-backdrop story-backdrop-bedroom",
  studio: "story-backdrop story-backdrop-studio",
  city: "story-backdrop story-backdrop-city",
  sunrise: "story-backdrop story-backdrop-sunrise",
  void: "story-backdrop story-backdrop-void",
  spotlight: "story-backdrop story-backdrop-spotlight"
};

export function CinematicStoryScene({ scene, traits }: { scene: StoryScene; traits: HiddenTraits }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ scene, traits });
  const [error, setError] = useState("");
  const sceneKey = useMemo(() => `${scene.id}:${scene.environment}:${scene.mood}`, [scene.environment, scene.id, scene.mood]);

  useEffect(() => {
    stateRef.current = { scene, traits };
  }, [scene, traits]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    loadThree()
      .then((THREE) => {
        if (disposed || !mountRef.current) return;
        cleanup = createScene(THREE, mountRef.current, stateRef);
      })
      .catch(() => {
        if (!disposed) setError("The cinematic engine could not load. Refresh once your connection is stable.");
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div key={sceneKey} className="absolute inset-0">
      <div className={sceneBackdropClasses[scene.environment]}>
        <span className="story-silhouette story-silhouette-left" />
        <span className="story-silhouette story-silhouette-right" />
        <AmbientLifeDetails scene={scene} />
      </div>
      <div ref={mountRef} className="three-cinema-scene absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_42%,transparent,rgba(0,0,0,0.58)_76%)]" />
      {error && <div className="absolute inset-6 grid place-items-center rounded-3xl border border-rose-300/30 bg-rose-950/70 p-6 text-center text-rose-100">{error}</div>}
    </div>
  );
}

function AmbientLifeDetails({ scene }: { scene: StoryScene }) {
  const sceneClass = `ambient-life ambient-${scene.environment} ambient-${scene.id}`;
  return (
    <div className={sceneClass} aria-hidden="true">
      <span className="ambient-window" />
      <span className="ambient-curtain" />
      <span className="ambient-phone" />
      <span className="ambient-message" />
      <span className="ambient-clock" />
      <span className="ambient-laptop" />
      <span className="ambient-steam" />
      <span className="ambient-notebook" />
      <span className="ambient-rain" />
      <span className="ambient-streetlight" />
      <span className="ambient-calendar" />
      <span className="ambient-waveform" />
      <span className="ambient-dust" />
    </div>
  );
}

function createScene(
  THREE: ThreeApi,
  mount: HTMLDivElement,
  stateRef: React.MutableRefObject<{ scene: StoryScene; traits: HiddenTraits }>
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03040a, 0.055);
  const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(-2.8, 2.4, 7.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const root = new THREE.Group();
  const environment = new THREE.Group();
  const avatar = createStoryAvatar(THREE);
  const lifeCore = createLifeCore(THREE);
  root.add(environment, avatar.group, lifeCore.group);
  scene.add(root);

  const particles = createParticles(THREE);
  scene.add(particles);

  const ambient = new THREE.AmbientLight(0x8fbfff, 0.22);
  const key = new THREE.SpotLight(0xffffff, 4.8, 26, Math.PI / 5, 0.5, 1.3);
  key.position.set(-3, 7, 5);
  const rim = new THREE.PointLight(0xd946ef, 2.5, 20);
  rim.position.set(4, 3, -4);
  scene.add(ambient, key, key.target, rim);

  let lastEnvironment = "";
  const clock = new THREE.Clock();
  let frame = 0;

  const onResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    const current = stateRef.current;
    const color = sceneColors[current.scene.environment];
    if (lastEnvironment !== `${current.scene.id}:${current.scene.environment}`) {
      rebuildEnvironment(THREE, environment, current.scene.environment, current.traits, color);
      lastEnvironment = `${current.scene.id}:${current.scene.environment}`;
    }
    const accent = new THREE.Color(color);
    updateStoryAvatar(THREE, avatar, current.traits, current.scene.mood, color, elapsed);
    updateLifeCore(THREE, lifeCore, current.traits, color, elapsed);
    updateCameraRig(THREE, camera, current.traits, current.scene.mood, elapsed);
    key.color.copy(accent).lerp(new THREE.Color(0xffffff), 0.32);
    key.intensity = 3.2 + current.traits.luck / 34;
    key.target.position.set(0, 1.2, 0);
    rim.color.copy(accent);
    rim.intensity = 1.3 + current.traits.creativity / 42;
    particles.rotation.y = elapsed * 0.018;
    particles.material.opacity = Math.min(0.75, 0.25 + current.traits.creativity / 140);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };

  window.addEventListener("resize", onResize);
  animate();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
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

function createParticles(THREE: ThreeApi) {
  const particleCount = 650;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 14;
    positions[index * 3 + 1] = Math.random() * 7 - 0.4;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xdbeafe, size: 0.022, transparent: true, opacity: 0.45 }));
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
