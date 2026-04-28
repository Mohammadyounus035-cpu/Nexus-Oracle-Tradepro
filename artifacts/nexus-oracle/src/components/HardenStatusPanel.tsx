import { ShieldCheck, Crown, Layers, AlertOctagon, Hourglass } from "lucide-react";
import GlassCard from "./GlassCard";

interface Layer {
  id: string;
  label: string;
  detail: string;
  state: "ACTIVE" | "ARMED" | "PRIMED";
  Icon: React.ComponentType<{ className?: string }>;
}

const LAYERS: Layer[] = [
  {
    id: "supermajority",
    label: "Supermajority τ > 50%",
    detail: "Primary defense — split-brain mathematically impossible",
    state: "ACTIVE",
    Icon: ShieldCheck,
  },
  {
    id: "phoenix",
    label: "Phoenix-weighted reputation",
    detail: "Dynamic trust decay across attesting peers",
    state: "ACTIVE",
    Icon: Layers,
  },
  {
    id: "leader",
    label: "Leader election",
    detail: "Deterministic tie-breaker on equal-weight conflicts",
    state: "ARMED",
    Icon: Crown,
  },
  {
    id: "quorum",
    label: "Quorum escalation",
    detail: "Threshold τ ratchets upward on conflict detection",
    state: "PRIMED",
    Icon: Hourglass,
  },
  {
    id: "suspect",
    label: "State suspension (SUSPECT)",
    detail: "Conflicting nodes quarantined until resolution",
    state: "ARMED",
    Icon: AlertOctagon,
  },
];

const STATE_COLORS: Record<Layer["state"], string> = {
  ACTIVE: "text-accent border-accent/40 bg-accent/10",
  ARMED: "text-primary border-primary/40 bg-primary/10",
  PRIMED: "text-amber border-amber/40 bg-amber/10",
};

export default function HardenStatusPanel() {
  return (
    <GlassCard className="p-4" data-testid="panel-harden">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-primary tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          HARDEN · BFT LAYERS
        </div>
        <div className="text-[10px] font-mono text-accent border border-accent/40 px-2 py-0.5 rounded bg-accent/10">
          5 / 5 ONLINE
        </div>
      </div>

      <div className="space-y-2">
        {LAYERS.map(layer => {
          const Icon = layer.Icon;
          const stateColor = STATE_COLORS[layer.state];
          const colorOverride = layer.state === "PRIMED" ? { color: "#ffaa00", borderColor: "rgba(255,170,0,0.4)", backgroundColor: "rgba(255,170,0,0.1)" } : undefined;
          return (
            <div
              key={layer.id}
              className="flex items-start gap-3 p-2 rounded border border-border/30 bg-background/40"
              data-testid={`harden-${layer.id}`}
            >
              <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-foreground">{layer.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground leading-snug">
                  {layer.detail}
                </div>
              </div>
              <span
                className={`shrink-0 text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border ${stateColor}`}
                style={colorOverride}
              >
                {layer.state}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border/30 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>FLP boundary respected</span>
        <span>f &lt; n/2 → consensus guaranteed</span>
      </div>
    </GlassCard>
  );
}
