import { useEffect, useRef, useState } from "react";

interface ResonanceWaveProps {
  width?: number;
  height?: number;
  frequency?: number;
  showLabel?: boolean;
}

export default function ResonanceWave({
  width = 96,
  height = 28,
  frequency = 671.6,
  showLabel = true,
}: ResonanceWaveProps) {
  const [phase, setPhase] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setPhase(p => (p + dt * 1.4) % (Math.PI * 2));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const samples = 64;
  const path = Array.from({ length: samples + 1 }, (_, i) => {
    const x = (i / samples) * width;
    const t = (i / samples) * Math.PI * 4 + phase;
    const envelope = Math.sin((i / samples) * Math.PI);
    const y = height / 2 + Math.sin(t) * (height / 2 - 2) * envelope;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <div className="flex items-center gap-2" data-testid="resonance-wave">
      <svg width={width} height={height} className="block" aria-hidden>
        <defs>
          <linearGradient id="resonance-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#00ffaa" />
            <stop offset="100%" stopColor="#ff00aa" />
          </linearGradient>
          <filter id="resonance-glow">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#resonance-grad)"
          strokeWidth="1.4"
          strokeLinecap="round"
          filter="url(#resonance-glow)"
        />
      </svg>
      {showLabel && (
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
          {frequency.toFixed(1)}<span className="text-primary">Hz</span>
        </span>
      )}
    </div>
  );
}
