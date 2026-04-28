import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

function NodeShell({ radius, count, color, speed }: { radius: number, count: number, color: string, speed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const positions = useMemo(() => {
    const pos = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      pos.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ]);
    }
    return pos;
  }, [radius, count]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * speed;
      groupRef.current.rotation.z = clock.getElapsedTime() * speed * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={new THREE.Vector3(...p)}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial emissive={color} emissiveIntensity={2} color="#000" />
        </mesh>
      ))}
    </group>
  );
}

function CoreNode() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial emissive="#00d4ff" emissiveIntensity={3} color="#fff" />
    </mesh>
  );
}

export default function MiniLattice() {
  return (
    <div className="w-full h-full min-h-[200px] bg-black/40 rounded-lg overflow-hidden border border-primary/20 relative flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <CoreNode />
        <NodeShell radius={1.5} count={12} color="#00e5c9" speed={0.4} />
        <NodeShell radius={2.2} count={24} color="#00ff88" speed={-0.3} />
        <NodeShell radius={3.0} count={36} color="#ccff00" speed={0.2} />
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-primary/70">
        MFCS_LATTICE_PREVIEW
      </div>
    </div>
  );
}
