import { useEffect, useState } from "react";
import { useMarket } from "../context/MarketContext";
import GlassCard from "./GlassCard";
import GuardianStack from "./GuardianStack";
import {
  runAnalysisSync,
  generateSignal,
  validateSignal,
  GUARDIAN_LABELS,
  type Regime,
  type AnalysisOutput,
  type TradeSignal,
  type ValidationResult,
} from "../lib/tradingEngine";
import { Activity, ArrowUp, ArrowDown, Pause } from "lucide-react";

const REGIME_COLOR: Record<Regime, string> = {
  stable: "#00ffaa",
  transition: "#ffaa00",
  volatile: "#ff00aa",
  anomaly: "#ff4466",
};

export default function TradingSignalPanel() {
  const { selectedSymbol, prices, history } = useMarket();
  const [analysis, setAnalysis] = useState<Omit<AnalysisOutput, "hash"> | null>(null);
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    const quote = prices.get(selectedSymbol);
    const hist = history.get(selectedSymbol) ?? [];
    if (!quote || hist.length < 20) return;
    const half = Math.floor(hist.length / 2);
    const a = runAnalysisSync({
      symbol: selectedSymbol,
      historicalPrices: hist.slice(0, half),
      livePrices: hist.slice(half),
      volume: quote.volume ?? 5000,
    });
    const s = generateSignal(a);
    const v = validateSignal(s);
    setAnalysis(a);
    setSignal(s);
    setValidation(v);
  }, [selectedSymbol, prices, history]);

  if (!analysis || !signal || !validation) {
    return (
      <GlassCard className="p-4" data-testid="panel-trading-signal">
        <div className="text-xs font-mono text-muted-foreground">AWAITING DATA · {selectedSymbol}</div>
      </GlassCard>
    );
  }

  const ActionIcon = signal.action === "buy" ? ArrowUp : signal.action === "sell" ? ArrowDown : Pause;
  const actionColor =
    signal.action === "buy" ? "#00ffaa" : signal.action === "sell" ? "#ff4466" : "#9aa3b2";
  const guardianMeta = GUARDIAN_LABELS[analysis.liveState.guardian];

  return (
    <div className="space-y-3" data-testid="trading-signal-stack">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-primary tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            LATTICE SIGNAL · {selectedSymbol}
          </div>
          <div
            className="text-[10px] font-mono px-2 py-0.5 rounded border tracking-widest"
            style={{
              color: REGIME_COLOR[analysis.regime],
              borderColor: REGIME_COLOR[analysis.regime] + "55",
              background: REGIME_COLOR[analysis.regime] + "12",
            }}
          >
            {analysis.regime.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: actionColor, background: actionColor + "15" }}
          >
            <ActionIcon className="w-7 h-7" style={{ color: actionColor }} />
          </div>
          <div>
            <div className="font-serif text-2xl glow-text" style={{ color: actionColor }}>
              {signal.action.toUpperCase()}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">{signal.reason}</div>
          </div>
          <div className="ml-auto text-right font-mono">
            <div className="text-[10px] text-muted-foreground tracking-widest">PATH</div>
            <div className="text-xl text-primary tabular-nums">
              {analysis.liveState.pathId}
              <span className="text-[10px] text-muted-foreground">/96</span>
            </div>
            <div className="text-[10px]" style={{ color: guardianMeta.color }}>
              {guardianMeta.name}
            </div>
          </div>
        </div>

        <div className="space-y-2 font-mono text-[10px]">
          <Bar label="CONFIDENCE" value={signal.confidence} color="#00d4ff" />
          <Bar label="POSITION SIZE" value={signal.size} color="#00ffaa" />
          <Bar label="DRIFT" value={analysis.drift} color="#ff00aa" max={1} reference={0.35} />
          <Bar label="STRENGTH" value={analysis.liveState.strength} color="#ffaa00" />
        </div>

        <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-3 gap-2 font-mono text-[10px]">
          <div>
            <div className="text-muted-foreground">HIST PATH</div>
            <div className="text-foreground">{analysis.historicalState.pathId}/96</div>
          </div>
          <div>
            <div className="text-muted-foreground">POLARITY</div>
            <div style={{ color: analysis.liveState.polarity > 0 ? "#00ffaa" : analysis.liveState.polarity < 0 ? "#ff4466" : "#9aa3b2" }}>
              {analysis.liveState.polarity > 0 ? "+1" : analysis.liveState.polarity < 0 ? "-1" : "0"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">GUARDIAN</div>
            <div style={{ color: guardianMeta.color }}>{guardianMeta.name}</div>
          </div>
        </div>
      </GlassCard>

      <GuardianStack validation={validation} compact />
    </div>
  );
}

function Bar({ label, value, color, max = 1, reference }: { label: string; value: number; color: string; max?: number; reference?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const refPct = reference !== undefined ? (reference / max) * 100 : undefined;
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-muted-foreground tracking-widest">{label}</span>
        <span style={{ color }}>{value.toFixed(3)}</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
        {refPct !== undefined && (
          <div className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: `${refPct}%` }} />
        )}
      </div>
    </div>
  );
}
