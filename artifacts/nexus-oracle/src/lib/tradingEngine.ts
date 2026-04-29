// ============================================================================
// Nexus Oracle Trading Engine — port of OMEGA Phase 1 + Phase 2
//
// Pipeline:
//   Market Data → Phase 1 Analysis → Lattice State (hist vs live)
//                → Signal Engine → Guardian Validation
//                → Execution Decision → Trade Engine
//
// Deterministic. Auditable. Public-key-signable.
// ============================================================================

import { sha256Hex, stableStringify } from "./latticeEngine";

export type Guardian = "lion" | "phoenix" | "dragon" | "owl" | "raven";
export type Polarity = -1 | 0 | 1;
export type Regime = "stable" | "transition" | "volatile" | "anomaly";
export type TradeAction = "buy" | "sell" | "hold";

export interface LatticeState {
  pathId: number; // 1..96
  polarity: Polarity;
  strength: number; // 0..1
  guardian: Guardian;
}

export interface AnalysisOutput {
  symbol: string;
  historicalState: LatticeState;
  liveState: LatticeState;
  drift: number;
  regime: Regime;
  hash: string;
}

export interface TradeSignal {
  symbol: string;
  action: TradeAction;
  confidence: number; // 0..1
  size: number; // 0..1
  regime: Regime;
  pathId: number;
  reason: string;
}

export const GUARDIAN_LABELS: Record<string, { name: string; role: string; gamma: string; color: string }> = {
  owl: { name: "Owl", role: "Logic Consistency", gamma: "Γ1", color: "#00d4ff" },
  raven: { name: "Raven", role: "Anomaly Detection", gamma: "Γ2", color: "#ff00aa" },
  phoenix: { name: "Phoenix", role: "Adaptation Check", gamma: "Γ3", color: "#ffaa00" },
  dragon: { name: "Dragon", role: "Energy / Momentum", gamma: "Γ4", color: "#00ffaa" },
  lion: { name: "Lion", role: "Final Authority", gamma: "Γ5", color: "#ffe066" },
};

// ---------------------------------------------------------------------------
// FEATURE EXTRACTION
// ---------------------------------------------------------------------------

export function computeFeatures(prices: number[]): { returns: number; volatility: number } {
  if (prices.length < 2) return { returns: 0, volatility: 0 };
  const returns = (prices[prices.length - 1] - prices[0]) / prices[0];
  const diffs: number[] = [];
  for (let i = 1; i < prices.length; i++) diffs.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / diffs.length;
  return { returns, volatility: Math.sqrt(variance) };
}

// ---------------------------------------------------------------------------
// 96-PATH LATTICE MAPPING
// ---------------------------------------------------------------------------

export function mapToLattice(features: { returns: number; volatility: number; volume: number }): LatticeState {
  const r = Math.tanh(features.returns * 5);
  const v = Math.tanh(features.volatility * 10);
  const vol = Math.tanh(features.volume / 10000);
  const score = r * 0.5 + v * 0.3 + vol * 0.2;
  const pathId = Math.min(96, Math.max(1, Math.floor(((score + 1) / 2) * 96)));
  const polarity: Polarity = score > 0.2 ? 1 : score < -0.2 ? -1 : 0;
  const guardian: Guardian =
    pathId <= 19 ? "lion" : pathId <= 38 ? "phoenix" : pathId <= 57 ? "dragon" : pathId <= 76 ? "owl" : "raven";
  return { pathId, polarity, strength: Math.min(1, Math.abs(score)), guardian };
}

// ---------------------------------------------------------------------------
// DRIFT + REGIME
// ---------------------------------------------------------------------------

export function computeDrift(hist: LatticeState, live: LatticeState): number {
  const pathDiff = Math.abs(hist.pathId - live.pathId) / 96;
  const polarityDiff = hist.polarity === live.polarity ? 0 : 1;
  const strengthDiff = Math.abs(hist.strength - live.strength);
  return pathDiff * 0.5 + polarityDiff * 0.3 + strengthDiff * 0.2;
}

export function classifyRegime(drift: number): Regime {
  if (drift < 0.15) return "stable";
  if (drift < 0.35) return "transition";
  if (drift < 0.65) return "volatile";
  return "anomaly";
}

// ---------------------------------------------------------------------------
// FULL ANALYSIS
// ---------------------------------------------------------------------------

export async function runAnalysis(params: {
  symbol: string;
  historicalPrices: number[];
  livePrices: number[];
  volume: number;
}): Promise<AnalysisOutput> {
  const histF = computeFeatures(params.historicalPrices);
  const liveF = computeFeatures(params.livePrices);
  const historicalState = mapToLattice({ ...histF, volume: params.volume });
  const liveState = mapToLattice({ ...liveF, volume: params.volume });
  const drift = computeDrift(historicalState, liveState);
  const regime = classifyRegime(drift);
  const payload = { symbol: params.symbol, historicalState, liveState, drift, regime };
  const hash = await sha256Hex(stableStringify(payload));
  return { ...payload, hash };
}

// Synchronous fast variant used inside backtest hot loops (skips canonical hash).
export function runAnalysisSync(params: {
  symbol: string;
  historicalPrices: number[];
  livePrices: number[];
  volume: number;
}): Omit<AnalysisOutput, "hash"> {
  const histF = computeFeatures(params.historicalPrices);
  const liveF = computeFeatures(params.livePrices);
  const historicalState = mapToLattice({ ...histF, volume: params.volume });
  const liveState = mapToLattice({ ...liveF, volume: params.volume });
  const drift = computeDrift(historicalState, liveState);
  const regime = classifyRegime(drift);
  return { symbol: params.symbol, historicalState, liveState, drift, regime };
}

// ---------------------------------------------------------------------------
// SIGNAL ENGINE
// ---------------------------------------------------------------------------

export function generateSignal(a: Omit<AnalysisOutput, "hash">): TradeSignal {
  const { liveState, regime, symbol } = a;
  let action: TradeAction = "hold";
  let confidence = 0;
  let size = 0;
  let reason = "";

  if (regime === "stable") {
    if (liveState.polarity === 1) {
      action = "buy";
      confidence = 0.6 + liveState.strength * 0.4;
      size = 0.4 + liveState.strength * 0.6;
      reason = "stable_positive";
    } else if (liveState.polarity === -1) {
      action = "sell";
      confidence = 0.6 + liveState.strength * 0.4;
      size = 0.4 + liveState.strength * 0.6;
      reason = "stable_negative";
    } else {
      reason = "stable_neutral";
    }
  } else if (regime === "transition") {
    confidence = 0.35;
    size = 0.15;
    reason = "transition_reduce";
  } else if (regime === "volatile") {
    confidence = 0.15;
    size = 0.05;
    reason = "volatile_capital_preservation";
  } else {
    reason = "anomaly_block";
  }

  // Layer 1 — Drift penalty: high drift erodes confidence even within a regime.
  confidence = Math.max(0, confidence - a.drift * 0.25);

  return { symbol, action, confidence, size, regime, pathId: liveState.pathId, reason };
}

// ---------------------------------------------------------------------------
// SOVEREIGN GUARDIANS — Γ1..Γ5
// ---------------------------------------------------------------------------

export interface GuardianResult {
  guardian: Guardian;
  gamma: string;
  passed: boolean;
  reason?: string;
}

export interface ValidationResult {
  approved: boolean;
  rejectionReason?: string;
  rejectingGuardian?: Guardian;
  results: GuardianResult[];
}

export function validateSignal(signal: TradeSignal): ValidationResult {
  const results: GuardianResult[] = [];

  // Γ1 — Owl (logic consistency)
  if (signal.confidence < 0 || signal.confidence > 1) {
    results.push({ guardian: "owl", gamma: "Γ1", passed: false, reason: "Invalid confidence bounds" });
    return finalize(results);
  }
  results.push({ guardian: "owl", gamma: "Γ1", passed: true });

  // Γ2 — Raven (anomaly detection)
  if (signal.regime === "anomaly") {
    results.push({ guardian: "raven", gamma: "Γ2", passed: false, reason: "Blocked: anomaly regime" });
    return finalize(results);
  }
  results.push({ guardian: "raven", gamma: "Γ2", passed: true });

  // Γ3 — Phoenix (adaptation)
  if (signal.regime === "transition" && signal.size > 0.3) {
    results.push({ guardian: "phoenix", gamma: "Γ3", passed: false, reason: "Position too large in transition" });
    return finalize(results);
  }
  results.push({ guardian: "phoenix", gamma: "Γ3", passed: true });

  // Γ4 — Dragon (energy / momentum)
  if (signal.confidence < 0.3 && signal.action !== "hold") {
    results.push({ guardian: "dragon", gamma: "Γ4", passed: false, reason: "Insufficient signal strength" });
    return finalize(results);
  }
  results.push({ guardian: "dragon", gamma: "Γ4", passed: true });

  // Γ5 — Lion (final authority)
  results.push({ guardian: "lion", gamma: "Γ5", passed: true });
  return { approved: true, results };
}

function finalize(results: GuardianResult[]): ValidationResult {
  const failed = results.find(r => !r.passed)!;
  return {
    approved: false,
    rejectingGuardian: failed.guardian,
    rejectionReason: failed.reason,
    results,
  };
}

// ---------------------------------------------------------------------------
// EXECUTION BRIDGE
// ---------------------------------------------------------------------------

export interface ExecutionDecision {
  status: "executed" | "rejected" | "no_action";
  signal: TradeSignal;
  validation: ValidationResult;
  shares: number;
  side?: "BUY" | "SELL";
  reason: string;
}

export function decideExecution(analysis: Omit<AnalysisOutput, "hash">, equityCents: number, priceCents: number): ExecutionDecision {
  const signal = generateSignal(analysis);
  const validation = validateSignal(signal);

  if (!validation.approved) {
    return {
      status: "rejected",
      signal,
      validation,
      shares: 0,
      reason: validation.rejectionReason ?? "rejected",
    };
  }

  if (signal.action === "hold") {
    return { status: "no_action", signal, validation, shares: 0, reason: signal.reason };
  }

  // Position sizing: signal.size ∈ [0,1] of equity, divided by price (cents).
  const targetCents = Math.floor(equityCents * signal.size);
  const shares = priceCents > 0 ? Math.max(1, Math.floor(targetCents / priceCents)) : 0;

  return {
    status: "executed",
    signal,
    validation,
    shares,
    side: signal.action === "buy" ? "BUY" : "SELL",
    reason: signal.reason,
  };
}

// ---------------------------------------------------------------------------
// DETERMINISTIC BACKTEST
// ---------------------------------------------------------------------------

export interface BacktestTradeRecord {
  tick: number;
  side: "BUY" | "SELL";
  shares: number;
  priceCents: number;
  equityAfter: number;
  pnlCents: number;
}

export interface BacktestResult {
  ticks: number;
  startedAt: string;
  finishedAt: string;
  finalEquity: number;
  startEquity: number;
  multiplier: number;
  winRate: number;
  trades: BacktestTradeRecord[];
  actionableSignals: number;
  envelopeBreaches: number;
  rejections: { guardian: Guardian; count: number }[];
  equityCurve: { tick: number; equity: number }[];
  regimeHistory: Regime[];
  hash: string;
}

// Deterministic LCG seeded by the run config — same input ⇒ same prices ⇒ same result.
function lcg(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export async function runBacktest(opts: {
  symbol: string;
  ticks: number;
  startEquity?: number;
  seed?: number;
  initialPriceCents?: number;
}): Promise<BacktestResult> {
  const ticks = Math.max(10, Math.min(2000, opts.ticks));
  const startEquity = opts.startEquity ?? 100_000_00;
  const seed = opts.seed ?? hashSeed(opts.symbol);
  const rand = lcg(seed);
  const startedAt = new Date().toISOString();

  // Synthesize a deterministic price walk + a "historical baseline" shifted earlier.
  let price = opts.initialPriceCents ?? 15000;
  const allPrices: number[] = [price];
  for (let i = 1; i < ticks + 60; i++) {
    const drift = (rand() - 0.5) * 0.02;
    const shock = rand() < 0.04 ? (rand() - 0.5) * 0.08 : 0;
    price = Math.max(100, Math.round(price * (1 + drift + shock)));
    allPrices.push(price);
  }

  let equity = startEquity;
  let position = 0; // shares held
  let entryCents = 0;
  const trades: BacktestTradeRecord[] = [];
  const equityCurve: { tick: number; equity: number }[] = [];
  const regimeHistory: Regime[] = [];
  const rejByGuardian: Record<Guardian, number> = { owl: 0, raven: 0, phoenix: 0, dragon: 0, lion: 0 };
  let actionable = 0;
  let breaches = 0;

  for (let t = 0; t < ticks; t++) {
    const window = allPrices.slice(t, t + 30);
    const histWindow = allPrices.slice(t + 30, t + 60);
    const livePrice = histWindow[histWindow.length - 1];

    const analysis = runAnalysisSync({
      symbol: opts.symbol,
      historicalPrices: window,
      livePrices: histWindow,
      volume: 5000 + Math.floor(rand() * 8000),
    });
    regimeHistory.push(analysis.regime);

    if (analysis.regime === "anomaly" || analysis.drift > 0.55) breaches++;

    const decision = decideExecution(analysis, equity, livePrice);

    if (decision.status === "rejected" && decision.validation.rejectingGuardian) {
      rejByGuardian[decision.validation.rejectingGuardian]++;
    }

    if (decision.status === "executed") {
      actionable++;
      const cost = decision.shares * livePrice;
      if (decision.side === "BUY") {
        if (cost <= equity) {
          equity -= cost;
          position += decision.shares;
          entryCents = livePrice;
          trades.push({ tick: t, side: "BUY", shares: decision.shares, priceCents: livePrice, equityAfter: equity, pnlCents: 0 });
        }
      } else if (decision.side === "SELL" && position > 0) {
        const sellShares = Math.min(position, decision.shares);
        const proceeds = sellShares * livePrice;
        const pnl = (livePrice - entryCents) * sellShares;
        equity += proceeds;
        position -= sellShares;
        trades.push({ tick: t, side: "SELL", shares: sellShares, priceCents: livePrice, equityAfter: equity, pnlCents: pnl });
      }
    }

    const markEquity = equity + position * livePrice;
    equityCurve.push({ tick: t, equity: markEquity });
  }

  // Close any open position at the last price for a clean equity number
  if (position > 0) {
    const last = allPrices[ticks + 59];
    const proceeds = position * last;
    const pnl = (last - entryCents) * position;
    equity += proceeds;
    trades.push({ tick: ticks - 1, side: "SELL", shares: position, priceCents: last, equityAfter: equity, pnlCents: pnl });
    position = 0;
  }

  const wins = trades.filter(t => t.side === "SELL" && t.pnlCents > 0).length;
  const sells = trades.filter(t => t.side === "SELL").length;
  const winRate = sells > 0 ? wins / sells : 0;
  const finalEquity = equity;
  const multiplier = finalEquity / startEquity;
  const finishedAt = new Date().toISOString();

  const rejections = (Object.entries(rejByGuardian) as [Guardian, number][])
    .filter(([, c]) => c > 0)
    .map(([guardian, count]) => ({ guardian, count }));

  const summary = {
    symbol: opts.symbol,
    ticks,
    seed,
    finalEquity,
    multiplier,
    winRate,
    actionable,
    breaches,
    rejections,
  };
  const hash = await sha256Hex(stableStringify(summary));

  return {
    ticks,
    startedAt,
    finishedAt,
    finalEquity,
    startEquity,
    multiplier,
    winRate,
    trades,
    actionableSignals: actionable,
    envelopeBreaches: breaches,
    rejections,
    equityCurve,
    regimeHistory,
    hash,
  };
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
