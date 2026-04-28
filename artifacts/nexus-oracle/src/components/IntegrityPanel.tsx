import { CheckCircle2, ShieldAlert, FileSignature } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";

function shortHash(h?: string, head = 8, tail = 6) {
  if (!h) return "—";
  return h.slice(0, head) + "…" + h.slice(-tail);
}

export default function IntegrityPanel() {
  const engine = useLatticeEngine();
  const rec = engine.latest();
  const verified = !!rec?.verified;
  const drift = rec?.worldDrift ?? 0;

  return (
    <GlassCard className="p-4 bg-black/60" data-testid="panel-integrity">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest flex items-center gap-2">
          <FileSignature className="w-3.5 h-3.5" />
          THREE-LOCK INTEGRITY
        </div>
        {verified ? (
          <span className="flex items-center gap-1 text-[10px] font-mono text-accent border border-accent/40 bg-accent/10 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            VERIFIED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-mono text-destructive border border-destructive/40 bg-destructive/10 px-2 py-0.5 rounded">
            <ShieldAlert className="w-3 h-3" />
            FAILED
          </span>
        )}
      </div>

      <div className="space-y-1.5 font-mono text-[10px]">
        {[
          { label: "decisionHash", value: rec?.decisionHash, color: "text-primary" },
          { label: "stateHash", value: rec?.stateHash, color: "text-accent" },
          { label: "visualHash", value: rec?.visualHash, color: "text-foreground" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2 border-b border-border/20 pb-1 last:border-0">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={`${row.color} truncate`} title={row.value}>{shortHash(row.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-muted-foreground">signature</span>
          <span className="text-primary truncate" title={rec?.signature}>{shortHash(rec?.signature, 6, 6)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">publicKey</span>
          <span className="text-foreground/70 truncate" title={engine.publicKey}>{shortHash(engine.publicKey, 14, 4)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-center font-mono text-[10px]">
        <div>
          <div className="text-muted-foreground">TICK</div>
          <div className="text-primary tabular-nums">{rec?.tick ?? 0}</div>
        </div>
        <div>
          <div className="text-muted-foreground">WORLD_DRIFT</div>
          <div className={drift < 0.5 ? "text-accent" : "text-yellow-500"} style={{ color: drift > 50 ? "#ff4466" : undefined }}>
            {drift.toFixed(3)}%
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">ROLLBACKS</div>
          <div className={rec?.rollbacks ? "text-yellow-500" : "text-accent"}>{rec?.rollbacks ?? 0}</div>
        </div>
      </div>
    </GlassCard>
  );
}
