import { CheckCircle2 } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";

function shortHash(h: string, head = 10, tail = 8) {
  return h.length > head + tail + 1 ? h.slice(0, head) + "…" + h.slice(-tail) : h;
}

export default function HashHistoryTable() {
  const engine = useLatticeEngine();
  const reversed = [...engine.history].reverse();

  return (
    <GlassCard className="p-4" data-testid="panel-hash-history">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest">
          IMMUTABLE TICK LOG · {engine.history.length} ENTRIES
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">APPEND-ONLY</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[10px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/30">
              <th className="py-2 pr-4">TICK</th>
              <th className="py-2 pr-4">TIMESTAMP</th>
              <th className="py-2 pr-4">stateHash</th>
              <th className="py-2 pr-4">visualHash</th>
              <th className="py-2 pr-4">signature</th>
              <th className="py-2 pr-4 text-right">DRIFT</th>
              <th className="py-2 pr-4 text-right">LAT</th>
              <th className="py-2 text-center">VERIFIED</th>
            </tr>
          </thead>
          <tbody>
            {reversed.map(rec => (
              <tr key={rec.tick} className="border-b border-border/20 last:border-0">
                <td className="py-2 pr-4 text-primary tabular-nums">{rec.tick}</td>
                <td className="py-2 pr-4 text-foreground/70 tabular-nums">{new Date(rec.timestamp).toISOString().slice(11, 23)}</td>
                <td className="py-2 pr-4 text-accent">{shortHash(rec.stateHash)}</td>
                <td className="py-2 pr-4 text-foreground">{shortHash(rec.visualHash)}</td>
                <td className="py-2 pr-4 text-primary">{shortHash(rec.signature, 8, 6)}</td>
                <td className="py-2 pr-4 text-right" style={{ color: rec.worldDrift > 0 ? "#ff4466" : "#00ffaa" }}>
                  {rec.worldDrift.toFixed(3)}%
                </td>
                <td className="py-2 pr-4 text-right text-foreground tabular-nums">{rec.latencyMs.toFixed(1)}ms</td>
                <td className="py-2 text-center">
                  {rec.verified ? <CheckCircle2 className="w-3.5 h-3.5 inline text-accent" /> : <span className="text-destructive">FAIL</span>}
                </td>
              </tr>
            ))}
            {reversed.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-muted-foreground">Awaiting first tick…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
