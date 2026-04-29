import { motion } from "framer-motion";
import { ShieldCheck, Eye, GitMerge } from "lucide-react";
import GlassCard from "../components/GlassCard";
import IntegrityPanel from "../components/IntegrityPanel";
import VerifyPipelinePanel from "../components/VerifyPipelinePanel";
import OperatorModePanel from "../components/OperatorModePanel";
import CanonicalLattice3D from "../components/CanonicalLattice3D";
import MetricsHistoryCharts from "../components/MetricsHistoryCharts";
import HashHistoryTable from "../components/HashHistoryTable";
import PublicVerifyCard from "../components/PublicVerifyCard";
import GoldenThreadPanel from "../components/GoldenThreadPanel";
import { useLatticeEngine } from "../lib/useLatticeEngine";
import { TICK_MS } from "../lib/latticeEngine";

export default function VerifyPage() {
  const engine = useLatticeEngine();
  const rec = engine.latest();
  const state = engine.getState();
  const nodes = Object.values(state.nodes);
  const activeCount = nodes.filter(n => n.status === "active").length;
  const sealedCount = nodes.filter(n => n.status === "sealed").length;
  const avgEnergy = nodes.reduce((a, n) => a + n.energy, 0) / Math.max(1, nodes.length);
  const totalLinks = nodes.reduce((a, n) => a + n.links.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-[1600px] mx-auto space-y-6"
      data-testid="page-verify"
    >
      {/* Hero verification banner */}
      <GlassCard className="p-6 border-l-4 border-l-accent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-accent/60 bg-accent/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-accent" />
            </div>
            <div>
              <div className="text-xs font-mono text-accent tracking-widest mb-1">
                CRYPTOGRAPHICALLY VERIFIABLE REALITY ENGINE
              </div>
              <div className="font-serif text-3xl text-foreground glow-text">
                STATE <span className="text-accent">VERIFIED</span> · TICK {rec?.tick ?? 0}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                Last broadcast {rec ? new Date(rec.timestamp).toISOString() : "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <div className="text-muted-foreground">φ-TICK</div>
              <div className="text-primary text-lg tabular-nums">{TICK_MS}<span className="text-[10px]">ms</span></div>
            </div>
            <div>
              <div className="text-muted-foreground">LATENCY</div>
              <div className="text-accent text-lg tabular-nums">{rec?.latencyMs.toFixed(1) ?? "—"}<span className="text-[10px]">ms</span></div>
            </div>
            <div>
              <div className="text-muted-foreground">DRIFT</div>
              <div className="text-accent text-lg tabular-nums">{rec?.worldDrift.toFixed(3) ?? "0.000"}<span className="text-[10px]">%</span></div>
            </div>
            <div>
              <div className="text-muted-foreground">ROLLBACKS</div>
              <div className="text-accent text-lg tabular-nums">{rec?.rollbacks ?? 0}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Integrity / Pipeline / Operator row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <IntegrityPanel />
        <div className="lg:col-span-2 flex flex-col gap-6">
          <VerifyPipelinePanel />
          <OperatorModePanel />
        </div>
      </div>

      {/* Golden Thread */}
      <GoldenThreadPanel />

      {/* 3D Canonical Lattice + side metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden h-[480px] relative">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-xs font-mono text-primary tracking-widest bg-black/60 px-2 py-1 rounded border border-primary/30">
            <Eye className="w-3.5 h-3.5" />
            CANONICAL LATTICE · LIVE
          </div>
          <div className="absolute top-3 right-3 z-10 bg-black/60 border border-border/40 rounded p-2 font-mono text-[10px] space-y-1">
            <div className="text-muted-foreground tracking-widest mb-1">NODE STATUS</div>
            {[
              { label: "active", color: "#00d4ff" },
              { label: "monitor", color: "#00ffaa" },
              { label: "staged", color: "#ffaa00" },
              { label: "sealed", color: "#ff00aa" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span className="text-foreground/70">{s.label}</span>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t border-border/40 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ boxShadow: "0 0 6px white" }} />
              <span className="text-foreground/70">golden thread</span>
            </div>
          </div>
          <CanonicalLattice3D />
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-4">
            <div className="text-xs font-mono text-primary tracking-widest mb-3 flex items-center gap-2">
              <GitMerge className="w-3.5 h-3.5" />
              CANONICAL STATE
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <div className="text-muted-foreground text-[10px]">NODES</div>
                <div className="text-foreground text-xl">{nodes.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">EDGES</div>
                <div className="text-foreground text-xl">{totalLinks}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">ACTIVE</div>
                <div className="text-primary text-xl">{activeCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">SEALED</div>
                <div className="text-foreground text-xl">{sealedCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">AVG ENERGY</div>
                <div className="text-accent text-xl">{avgEnergy.toFixed(3)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">CRITICAL</div>
                <div className="text-yellow-500 text-xl">{rec?.criticalNodes ?? 0}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-xs font-mono text-primary tracking-widest mb-3">LIVE METRICS</div>
            <div className="space-y-3 font-mono text-xs">
              {[
                { label: "RESONANCE", v: state.resonance, color: "#00d4ff" },
                { label: "φ-SYNC", v: state.phiSync, color: "#00ffaa", precision: 6 },
                { label: "POLARITY", v: state.polarity, color: "#ff00aa" },
                { label: "MOMENTUM", v: state.momentum, color: "#ffaa00" },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground tracking-widest">{m.label}</span>
                    <span style={{ color: m.color }}>{m.v.toFixed(m.precision ?? 3)}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${Math.min(100, m.v * 100)}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Charts row */}
      <MetricsHistoryCharts />

      {/* Hash history */}
      <HashHistoryTable />

      {/* Public verifiability */}
      <PublicVerifyCard />
    </motion.div>
  );
}
