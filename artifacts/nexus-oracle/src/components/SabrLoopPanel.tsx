import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import GlassCard from "./GlassCard";

type Verdict = "RESILIENT" | "BOUNDARY" | "STALEMATE" | "INSTABILITY";

interface SabrTest {
  id: number;
  title: string;
  pressure: string;
  behavior: string;
  verdict: Verdict;
}

const TESTS: SabrTest[] = [
  {
    id: 1,
    title: "Timing",
    pressure: "+2000ms delay on A/D, instant on B/C",
    behavior: "Stabilizes after latency",
    verdict: "RESILIENT",
  },
  {
    id: 2,
    title: "Partial Visibility",
    pressure: "A↔C link removed",
    behavior: "Propagates via B/D relay",
    verdict: "RESILIENT",
  },
  {
    id: 3,
    title: "TTL Decay",
    pressure: "TTL=1, single vs all attest",
    behavior: "Single fails · gossip reinforcement wins",
    verdict: "BOUNDARY",
  },
  {
    id: 4,
    title: "Conflict (HARDENED)",
    pressure: "A,C → hash_1 vs B,D → hash_2",
    behavior: "Neither hash exceeds τ > 50%",
    verdict: "STALEMATE",
  },
];

const VERDICT_META: Record<Verdict, { color: string; bg: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  RESILIENT: { color: "#00ffaa", bg: "rgba(0,255,170,0.1)", Icon: CheckCircle2, label: "RESILIENT" },
  BOUNDARY: { color: "#ffaa00", bg: "rgba(255,170,0,0.1)", Icon: AlertTriangle, label: "BOUNDARY" },
  STALEMATE: { color: "#00d4ff", bg: "rgba(0,212,255,0.1)", Icon: CheckCircle2, label: "SAFE STALEMATE" },
  INSTABILITY: { color: "#ff4466", bg: "rgba(255,68,102,0.1)", Icon: XCircle, label: "SPLIT-BRAIN" },
};

export default function SabrLoopPanel() {
  return (
    <GlassCard className="p-4" data-testid="panel-sabr">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-primary tracking-widest">
          SABR LOOP · DISTORTION SUITE
        </div>
        <div className="text-[10px] font-mono text-accent border border-accent/40 px-2 py-0.5 rounded bg-accent/10">
          ITER 04 · COMPLETE
        </div>
      </div>

      <div className="space-y-2">
        {TESTS.map(test => {
          const meta = VERDICT_META[test.verdict];
          const Icon = meta.Icon;
          return (
            <div
              key={test.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded border border-border/30 bg-background/40 font-mono text-[11px]"
              data-testid={`sabr-test-${test.id}`}
            >
              <div className="col-span-1 text-muted-foreground">{String(test.id).padStart(2, "0")}</div>
              <div className="col-span-3 text-foreground">{test.title}</div>
              <div className="col-span-4 text-[10px] text-muted-foreground leading-snug">{test.pressure}</div>
              <div className="col-span-2 text-[10px] text-foreground/80 leading-snug">{test.behavior}</div>
              <div
                className="col-span-2 flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] tracking-widest justify-center"
                style={{ color: meta.color, borderColor: `${meta.color}55`, background: meta.bg }}
              >
                <Icon className="w-3 h-3" />
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-3 gap-3 font-mono text-[10px]">
        <div>
          <div className="text-muted-foreground">FRACTURE</div>
          <div className="text-foreground">f ≥ n/2</div>
        </div>
        <div>
          <div className="text-muted-foreground">DEFENSE</div>
          <div className="text-accent">SUPERMAJORITY</div>
        </div>
        <div>
          <div className="text-muted-foreground">DRIFT</div>
          <div className="text-primary">0.000%</div>
        </div>
      </div>
    </GlassCard>
  );
}
