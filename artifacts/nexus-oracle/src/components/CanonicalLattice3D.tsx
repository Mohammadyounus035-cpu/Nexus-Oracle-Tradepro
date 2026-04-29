import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import WebGLGuard from "./WebGLGuard";
import { useLatticeEngine } from "../lib/useLatticeEngine";
import type { CanonicalState, NodeStatus } from "../lib/latticeEngine";

const STATUS_COLOR: Record<NodeStatus, string> = {
  active: "#00d4ff",
  staged: "#ffaa00",
  monitor: "#00ffaa",
  sealed: "#ff00aa",
};

function nodePositions(state: CanonicalState): Record<string, THREE.Vector3> {
  const ids = Object.keys(state.nodes).sort();
  const n = ids.length;
  const radius = 6;
  const phi = Math.PI * (3 - Math.sqrt(5));
  const out: Record<string, THREE.Vector3> = {};
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    out[ids[i]] = new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius);
  }
  return out;
}

function LatticeGraph({ thread }: { thread: string[] }) {
  const engine = useLatticeEngine();
  const groupRef = useRef<THREE.Group>(null);
  const state = engine.getState();
  const positions = useMemo(() => nodePositions(state), [Object.keys(state.nodes).length]);
  const threadSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < thread.length - 1; i++) {
      s.add(`${thread[i]}|${thread[i + 1]}`);
      s.add(`${thread[i + 1]}|${thread[i]}`);
    }
    return s;
  }, [thread]);
  const threadNodes = useMemo(() => new Set(thread), [thread]);

  // dedupe undirected edges
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const out: { from: string; to: string; isThread: boolean }[] = [];
    for (const id of Object.keys(state.nodes).sort()) {
      for (const link of state.nodes[id].links) {
        const key = id < link ? `${id}|${link}` : `${link}|${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ from: id, to: link, isThread: threadSet.has(`${id}|${link}`) });
      }
    }
    return out;
  }, [state.nodes, threadSet]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {edges.map((e, i) => {
        const a = positions[e.from];
        const b = positions[e.to];
        if (!a || !b) return null;
        return (
          <Line
            key={i}
            points={[a, b]}
            color={e.isThread ? "#ffffff" : "#00d4ff"}
            transparent
            opacity={e.isThread ? 0.95 : 0.18}
            lineWidth={e.isThread ? 2.5 : 1}
          />
        );
      })}

      {Object.entries(positions).map(([id, p]) => {
        const node = state.nodes[id];
        if (!node) return null;
        const color = STATUS_COLOR[node.status];
        const size = 0.18 + node.energy * 0.45;
        const onThread = threadNodes.has(id);
        return (
          <group key={id} position={p}>
            <mesh>
              <sphereGeometry args={[size, 24, 24]} />
              <meshStandardMaterial
                emissive={onThread ? "#ffffff" : color}
                emissiveIntensity={onThread ? 3.5 : 2}
                color={onThread ? "#fff" : "#000"}
              />
            </mesh>
            {onThread && (
              <mesh>
                <sphereGeometry args={[size * 1.6, 16, 16]} />
                <meshStandardMaterial color={color} transparent opacity={0.18} />
              </mesh>
            )}
            <Html distanceFactor={10} center position={[0, size + 0.4, 0]} style={{ pointerEvents: "none" }}>
              <div className="font-mono text-[9px] text-white/70 whitespace-nowrap" style={{ textShadow: "0 0 6px #00d4ff" }}>
                {id}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function CanonicalLattice3D() {
  const engine = useLatticeEngine();
  const thread = useMemo(() => engine.computeGoldenThread(), [engine.latest()?.tick]);

  return (
    <WebGLGuard>
      <Canvas
        camera={{ position: [0, 4, 16], fov: 55 }}
        gl={{ failIfMajorPerformanceCaveat: false, antialias: true }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <LatticeGraph thread={thread} />
        <OrbitControls enableZoom enableRotate enablePan={false} autoRotate autoRotateSpeed={0.2} />
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.2} />
        </EffectComposer>
      </Canvas>
    </WebGLGuard>
  );
}
