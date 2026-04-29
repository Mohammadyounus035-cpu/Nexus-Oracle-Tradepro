import { Sparkles, ChevronRight } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";

export default function GoldenThreadPanel() {
  const engine = useLatticeEngine();
  const thread = engine.computeGoldenThread();
  const state = engine.getState();
  const start = thread[0];
  const end = thread[thread.length - 1];
  const startNode = start ? state.nodes[start] : undefined;
  const endNode = end ? state.nodes[end] : undefined;

  return (
    <GlassCard className="p-4" data-testid="panel-golden-thread">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          GOLDEN THREAD
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          DETERMINISTIC · {thread.length} HOPS
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-[10px]">
        <div className="p-2 rounded border border-accent/40 bg-accent/5">
          <div className="text-muted-foreground tracking-widest">MOST STABLE</div>
          <div className="text-accent text-base mt-0.5">{start ?? "—"}</div>
          <div className="text-foreground/60">energy {startNode?.energy.toFixed(3) ?? "—"}</div>
        </div>
        <div className="p-2 rounded border border-primary/40 bg-primary/5">
          <div className="text-muted-foreground tracking-widest">HIGHEST INFLUENCE</div>
          <div className="text-primary text-base mt-0.5">{end ?? "—"}</div>
          <div className="text-foreground/60">{endNode?.links.length ?? 0} links</div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1 font-mono text-[10px]">
        {thread.map((id, i) => (
          <div key={id + i} className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 rounded border"
              style={{
                color: i === 0 ? "#00ffaa" : i === thread.length - 1 ? "#00d4ff" : "#ffffff",
                borderColor: i === 0 ? "#00ffaa55" : i === thread.length - 1 ? "#00d4ff55" : "#ffffff33",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {id}
            </span>
            {i < thread.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
        {thread.length === 0 && <span className="text-muted-foreground">computing path…</span>}
      </div>
    </GlassCard>
  );
}
