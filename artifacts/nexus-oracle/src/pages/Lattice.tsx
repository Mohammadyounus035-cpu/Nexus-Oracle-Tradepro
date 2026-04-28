import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import GlassCard from "../components/GlassCard";
import WebGLGuard from "../components/WebGLGuard";
import { Shield, Zap, Diamond, Crosshair, Lock } from "lucide-react";

interface ShellConfig {
  name: string;
  radius: number;
  count: number;
  color: string;
  speed: number;
}

const SHELLS: ShellConfig[] = [
  { name: "CORE", radius: 3, count: 6, color: "#00d4ff", speed: 0.5 },
  { name: "MIRROR", radius: 5.5, count: 12, color: "#00e5c9", speed: -0.4 },
  { name: "TRIAD", radius: 8, count: 18, color: "#00ff88", speed: 0.3 },
  { name: "ENVELOPE", radius: 10.5, count: 24, color: "#ccff00", speed: -0.2 },
  { name: "TELEMETRY", radius: 13, count: 16, color: "#ffaa00", speed: 0.15 },
  { name: "THRESHOLD", radius: 15.5, count: 12, color: "#ff4466", speed: -0.1 },
];

function LatticeShell({ config }: { config: ShellConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const positions = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    
    for (let i = 0; i < config.count; i++) {
      const y = 1 - (i / (config.count - 1)) * 2; 
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      pos.push(new THREE.Vector3(x * config.radius, y * config.radius, z * config.radius));
    }
    return pos;
  }, [config]);

  // Connect close nodes within the shell
  const lines = useMemo(() => {
    const l: [THREE.Vector3, THREE.Vector3][] = [];
    const distSq = (config.radius * 2 * Math.PI) / config.count * 2.5; // connection threshold
    
    for(let i=0; i<positions.length; i++) {
      for(let j=i+1; j<positions.length; j++) {
        if(positions[i].distanceToSquared(positions[j]) < distSq * distSq) {
          l.push([positions[i], positions[j]]);
        }
      }
    }
    return l;
  }, [positions, config.radius, config.count]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * config.speed;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial emissive={config.color} emissiveIntensity={2} color="#000" />
        </mesh>
      ))}
      {lines.map((pair, i) => (
        <Line 
          key={i} 
          points={[pair[0], pair[1]]} 
          color={config.color} 
          transparent 
          opacity={0.3} 
          lineWidth={1} 
        />
      ))}
    </group>
  );
}

function CentralIH() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={4} color="#fff" />
    </mesh>
  );
}

export default function LatticePage() {
  return (
    <div className="relative w-full h-[calc(100vh-6rem)] bg-background overflow-hidden" data-testid="page-lattice">
      <WebGLGuard>
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }} gl={{ failIfMajorPerformanceCaveat: false, antialias: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <CentralIH />
        {SHELLS.map((shell, i) => (
          <LatticeShell key={i} config={shell} />
        ))}
        
        <OrbitControls enableZoom enableRotate enablePan={false} autoRotate autoRotateSpeed={0.3} />
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
      </WebGLGuard>

      {/* Overlays */}
      <GlassCard className="absolute top-6 left-6 p-4 w-72 bg-black/60">
        <h3 className="text-primary font-mono text-xs mb-4">OBSERVED METRICS</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">NODES (ACTIVE)</span><span className="text-foreground">167</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">LOOP SCOPE</span><span className="text-foreground">0.28</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">AVG ENERGY</span><span className="text-foreground">0.63</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">COHERENCE</span><span className="text-foreground">0.71</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">COMPLEXITY</span><span className="text-foreground">0.58</span></div>
          <div className="flex justify-between pt-2 border-t border-border/30"><span className="text-accent">FIELD STABILITY</span><span className="text-accent glow-text">87%</span></div>
        </div>
      </GlassCard>

      <GlassCard className="absolute top-6 right-6 p-4 bg-black/60">
        <h3 className="text-primary font-mono text-xs mb-4">KEY TO NODES</h3>
        <div className="space-y-2 font-mono text-xs">
          {SHELLS.map(shell => (
            <div key={shell.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shell.color, boxShadow: `0 0 8px ${shell.color}` }} />
              <span className="text-muted-foreground">{shell.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6">
        <h3 className="text-primary font-mono text-xs mb-3 text-center">FUNCTION STACK</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: Shield, label: "STABILIZE" },
            { icon: Zap, label: "BOOST" },
            { icon: Diamond, label: "SIMULATE" },
            { icon: Crosshair, label: "TRACE" },
            { icon: Lock, label: "LOCK" }
          ].map(fn => (
            <GlassCard key={fn.label} className="p-3 text-center cursor-pointer hover:bg-primary/10 transition-colors bg-black/60 group">
              <fn.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="font-mono text-[10px] text-foreground">{fn.label}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
