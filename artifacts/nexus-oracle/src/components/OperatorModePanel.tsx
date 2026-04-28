import { Eye, MousePointerClick, AlertTriangle, FlaskConical, Layers3, Power, PauseCircle, PlayCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";
import type { OperatorMode, SystemState } from "../lib/latticeEngine";

const MODES: { id: OperatorMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "FREE", label: "FREE", Icon: Eye },
  { id: "NODE", label: "NODE", Icon: MousePointerClick },
  { id: "ALERT", label: "ALERT", Icon: AlertTriangle },
  { id: "PREDICTION", label: "PREDICT", Icon: FlaskConical },
  { id: "TOP_DOWN", label: "TOP-DOWN", Icon: Layers3 },
];

const SYS_STATES: { id: SystemState; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "STANDBY", Icon: PauseCircle },
  { id: "ACTIVE", Icon: PlayCircle },
  { id: "LOCKED", Icon: Power },
];

const SYS_COLOR: Record<SystemState, string> = {
  STANDBY: "#9aa3b2",
  ACTIVE: "#00ffaa",
  LOCKED: "#ffaa00",
};

export default function OperatorModePanel() {
  const engine = useLatticeEngine();

  return (
    <GlassCard className="p-4 bg-black/60" data-testid="panel-operator">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest">OPERATOR MODE</div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {engine.mode === "PREDICTION" ? <span className="text-amber" style={{ color: "#ffaa00" }}>GHOST · NO MUTATION</span> : "AUTHORITATIVE"}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-4">
        {MODES.map(m => {
          const isActive = engine.mode === m.id;
          const Icon = m.Icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => engine.setMode(m.id)}
              data-testid={`mode-${m.id.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 py-2 rounded border font-mono text-[9px] tracking-widest transition-colors ${
                isActive
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:text-primary hover:border-primary/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="text-xs font-mono text-primary tracking-widest mb-2">SYSTEM STATE</div>
      <div className="grid grid-cols-3 gap-1">
        {SYS_STATES.map(s => {
          const isActive = engine.sysState === s.id;
          const Icon = s.Icon;
          const color = SYS_COLOR[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => engine.setSystemState(s.id)}
              data-testid={`sys-${s.id.toLowerCase()}`}
              className="flex items-center justify-center gap-1 py-1.5 rounded border font-mono text-[10px] tracking-widest transition-colors"
              style={{
                borderColor: isActive ? `${color}aa` : "rgba(255,255,255,0.15)",
                background: isActive ? `${color}22` : "rgba(255,255,255,0.02)",
                color: isActive ? color : "#9aa3b2",
              }}
            >
              <Icon className="w-3 h-3" />
              {s.id}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
