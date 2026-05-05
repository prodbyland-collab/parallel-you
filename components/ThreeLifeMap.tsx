"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GameMilestone, LifePath, LifeSimulationResult } from "@/lib/life-generator";

type NodePayload = {
  path: LifePath;
  milestone: GameMilestone;
  position: THREE.Vector3;
};

type ThreeLifeMapProps = {
  result: LifeSimulationResult;
  selectedPath: LifePath;
  selectedNode: { pathId: string; milestone: GameMilestone } | null;
  onSelect: (path: LifePath, milestone: GameMilestone) => void;
};

const nodeGeometry = new THREE.SphereGeometry(0.28, 24, 24);
const majorNodeGeometry = new THREE.SphereGeometry(0.38, 28, 28);
const platformGeometry = new THREE.CylinderGeometry(1.45, 1.65, 0.28, 48);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export function ThreeLifeMap({ result, selectedPath, selectedNode, onSelect }: ThreeLifeMapProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshesRef = useRef<Array<THREE.Mesh & { userData: NodePayload }>>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const selectedNodeRef = useRef(selectedNode);
  const selectedPathRef = useRef(selectedPath);
  const [hoveredNode, setHoveredNode] = useState<{ payload: NodePayload; x: number; y: number } | null>(null);

  const layout = useMemo(() => buildLayout(result.paths), [result.paths]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    selectedPathRef.current = selectedPath;
    updateNodeSelection(nodeMeshesRef.current, selectedPath.id, selectedNode?.milestone.id);
  }, [selectedNode, selectedPath]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050712, 0.032);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 8.2, 11.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 5.5;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(4.4, 0, 0);
    controlsRef.current = controls;

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

    addParticles(scene);
    addOrigin(scene, result);
    addPaths(scene, layout);

    const onResize = () => {
      if (!mount || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mount.clientWidth / mount.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mount.clientWidth, mount.clientHeight);
    };

    const pickNode = (event: PointerEvent, mode: "click" | "hover") => {
      const rendererElement = renderer.domElement;
      const bounds = rendererElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(nodeMeshesRef.current, false);
      const hit = hits[0]?.object as (THREE.Mesh & { userData: NodePayload }) | undefined;
      rendererElement.style.cursor = hit ? "pointer" : "grab";
      if (mode === "hover") {
        setHoveredNode(hit ? { payload: hit.userData, x: event.clientX - bounds.left, y: event.clientY - bounds.top } : null);
      }
      if (mode === "click" && hit) {
        onSelect(hit.userData.path, hit.userData.milestone);
      }
    };

    const onPointerMove = (event: PointerEvent) => pickNode(event, "hover");
    const onPointerDown = () => {
      renderer.domElement.style.cursor = "grabbing";
    };
    const onPointerUp = (event: PointerEvent) => pickNode(event, "click");

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      controls.update();
      nodeMeshesRef.current.forEach((mesh, index) => {
        const selected = selectedNodeRef.current?.milestone.id === mesh.userData.milestone.id && selectedPathRef.current?.id === mesh.userData.path.id;
        const scale = selected ? 1.35 : 1 + Math.sin(elapsed * 2.2 + index) * 0.08;
        mesh.scale.setScalar(scale);
      });
      labelSpritesRef.current.forEach((sprite) => {
        sprite.material.opacity = 0.76 + Math.sin(elapsed * 1.6 + sprite.position.x) * 0.08;
      });
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      nodeMeshesRef.current = [];
      labelSpritesRef.current.forEach((sprite) => sprite.material.map?.dispose());
      labelSpritesRef.current = [];
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // The scene is intentionally rebuilt when the generated result/layout changes.
    // addPaths is scoped here because it writes to scene refs during that rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, onSelect, result]);

  const activeNode = hoveredNode?.payload.milestone;
  const selectedMilestone = selectedNode?.milestone;

  return (
    <section className="hud-panel relative min-h-[640px] overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/30">
      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
        3D Orbit Map / drag + zoom
      </div>
      <div ref={mountRef} className="three-life-map h-[640px] w-full" />
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

  function addOrigin(scene: THREE.Scene, currentResult: LifeSimulationResult) {
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x07111f,
      emissive: 0x0e7490,
      emissiveIntensity: 0.75,
      metalness: 0.55,
      roughness: 0.25
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0, 0);
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.035, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.18;
    scene.add(ring);

    const label = makeTextSprite(`YOU TODAY\n${currentResult.userSummary.name}, ${currentResult.userSummary.currentAge}`, "#e0faff", 30);
    label.position.set(0, 1.25, 0);
    label.scale.set(2.3, 0.95, 1);
    scene.add(label);
    labelSpritesRef.current.push(label);
  }

  function addPaths(scene: THREE.Scene, currentLayout: ReturnType<typeof buildLayout>) {
    nodeMeshesRef.current = [];
    currentLayout.forEach(({ path, color, points }) => {
      const linePoints = [new THREE.Vector3(0, 0.08, 0), ...points.map((point) => point.position)];
      const curve = new THREE.CatmullRomCurve3(linePoints, false, "catmullrom", 0.3);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 72, 0.035, 10, false),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: selectedPath.id === path.id ? 0.95 : 0.55 })
      );
      scene.add(tube);

      const pathLabel = makeTextSprite(`${path.title}\n${path.simpleMeaning}`, color.getStyle(), 24);
      const labelTarget = points[1]?.position ?? points[0]?.position;
      if (labelTarget) {
        pathLabel.position.copy(labelTarget).add(new THREE.Vector3(0, 0.65, 0.1));
        pathLabel.scale.set(2.5, 0.88, 1);
        scene.add(pathLabel);
        labelSpritesRef.current.push(pathLabel);
      }

      points.forEach(({ milestone, position }, index) => {
        const material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: selectedNode?.milestone.id === milestone.id && selectedPath.id === path.id ? 2.2 : 1.25,
          roughness: 0.22,
          metalness: 0.2
        });
        const mesh = new THREE.Mesh(
          milestone.badge === "HIGH REWARD" || milestone.badge === "RARE" ? majorNodeGeometry : nodeGeometry,
          material
        ) as unknown as THREE.Mesh & { userData: NodePayload };
        mesh.position.copy(position);
        mesh.userData = { path, milestone, position };
        scene.add(mesh);
        nodeMeshesRef.current.push(mesh);

        const yearLabel = makeTextSprite(String(milestone.year), "#f8fafc", 22);
        yearLabel.position.copy(position).add(new THREE.Vector3(0, -0.55, 0));
        yearLabel.scale.set(0.85, 0.34, 1);
        scene.add(yearLabel);
        labelSpritesRef.current.push(yearLabel);

        if (index === 0) {
          const bridge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, position.distanceTo(new THREE.Vector3(0, 0.08, 0)), 8),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
          );
          bridge.position.copy(position).multiplyScalar(0.5);
          scene.add(bridge);
        }
      });
    });
    updateNodeSelection(nodeMeshesRef.current, selectedPath.id, selectedNode?.milestone.id);
  }
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function buildLayout(paths: LifePath[]) {
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

function addParticles(scene: THREE.Scene) {
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 24;
    positions[index * 3 + 1] = Math.random() * 10 - 1;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.025, transparent: true, opacity: 0.55 });
  scene.add(new THREE.Points(geometry, material));
}

function makeTextSprite(text: string, color: string, fontSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
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
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
  return new THREE.Sprite(material);
}

function updateNodeSelection(meshes: Array<THREE.Mesh & { userData: NodePayload }>, pathId: string, milestoneId?: string) {
  meshes.forEach((mesh) => {
    const selected = mesh.userData.path.id === pathId && mesh.userData.milestone.id === milestoneId;
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = selected ? 2.4 : 1.2;
  });
}
