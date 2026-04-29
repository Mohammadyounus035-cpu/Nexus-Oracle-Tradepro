# TradePro 96-Path Market Engine Implementation Plan

Target repository: `Mohammadyounus035-cpu/Nexus-Oracle-Tradepro`
Target branch: `main`
Primary file: `src/lib/tradeEngine.ts`
Supporting files: `src/lib/engine.ts`, `src/lib/realtimeMarketService.ts`, `src/lib/orderBook.ts`, `src/lib/riskManager.ts`, `src/lib/analyticsEngine.ts`, `src/lib/state.ts`, `src/lib/strategyEngine.ts`, `src/lib/integrity.ts`
Reference corpus: `Omega 96 path map AI implementation documents.txt`, `96-path-lattice-analysis.md`, `node_map.json`, `node_legend.csv`

## Objective

Refactor TradePro into a typed, deterministic, market-aware execution engine that can ingest global historical and live market data, compare both streams, map market state into the 96-path lattice, route decisions through risk and proof layers, and remain testable for a 30-year simulation horizon.

Keep the implementation strictly code-first. No speculative claims, no trading advice, no UI copy, no prose-heavy runtime responses. Every phase must produce TypeScript modules, tests, fixtures, or typed configuration.

## Architecture Contract

The engine must expose a clean flow:

```ts
MarketIngestion -> Normalization -> HistoricalLiveComparison -> LatticeMapping -> SignalScoring -> RiskGate -> OrderRouting -> Execution -> Proof -> Analytics
```

Core invariants:

```ts
type PathId = `P-${string}`;
type Guardian = 'Lion' | 'Phoenix' | 'Dragon' | 'Owl' | 'Raven';
type LatticePolarity = 'ANGELU' | 'DEMINU' | 'NEUTRAL' | 'DORMANT';
type MarketRegime = 'RISK_ON' | 'RISK_OFF' | 'LIQUIDITY_STRESS' | 'TRENDING' | 'MEAN_REVERTING' | 'UNKNOWN';
type DataMode = 'HISTORICAL' | 'LIVE' | 'SIMULATED';
```

Execution must stay deterministic under a seed, preserve cents-based pricing, avoid floating account drift in portfolio math, and reject malformed orders before they enter the order map.

## Phase 1: Global Market Data Ingestion

Build a market data substrate that can run for 30-year historical simulations and switch to live feeds without changing `tradeEngine.ts`.

Required code:

```ts
export interface MarketDataPoint {
  symbol: string;
  venue: string;
  assetClass: 'EQUITY' | 'ETF' | 'CRYPTO' | 'FX' | 'FUTURES' | 'INDEX' | 'MACRO';
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
  mode: DataMode;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly mode: DataMode;
  fetchRange(params: MarketRangeRequest): Promise<MarketDataPoint[]>;
  subscribe?(symbols: string[], onTick: (tick: MarketDataPoint) => void): () => void;
}
```

Implementation tasks:

1. Add `src/lib/marketData/types.ts` for provider contracts and validation result types.
2. Add `src/lib/marketData/normalizer.ts` to normalize timestamps, symbols, asset classes, split-adjusted prices, volume, and source identifiers.
3. Add `src/lib/marketData/providers/simulatedProvider.ts` using deterministic seeded generation for equities, crypto, indexes, and macro proxies.
4. Add `src/lib/marketData/historyStore.ts` with append-only candles and bounded in-memory retention.
5. Add `src/lib/marketData/comparison.ts` to compare historical baselines against live or simulated data.
6. Add tests for malformed timestamps, negative volume, zero prices, symbol casing, deterministic replay, and missing candles.

Refinement checks:

```ts
if (point.high < point.low) reject('HIGH_BELOW_LOW');
if (point.close > point.high || point.close < point.low) reject('CLOSE_OUT_OF_RANGE');
if (point.volume < 0) reject('NEGATIVE_VOLUME');
if (!Number.isInteger(point.close)) reject('PRICE_MUST_BE_CENTS');
```

## Phase 2: 96-Path Lattice Mapping

Map market observations into the 96-path registry without mixing symbolic labels into execution math.

Required code:

```ts
export interface LatticePath {
  id: PathId;
  index: number;
  angleDeg: number;
  guardian: Guardian;
  polarity: LatticePolarity;
  confidence: number;
  active: boolean;
  domain?: string;
  category?: string;
}

export interface MarketLatticeState {
  timestamp: string;
  symbol: string;
  path: LatticePath;
  regime: MarketRegime;
  momentumScore: number;
  volatilityScore: number;
  liquidityScore: number;
  anomalyScore: number;
  confidence: number;
}
```

Implementation tasks:

1. Add `src/lib/lattice/registry.ts` with all 96 typed paths.
2. Add `src/lib/lattice/marketMapper.ts` to convert returns, volatility, volume, drawdown, and correlation into a path index.
3. Add `src/lib/lattice/regime.ts` for market regime classification.
4. Add `src/lib/lattice/guards.ts` for active/dormant gating, confidence thresholds, and fallback behavior.
5. Add tests verifying `96 * 3.75 === 360`, guardian arc coverage, dormant path handling, and stable mapping for seeded datasets.

Refinement checks:

```ts
const angleDeg = (path.index - 1) * 3.75;
const normalized = ((angleDeg % 360) + 360) % 360;
```

Phase 2 is complete only when every lattice state is traceable back to raw market data, normalized features, registry path, and risk decision.

## Phase 3: Trade Engine Rewrite

Refactor `src/lib/tradeEngine.ts` into a validation-first execution engine.

Required code:

```ts
export interface ExecutionContext {
  quote: MarketDataPoint;
  lattice: MarketLatticeState;
  risk: RiskDecision;
  liquidity: LiquiditySnapshot;
  now: string;
}

export interface ExecutionResult {
  order: EnhancedOrder;
  trades: Trade[];
  lattice: MarketLatticeState;
  accepted: boolean;
  reason?: string;
}
```

Implementation tasks:

1. Replace `any` event payloads with discriminated union event types.
2. Add explicit order rejection statuses instead of overloading `CANCELLED`.
3. Support `STOP_LIMIT` only after `OrderType` is expanded in `engine.ts`.
4. Add partial-fill policy that uses liquidity and max participation.
5. Move trade id generation to a deterministic helper.
6. Execute against normalized market data, not raw `currentPrice`.
7. Attach lattice state and canonical proof to each execution.

Refinement checks:

```ts
if (order.qty <= 0) reject('INVALID_QTY');
if (order.type === 'LIMIT' && !order.limitPrice) reject('LIMIT_PRICE_REQUIRED');
if (order.type === 'STOP' && !order.stopPrice) reject('STOP_PRICE_REQUIRED');
if (order.type === 'STOP_LIMIT' && (!order.stopPrice || !order.limitPrice)) reject('STOP_LIMIT_PRICES_REQUIRED');
```

## Phase 4: Historical vs Live Analysis Flow

Create a structured analysis pipeline that compares live movement with historical analogs before signals reach the execution layer.

Required code:

```ts
export interface HistoricalLiveComparison {
  symbol: string;
  timestamp: string;
  lookbackDays: number;
  liveReturnBps: number;
  historicalMeanBps: number;
  historicalVolBps: number;
  zScore: number;
  percentileRank: number;
  pathDrift: number;
  regimeShift: boolean;
}
```

Implementation tasks:

1. Add rolling statistics for returns, volatility, volume, spread proxy, and drawdown.
2. Add z-score and percentile comparison.
3. Add path drift: current path index minus historical median path index.
4. Add regime transition matrix.
5. Add anomaly flags for discontinuities, liquidity gaps, and volatility shock.
6. Add tests for known synthetic history windows.

## Phase 5: Risk, Compliance, Proof, and Analytics

Gate every execution through risk and canonical proof layers.

Implementation tasks:

1. Add pre-trade risk decision shape:

```ts
export interface RiskDecision {
  status: 'allow' | 'warn' | 'block';
  checks: RiskCheck[];
  maxExecutableQty: number;
}
```

2. Integrate risk checks before `orders.set`.
3. Add proof payload that includes order, normalized quote, lattice state, risk decision, and execution result.
4. Use `canonicalHash` from `src/lib/integrity.ts`.
5. Extend analytics with path-level performance: fill rate, slippage, rejected orders, risk blocks, realized/unrealized PnL by path.
6. Add tests for proof determinism and risk block behavior.

## Phase 6: Finalization and Repository Readiness

Finish with a PR-ready codebase.

Required checks:

```powershell
npm install
npm run build
npx tsc --noEmit
```

Required repository artifacts:

1. `src/lib/marketData/*`
2. `src/lib/lattice/*`
3. Updated `src/lib/engine.ts`
4. Updated `src/lib/tradeEngine.ts`
5. Updated `src/lib/riskManager.ts`
6. Updated `src/lib/analyticsEngine.ts`
7. Tests for phases 1 through 6
8. `.github/prompts/tradepro-96-path-engine.prompt.md`
9. This plan

PR title:

```text
Implement 96-path market ingestion and execution engine plan
```

PR body:

```text
Adds a Copilot-ready phase plan for upgrading TradePro tradeEngine.ts into a 96-path market analysis and execution pipeline.

Scope:
- Phase 1 global market ingestion architecture
- Phase 2 96-path lattice mapping
- Phase 3 trade engine rewrite contract
- Phase 4 historical/live comparison flow
- Phase 5 risk, proof, analytics integration
- Phase 6 final verification checklist
```

