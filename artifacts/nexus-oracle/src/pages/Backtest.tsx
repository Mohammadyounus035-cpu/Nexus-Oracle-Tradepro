import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import GlassCard from "../components/GlassCard";
import GuardianStack from "../components/GuardianStack";
import { useMarket } from "../context/MarketContext";
import {
  runBacktest,
  GUARDIAN_LABELS,
  type BacktestResult,
  type Guardian,
  type Regime,
} from "../lib/tradingEngine";
import { Slider } from "@/components/ui/slider";
import { Play, Download, Save, Activity, Shield, Trophy, AlertOctagon, ChevronRight } from "lucide-react";
import dragonImg from "@assets/IMG_5523_1777431402293.jpeg";

const STORAGE_KEY = "nexus-oracle.backtest.runs.v1";

interface SavedRun extends BacktestResult {
  symbol: string;
}

const REGIME_COLOR: Record<Regime, string> = {
  stable: "#00ffaa",
  transition: "#ffaa00",
  volatile: "#ff00aa",
  anomaly: "#ff4466",
};

function fmtPct(v: number) { return (v * 100).toFixed(1) + "%"; }
function fmtMul(v: number) { return "×" + v.toFixed(4); }
function fmtUsd(cents: number) { return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

export default function Backtest() {
  const { selectedSymbol, prices, setSelectedSymbol } = useMarket();
  const [ticks, setTicks] = useState(120);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [saved, setSaved] = useState<SavedRun[]>([]);
  const symbolList = useMemo(() => Array.from(prices.keys()), [prices]);
  const ranSavedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Auto-run a small backtest on first mount so the page isn't empty
  useEffect(() => {
    if (ranSavedRef.current) return;
    if (symbolList.length === 0) return;
    ranSavedRef.current = true;
    void execute(80, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolList.length]);

  async function execute(t = ticks, persist = true) {
    setRunning(true);
    try {
      const quote = prices.get(selectedSymbol);
      const r = await runBacktest({
        symbol: selectedSymbol,
        ticks: t,
        initialPriceCents: quote?.price ?? 15000,
      });
      setResult(r);
      if (persist) {
        const next: SavedRun[] = [{ ...r, symbol: selectedSymbol }, ...saved].slice(0, 12);
        setSaved(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
    } finally {
      setRunning(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ symbol: selectedSymbol, ...result }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backtest-${selectedSymbol}-${result.ticks}t-${result.hash.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const equityData = useMemo(
    () => (result?.equityCurve ?? []).map(p => ({ tick: p.tick, equity: p.equity / 100 })),
    [result],
  );

  const regimeCounts = useMemo(() => {
    const acc: Record<Regime, number> = { stable: 0, transition: 0, volatile: 0, anomaly: 0 };
    for (const r of result?.regimeHistory ?? []) acc[r]++;
    return acc;
  }, [result]);

  const totalRegimes = (result?.regimeHistory.length ?? 0) || 1;

  const lastReject = useMemo(() => {
    const t = (result?.trades ?? []).find(() => false);
    return t;
  }, [result]);
  void lastReject;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-[1600px] mx-auto space-y-6"
      data-testid="page-backtest"
    >
      {/* Hero with dragon */}
      <GlassCard className="p-0 overflow-hidden relative h-[260px]">
        <img
          src={dragonImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50 [object-position:center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <div className="text-xs font-mono text-accent tracking-widest mb-1">
            DETERMINISTIC SIMULATION · OMEGA Γ-VALIDATED
          </div>
          <div className="font-serif text-4xl text-foreground glow-text mb-1">
            BACKTEST <span className="text-primary">ENGINE</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground max-w-2xl">
            96-path lattice analysis · regime classification · 5-guardian validation. Every run is reproducible from its hash.
          </div>
        </div>
      </GlassCard>

      {/* Controls */}
      <GlassCard className="p-5" data-testid="panel-backtest-controls">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-3">
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">SYMBOL</div>
            <div className="flex flex-wrap gap-1.5">
              {symbolList.slice(0, 8).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSymbol(s)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-colors ${
                    selectedSymbol === s
                      ? "bg-primary/20 text-primary border-primary/60"
                      : "bg-black/30 text-muted-foreground border-border/40 hover:text-primary hover:border-primary/40"
                  }`}
                  data-testid={`btn-bt-symbol-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-6">
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">
              TICKS · <span className="text-primary tabular-nums">{ticks}</span>
            </div>
            <Slider
              min={20}
              max={500}
              step={10}
              value={[ticks]}
              onValueChange={v => setTicks(v[0])}
              data-testid="slider-ticks"
            />
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
              <span>20</span>
              <span>120</span>
              <span>250</span>
              <span>500</span>
            </div>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={() => execute(ticks, true)}
              disabled={running}
              data-testid="btn-run-sim"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded font-mono text-sm tracking-widest bg-accent/20 text-accent border border-accent hover:bg-accent hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {running ? "RUNNING…" : "RUN SIM"}
            </button>
            {result && (
              <button
                onClick={downloadResult}
                data-testid="btn-bt-download"
                className="px-3 py-2.5 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Download analysis.json"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          icon={Trophy}
          label="FINAL EQUITY"
          value={result ? fmtMul(result.multiplier) : "—"}
          sub={result ? `${fmtUsd(result.startEquity)} → ${fmtUsd(result.finalEquity)}` : "vs start"}
          color={result && result.multiplier >= 1 ? "#00ffaa" : "#ff4466"}
          testid="stat-final-equity"
        />
        <Stat
          icon={Activity}
          label="WIN RATE"
          value={result ? fmtPct(result.winRate) : "0%"}
          sub={result ? `${result.trades.filter(t => t.side === "SELL").length} closes` : "0 trades"}
          color="#ffaa00"
          testid="stat-win-rate"
        />
        <Stat
          icon={Shield}
          label="ACT SIGNALS"
          value={result ? String(result.actionableSignals) : "0"}
          sub={result ? `of ${result.ticks} ticks` : "of 0 ticks"}
          color="#00ffaa"
          testid="stat-actionable"
        />
        <Stat
          icon={AlertOctagon}
          label="ENVELOPE BREACHES"
          value={result ? String(result.envelopeBreaches) : "0"}
          sub={result && result.envelopeBreaches > 0 ? "auto-downgraded" : "clean run"}
          color={result && result.envelopeBreaches > 0 ? "#ff4466" : "#00d4ff"}
          testid="stat-breaches"
        />
      </div>

      {/* Equity curve */}
      <GlassCard className="p-4" data-testid="panel-equity-curve">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-primary tracking-widest">EQUITY CURVE · {selectedSymbol}</div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {result ? `${result.equityCurve.length} ticks · hash ${result.hash.slice(0, 12)}…` : "awaiting run"}
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer>
            <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="tick" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              {result && (
                <ReferenceLine y={result.startEquity / 100} stroke="#ffffff30" strokeDasharray="3 3" label={{ value: "start", fill: "#ffffff60", fontSize: 9 }} />
              )}
              <Tooltip
                contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid #00d4ff44", fontFamily: "monospace", fontSize: 11 }}
                formatter={(v: number) => ["$" + v.toFixed(2), "equity"]}
                labelFormatter={(l) => `tick ${l}`}
              />
              <Area type="monotone" dataKey="equity" stroke="#00d4ff" strokeWidth={2} fill="url(#eqGrad)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Regime distribution + Guardian rejections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-4" data-testid="panel-regime-dist">
          <div className="text-xs font-mono text-primary tracking-widest mb-3">REGIME DISTRIBUTION</div>
          <div className="space-y-2 font-mono text-xs">
            {(Object.keys(regimeCounts) as Regime[]).map(r => {
              const pct = (regimeCounts[r] / totalRegimes) * 100;
              return (
                <div key={r}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: REGIME_COLOR[r] }}>{r.toUpperCase()}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {regimeCounts[r]} <span className="opacity-60">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: REGIME_COLOR[r] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-4" data-testid="panel-guardian-rejections">
          <div className="text-xs font-mono text-primary tracking-widest mb-3">GUARDIAN REJECTIONS</div>
          {result && result.rejections.length > 0 ? (
            <div className="space-y-2 font-mono text-xs">
              {result.rejections
                .sort((a, b) => b.count - a.count)
                .map(r => {
                  const meta = GUARDIAN_LABELS[r.guardian];
                  const max = Math.max(...result.rejections.map(x => x.count));
                  const pct = (r.count / max) * 100;
                  return (
                    <div key={r.guardian}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: meta.color }}>
                          {meta.gamma} · {meta.name.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{r.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="font-mono text-xs text-muted-foreground py-6 text-center">
              {result ? "No rejections — all signals cleared the guardian stack." : "Awaiting run."}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Guardian stack reference */}
      <GuardianStack />

      {/* Trade log */}
      <GlassCard className="p-4" data-testid="panel-trade-log">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-primary tracking-widest">
            TRADE LOG · {result?.trades.length ?? 0} EXECUTED
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">DETERMINISTIC · REPRODUCIBLE FROM HASH</div>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/30 sticky top-0 bg-background/95">
                <th className="py-2 pr-4">TICK</th>
                <th className="py-2 pr-4">SIDE</th>
                <th className="py-2 pr-4 text-right">SHARES</th>
                <th className="py-2 pr-4 text-right">PRICE</th>
                <th className="py-2 pr-4 text-right">EQUITY AFTER</th>
                <th className="py-2 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {(result?.trades ?? []).map((t, i) => (
                <tr key={i} className="border-b border-border/10 last:border-0">
                  <td className="py-1.5 pr-4 text-primary tabular-nums">{t.tick}</td>
                  <td className="py-1.5 pr-4" style={{ color: t.side === "BUY" ? "#00ffaa" : "#ff4466" }}>{t.side}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{t.shares}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">${(t.priceCents / 100).toFixed(2)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-foreground">${(t.equityAfter / 100).toFixed(2)}</td>
                  <td className="py-1.5 text-right tabular-nums" style={{ color: t.pnlCents > 0 ? "#00ffaa" : t.pnlCents < 0 ? "#ff4466" : "#9aa3b2" }}>
                    {t.side === "SELL" ? (t.pnlCents >= 0 ? "+" : "") + "$" + (t.pnlCents / 100).toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
              {(result?.trades.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">No executed trades — guardians may have blocked weak signals.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Past runs */}
      <GlassCard className="p-4" data-testid="panel-past-runs">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-primary tracking-widest flex items-center gap-2">
            <Save className="w-3.5 h-3.5" />
            PAST RUNS · {saved.length}
          </div>
          {saved.length > 0 && (
            <button
              onClick={() => { setSaved([]); localStorage.removeItem(STORAGE_KEY); }}
              className="text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors"
              data-testid="btn-bt-clear"
            >
              CLEAR
            </button>
          )}
        </div>
        {saved.length === 0 ? (
          <div className="text-xs font-mono text-muted-foreground py-4">No saved runs yet. Each RUN SIM persists its summary here.</div>
        ) : (
          <div className="divide-y divide-border/20 font-mono text-xs">
            {saved.map((r, i) => (
              <div key={i} className="py-2 flex items-center justify-between gap-3 hover:bg-primary/5 px-2 -mx-2 rounded">
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground/80 tabular-nums">{new Date(r.startedAt).toLocaleString(undefined, { hour12: false })}</span>
                  <span className="text-primary">{r.symbol}</span>
                  <span className="text-muted-foreground">{r.ticks}t</span>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: r.multiplier >= 1 ? "#00ffaa" : "#ff4466" }} className="tabular-nums">{fmtMul(r.multiplier)}</span>
                  <span className="text-muted-foreground tabular-nums">{fmtPct(r.winRate)} WR</span>
                  <span className="text-muted-foreground tabular-nums">{r.trades.filter(t => t.side === "SELL").length} closes</span>
                  {r.envelopeBreaches > 0 && <span className="text-destructive tabular-nums">{r.envelopeBreaches} breaches</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  color,
  testid,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub: string;
  color: string;
  testid: string;
}) {
  return (
    <GlassCard className="p-4" data-testid={testid}>
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        {label}
      </div>
      <div className="font-mono text-3xl tabular-nums" style={{ color }}>{value}</div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>
    </GlassCard>
  );
}
