import { ChevronRight, Cpu, Play, FileCheck2, KeyRound, Radio, Save } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";
import { PIPELINE_STAGES, PipelineStage, TICK_MS } from "../lib/latticeEngine";

const ICONS: Record<PipelineStage, React.ComponentType<{ className?: string }>> = {
  DECIDE: Cpu,
  EXECUTE: Play,
  VERIFY: FileCheck2,
  SIGN: KeyRound,
  BROADCAST: Radio,
  SNAPSHOT: Save,
};

export default function VerifyPipelinePanel() {
  const engine = useLatticeEngine();
  const rec = engine.latest();
  const activeIdx = PIPELINE_STAGES.indexOf(engine.stage);

  return (
    <GlassCard className="p-4 bg-black/60" data-testid="panel-verify-pipeline">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest">
          DECIDE → EXECUTE → VERIFY → SIGN → BROADCAST → SNAPSHOT
        </div>
        <div className="text-[10px] font-mono text-muted-foreground tabular-nums">
          φ-TICK <span className="text-accent">{TICK_MS}ms</span> · LATENCY{" "}
          <span className="text-primary">{rec?.latencyMs.toFixed(1) ?? "—"}ms</span>
        </div>
      </div>

      <div className="flex items-stretch gap-1">
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = ICONS[stage];
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;
          const color = isActive ? "#00d4ff" : isPast ? "#00ffaa" : "#ffffff20";
          const bg = isActive
            ? "rgba(0,212,255,0.15)"
            : isPast
            ? "rgba(0,255,170,0.08)"
            : "rgba(255,255,255,0.02)";
          return (
            <div key={stage} className="flex-1 flex items-center gap-1">
              <div
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded border transition-colors"
                style={{ borderColor: `${color}55`, background: bg }}
                data-testid={`pipeline-stage-${stage.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" style={{ color }} />
                <div className="font-mono text-[9px] tracking-widest" style={{ color: isActive || isPast ? color : "#9aa3b2" }}>
                  {stage}
                </div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: i < activeIdx ? "#00ffaa" : "#ffffff20" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-4 gap-3 font-mono text-[10px] text-center">
        <div>
          <div className="text-muted-foreground">STAGE</div>
          <div className="text-primary">{engine.stage}</div>
        </div>
        <div>
          <div className="text-muted-foreground">CRITICAL NODES</div>
          <div className={(rec?.criticalNodes ?? 0) > 0 ? "text-yellow-500" : "text-accent"}>
            {rec?.criticalNodes ?? 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">TICK</div>
          <div className="text-primary tabular-nums">{rec?.tick ?? 0}</div>
        </div>
        <div>
          <div className="text-muted-foreground">PIPELINE</div>
          <div className="text-accent">PROVEN</div>
        </div>
      </div>
    </GlassCard>
  );
}
