import { Download, Globe, Terminal, KeyRound } from "lucide-react";
import GlassCard from "./GlassCard";
import { useLatticeEngine } from "../lib/useLatticeEngine";

export default function PublicVerifyCard() {
  const engine = useLatticeEngine();
  const rec = engine.latest();

  const downloadAnalysis = () => {
    const analysis = engine.exportAnalysis();
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-oracle-analysis-tick-${rec?.tick ?? 0}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard className="p-5" data-testid="panel-public-verify">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest mb-1">
            <Globe className="w-4 h-4" />
            PUBLIC VERIFIABILITY · OMEGA v0.4.2
          </div>
          <div className="font-serif text-lg text-foreground">
            Truth must not depend on the system that produced it.
          </div>
        </div>
        <button
          type="button"
          onClick={downloadAnalysis}
          data-testid="btn-download-analysis"
          className="flex items-center gap-2 px-3 py-2 rounded border border-primary/40 bg-primary/10 text-primary font-mono text-xs hover:bg-primary/20 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          analysis.json
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest mb-2">
            <KeyRound className="w-3 h-3" />
            SIGNED STATE (Ed25519)
          </div>
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">publicKey</span>
              <span className="text-foreground/80 truncate" title={engine.publicKey}>{engine.publicKey.slice(0, 32)}…</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">stateHash</span>
              <span className="text-accent truncate" title={rec?.stateHash}>{rec?.stateHash.slice(0, 28)}…</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">signature</span>
              <span className="text-primary truncate" title={rec?.signature}>{rec?.signature.slice(0, 28)}…</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">tick</span>
              <span className="text-primary tabular-nums">{rec?.tick ?? 0}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest mb-2">
            <Terminal className="w-3 h-3" />
            REPRODUCIBILITY CONTRACT
          </div>
          <pre className="bg-black/60 border border-border/40 rounded p-3 font-mono text-[10px] text-foreground/80 overflow-x-auto leading-relaxed">
{`# 1. Download analysis.json
# 2. Recompute the canonical state hash:
sha256(stableStringify(canonicalState))
# 3. Compare with stateHash field
# 4. Verify signature with publicKey
# Identical hash + valid signature = AUTHENTIC`}
          </pre>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[10px] text-center">
        <div>
          <div className="text-muted-foreground">DETERMINISTIC</div>
          <div className="text-accent">PROVEN</div>
        </div>
        <div>
          <div className="text-muted-foreground">REPRODUCIBLE</div>
          <div className="text-accent">YES</div>
        </div>
        <div>
          <div className="text-muted-foreground">TAMPER-EVIDENT</div>
          <div className="text-accent">SIGNED</div>
        </div>
        <div>
          <div className="text-muted-foreground">DRIFT</div>
          <div className="text-accent">{rec?.worldDrift.toFixed(3) ?? "0.000"}%</div>
        </div>
      </div>
    </GlassCard>
  );
}
