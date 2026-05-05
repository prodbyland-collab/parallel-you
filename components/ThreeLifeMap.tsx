"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameMilestone, LifePath, LifeSimulationResult } from "@/lib/life-generator";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ThreeApi = any;
type ThreeVector = any;
type ThreeMesh = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type NodePayload = {
  path: LifePath;
  milestone: GameMilestone;
  position: ThreeVector;
};

type ThreeLifeMapProps = {
  result: LifeSimulationResult;
  selectedPath: LifePath;
  selectedNode: { pathId: string; milestone: GameMilestone } | null;
  onSelect: (path: LifePath, milestone: GameMilestone) => void;
};

declare global {
  interface Window {
    THREE?: ThreeApi;
  }
}

const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";

export function ThreeLifeMap({ result, selectedPath, selectedNode, onSelect }: ThreeLifeMapProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const nodeMeshesRef = useRef<Array<ThreeMesh & { userData: NodePayload }>>([]);
  const selectedNodeRef = useRef(selectedNode);
  const selectedPathRef = useRef(selectedPath);
  const [hoveredNode, setHoveredNode] = useState<{ payload: NodePayload; x: number; y: number } | null>(null);
  const [loadError, setLoadError] = useState("");

  const layoutSeed = useMemo(() => result.paths.map((path) => `${path.id}:${path.milestones.length}`).join("|"), [result.paths]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    selectedPathRef.current = selectedPath;
    updateNodeSelection(nodeMeshesRef.current, selectedPath.id, selectedNode?.milestone.id);
  }, [selectedNode, selectedPath]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    loadThree()
      .then((THREE) => {
        if (disposed || !mountRef.current) return;
        cleanup = createScene({
          THREE,
          mount: mountRef.current,
          result,
          selectedPath,
          selectedNode,
          nodeMeshesRef,
          selectedNodeRef,
          selectedPathRef,
          onSelect,
          onHover: setHoveredNode
        });
      })
      .catch(() => {
        if (!disposed) setLoadError("3D engine failed to load. Check your network connection and refresh.");
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [layoutSeed, onSelect, result, selectedNode, selectedPath]);

  const activeNode = hoveredNode?.payload.milestone;
  const selectedMilestone = selectedNode?.milestone;

  return (
    <section className="hud-panel relative min-h-[640px] overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/30">
      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
        3D Orbit Map / drag + zoom
      </div>
      <div ref={mountRef} className="three-life-map h-[640px] w-full" />
      {loadError && (
        <div className="absolute inset-4 grid place-items-center rounded-3xl border border-rose-300/30 bg-rose-950/60 p-6 text-center text-rose-100">
          {loadError}
        </div>
      )}
      {selectedMilestone && (
        <div className="event-pop absolute bottom-4 left-4 z-20 max-w-sm rounded-3xl border border-cyan-300/30 bg-black/80 p-4 shadow-cyan backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Floating Event Panel</p>
          <h3 className="mt-2 text-xl font-black text-white">{selectedMilestone.year}: {selectedMilestone.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{selectedMilestone.simpleResult}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <span>Money {signed(selectedMilestone.statsChange.money)}</span>
            <span>Health {signed(selectedMilestone.statsChange.health)}</span>
            <span>Happy {signed(selectedMilestone.statsChange.happiness)}</span>
            <span>Create {signed(selectedMilestone.statsChange.creativity)}</span>
          </div>
        </div>
      )}
      {activeNode && hoveredNode && (
        <div
          className="pointer-events-none absolute z-30 max-w-xs rounded-2xl border border-white/15 bg-black/90 p-3 text-sm shadow-glow"
          style={{ left: `min(${hoveredNode.x + 12}px, calc(100% - 18rem))`, top: `${Math.max(64, hoveredNode.y - 24)}px` }}
        >
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: hoveredNode.payload.path.color }}>{hoveredNode.payload.path.title}</p>
          <p className="mt-1 font-black text-white">{activeNode.year}: {activeNode.title}</p>
          <p className="mt-1 text-slate-400">{activeNode.simpleResult}</p>
        </div>
      )}
    </section>
  );
}

function createScene({
  THREE,
  mount,
  result,
  selectedPath,
  selectedNode,
  nodeMeshesRef,
  selectedNodeRef,
  selectedPathRef,
  onSelect,
  onHover
}: {
  THREE: ThreeApi;
  mount: HTMLDivElement;
  result: LifeSimulationResult;
  selectedPath: LifePath;
  selectedNode: { pathId: string; milestone: GameMilestone } | null;
  nodeMeshesRef: React.MutableRefObject<Array<ThreeMesh & { userData: NodePayload }>>;
  selectedNodeRef: React.MutableRefObject<{ pathId: string; milestone: GameMilestone } | null>;
  selectedPathRef: React.MutableRefObject<LifePath>;
  onSelect: (path: LifePath, milestone: GameMilestone) => void;
  onHover: (node: { payload: NodePayload; x: number; y: number } | null) => void;
}) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050712, 0.032);

  const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 120);
  const orbit = { theta: 0.02, phi: 0.88, radius: 12.5, target: new THREE.Vector3(4.2, 0, 0) };
  updateCamera(THREE, camera, orbit);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x9fdcff, 0.45));
  const keyLight = new THREE.PointLight(0x22d3ee, 2.8, 18);
  keyLight.position.set(-2, 5, 3);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xd946ef, 2.2, 16);
  rimLight.position.set(7, 4, -5);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(18, 28, 0x164e63, 0x172554);
  grid.position.y = -0.16;
  scene.add(grid);

  const nodeGeometry = new THREE.SphereGeometry(0.28, 24, 24);
  const majorNodeGeometry = new THREE.SphereGeometry(0.38, 28, 28);
  const platformGeometry = new THREE.CylinderGeometry(1.45, 1.65, 0.28, 48);
  const labelSprites: ThreeMesh[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  addParticles(THREE, scene);
  addOrigin(THREE, scene, result, platformGeometry, labelSprites);
  addPaths(THREE, scene, result.paths, selectedPath, selectedNode, nodeMeshesRef, nodeGeometry, majorNodeGeometry, labelSprites);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const onResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };

  const pickNode = (event: PointerEvent, shouldSelect: boolean) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodeMeshesRef.current, false);
    const hit = hits[0]?.object as (ThreeMesh & { userData: NodePayload }) | undefined;
    renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    onHover(hit ? { payload: hit.userData, x: event.clientX - bounds.left, y: event.clientY - bounds.top } : null);
    if (shouldSelect && hit) onSelect(hit.userData.path, hit.userData.milestone);
  };

  const onPointerDown = (event: PointerEvent) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    renderer.domElement.style.cursor = "grabbing";
  };

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      orbit.theta -= dx * 0.006;
      orbit.phi = Math.max(0.35, Math.min(1.25, orbit.phi + dy * 0.004));
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera(THREE, camera, orbit);
    } else {
      pickNode(event, false);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    const moved = Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY);
    dragging = false;
    pickNode(event, moved < 6);
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    orbit.radius = Math.max(5.5, Math.min(22, orbit.radius + event.deltaY * 0.01));
    updateCamera(THREE, camera, orbit);
  };

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  let frame = 0;
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    nodeMeshesRef.current.forEach((mesh, index) => {
      const selected = selectedNodeRef.current?.milestone.id === mesh.userData.milestone.id && selectedPathRef.current?.id === mesh.userData.path.id;
      const scale = selected ? 1.35 : 1 + Math.sin(elapsed * 2.2 + index) * 0.08;
      mesh.scale.setScalar(scale);
    });
    labelSprites.forEach((sprite) => {
      sprite.material.opacity = 0.76 + Math.sin(elapsed * 1.6 + sprite.position.x) * 0.08;
    });
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  animate();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("wheel", onWheel);
    labelSprites.forEach((sprite) => sprite.material.map?.dispose());
    nodeMeshesRef.current = [];
    scene.traverse((object: ThreeMesh) => {
      if (object.isMesh) {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material: ThreeMesh) => material.dispose?.());
        else object.material?.dispose?.();
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
  };
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

function updateCamera(THREE: ThreeApi, camera: ThreeMesh, orbit: { theta: number; phi: number; radius: number; target: ThreeVector }) {
  const x = orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
  const y = orbit.target.y + orbit.radius * Math.cos(orbit.phi);
  const z = orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
  camera.position.set(x, y, z);
  camera.lookAt(orbit.target);
}

function addOrigin(THREE: ThreeApi, scene: ThreeMesh, result: LifeSimulationResult, platformGeometry: ThreeMesh, labelSprites: ThreeMesh[]) {
  const platform = new THREE.Mesh(
    platformGeometry,
    new THREE.MeshStandardMaterial({ color: 0x07111f, emissive: 0x0e7490, emissiveIntensity: 0.75, metalness: 0.55, roughness: 0.25 })
  );
  scene.add(platform);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.82, 0.035, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  scene.add(ring);

  const label = makeTextSprite(THREE, `YOU TODAY\n${result.userSummary.name}, ${result.userSummary.currentAge}`, "#e0faff", 30);
  label.position.set(0, 1.25, 0);
  label.scale.set(2.3, 0.95, 1);
  scene.add(label);
  labelSprites.push(label);
}

function addPaths(
  THREE: ThreeApi,
  scene: ThreeMesh,
  paths: LifePath[],
  selectedPath: LifePath,
  selectedNode: { pathId: string; milestone: GameMilestone } | null,
  nodeMeshesRef: React.MutableRefObject<Array<ThreeMesh & { userData: NodePayload }>>,
  nodeGeometry: ThreeMesh,
  majorNodeGeometry: ThreeMesh,
  labelSprites: ThreeMesh[]
) {
  const layout = buildLayout(THREE, paths);
  nodeMeshesRef.current = [];
  layout.forEach(({ path, color, points }: { path: LifePath; color: ThreeMesh; points: Array<{ milestone: GameMilestone; position: ThreeVector }> }) => {
    const linePoints = [new THREE.Vector3(0, 0.08, 0), ...points.map((point) => point.position)];
    const curve = new THREE.CatmullRomCurve3(linePoints, false, "catmullrom", 0.3);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 72, 0.035, 10, false),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: selectedPath.id === path.id ? 0.95 : 0.55 })
    );
    scene.add(tube);

    const pathLabel = makeTextSprite(THREE, `${path.title}\n${path.simpleMeaning}`, color.getStyle(), 24);
    const labelTarget = points[1]?.position ?? points[0]?.position;
    if (labelTarget) {
      pathLabel.position.copy(labelTarget).add(new THREE.Vector3(0, 0.65, 0.1));
      pathLabel.scale.set(2.5, 0.88, 1);
      scene.add(pathLabel);
      labelSprites.push(pathLabel);
    }

    points.forEach(({ milestone, position }) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: selectedNode?.milestone.id === milestone.id && selectedPath.id === path.id ? 2.2 : 1.25,
        roughness: 0.22,
        metalness: 0.2
      });
      const mesh = new THREE.Mesh(milestone.badge === "HIGH REWARD" || milestone.badge === "RARE" ? majorNodeGeometry : nodeGeometry, material) as ThreeMesh & { userData: NodePayload };
      mesh.position.copy(position);
      mesh.userData = { path, milestone, position };
      scene.add(mesh);
      nodeMeshesRef.current.push(mesh);

      const yearLabel = makeTextSprite(THREE, String(milestone.year), "#f8fafc", 22);
      yearLabel.position.copy(position).add(new THREE.Vector3(0, -0.55, 0));
      yearLabel.scale.set(0.85, 0.34, 1);
      scene.add(yearLabel);
      labelSprites.push(yearLabel);
    });
  });
  updateNodeSelection(nodeMeshesRef.current, selectedPath.id, selectedNode?.milestone.id);
}

function buildLayout(THREE: ThreeApi, paths: LifePath[]) {
  return paths.map((path, pathIndex) => {
    const color = new THREE.Color(path.color);
    const offset = (pathIndex - (paths.length - 1) / 2) * 1.55;
    const points = path.milestones.map((milestone, index) => ({
      milestone,
      position: new THREE.Vector3(2.15 + index * 1.65, 0.38 + Math.sin(index * 0.9 + pathIndex) * 0.28, offset + Math.sin(index + pathIndex * 0.8) * 0.45)
    }));
    return { path, color, points };
  });
}

function addParticles(THREE: ThreeApi, scene: ThreeMesh) {
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 24;
    positions[index * 3 + 1] = Math.random() * 10 - 1;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.025, transparent: true, opacity: 0.55 })));
}

function makeTextSprite(THREE: ThreeApi, text: string, color: string, fontSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (context) {
    context.font = `900 ${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = color;
    context.shadowBlur = 16;
    context.fillStyle = color;
    text.split("\n").forEach((line, index, lines) => {
      context.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * (fontSize + 8));
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 }));
}

function updateNodeSelection(meshes: Array<ThreeMesh & { userData: NodePayload }>, pathId: string, milestoneId?: string) {
  meshes.forEach((mesh) => {
    const selected = mesh.userData.path.id === pathId && mesh.userData.milestone.id === milestoneId;
    mesh.material.emissiveIntensity = selected ? 2.4 : 1.2;
  });
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}
