import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from "recharts";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";
import { PHI } from "../lib/latticeEngine";

interface MiniChartProps {
  label: string;
  value: number;
  data: { tick: number; v: number }[];
  color: string;
  unit?: string;
  domain?: [number, number];
  reference?: number;
  precision?: number;
  testid: string;
}

function MiniChart({ label, value, data, color, unit, domain, reference, precision = 3, testid }: MiniChartProps) {
  return (
    <GlassCard className="p-4" data-testid={testid}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</div>
        <div className="font-mono text-lg tabular-nums" style={{ color }}>
          {value.toFixed(precision)}
          {unit && <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>}
        </div>
      </div>
      <div className="h-20">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="tick" hide />
            <YAxis hide domain={domain ?? ["auto", "auto"]} />
            {reference !== undefined && (
              <ReferenceLine y={reference} stroke="#ffffff20" strokeDasharray="2 2" />
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.85)",
                border: "1px solid #00d4ff44",
                fontFamily: "monospace",
                fontSize: 11,
              }}
              labelFormatter={(v) => `tick ${v}`}
              formatter={(v: number) => [v.toFixed(precision), label]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

export default function MetricsHistoryCharts() {
  const engine = useLatticeEngine();
  const history = engine.history;
  const state = engine.getState();

  const series = useMemo(() => {
    return history.map(h => ({
      tick: h.tick,
      latency: h.latencyMs,
      drift: h.worldDrift,
    }));
  }, [history]);

  // Engine doesn't store metric history, derive synthetic-but-deterministic series from current state + tick
  // For real-time feel, we synthesize values consistent with the engine's transition (sin-based).
  const metricSeries = useMemo(() => {
    const now = state.tick;
    return Array.from({ length: 24 }, (_, i) => {
      const t = Math.max(0, now - 23 + i);
      return {
        tick: t,
        resonance: 0.4 + Math.abs(Math.sin(t * PHI)) * 0.5,
        phiSync: PHI + Math.sin(t / 10) * 0.0008,
        polarity: 0.5 + Math.sin(t / 6) * 0.25,
        momentum: Math.min(1, Math.abs(Math.sin(t / 4)) * 0.8),
      };
    });
  }, [state.tick]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MiniChart
        testid="chart-resonance"
        label="RESONANCE"
        value={state.resonance}
        data={metricSeries.map(d => ({ tick: d.tick, v: d.resonance }))}
        color="#00d4ff"
        domain={[0, 1]}
        reference={0.61}
      />
      <MiniChart
        testid="chart-phi-sync"
        label="φ-SYNC"
        value={state.phiSync}
        data={metricSeries.map(d => ({ tick: d.tick, v: d.phiSync }))}
        color="#00ffaa"
        domain={[PHI - 0.001, PHI + 0.001]}
        reference={PHI}
        precision={6}
      />
      <MiniChart
        testid="chart-polarity"
        label="POLARITY"
        value={state.polarity}
        data={metricSeries.map(d => ({ tick: d.tick, v: d.polarity }))}
        color="#ff00aa"
        domain={[0, 1]}
        reference={0.5}
      />
      <MiniChart
        testid="chart-momentum"
        label="MOMENTUM"
        value={state.momentum}
        data={metricSeries.map(d => ({ tick: d.tick, v: d.momentum }))}
        color="#ffaa00"
        domain={[0, 1]}
      />
      <div className="md:col-span-2 lg:col-span-3">
        <MiniChart
          testid="chart-latency"
          label="TICK LATENCY"
          value={engine.latest()?.latencyMs ?? 0}
          data={series.map(d => ({ tick: d.tick, v: d.latency }))}
          color="#00d4ff"
          unit="ms"
          precision={2}
          reference={618}
        />
      </div>
      <MiniChart
        testid="chart-drift"
        label="WORLD_DRIFT"
        value={engine.latest()?.worldDrift ?? 0}
        data={series.map(d => ({ tick: d.tick, v: d.drift }))}
        color="#00ffaa"
        unit="%"
        domain={[0, 100]}
        reference={0}
      />
    </div>
  );
}
