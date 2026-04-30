---
mode: agent
description: Implement the TradePro 96-path market ingestion, analysis, risk, and execution engine in TypeScript.
---

# TradePro 96-Path Engine Implementation Prompt

You are working in `Mohammadyounus035-cpu/Nexus-Oracle-Tradepro` on branch `main` or a feature branch targeting `main`.

Implement the full TradePro 96-path market engine plan in strict TypeScript code. Keep runtime behavior deterministic, typed, tested, and buildable. Do not produce prose-only output. Do not remove existing features unless replacing them with tested equivalents.

Primary target:

```text
src/lib/tradeEngine.ts
```

Reference and supporting files:

```text
src/lib/engine.ts
src/lib/realtimeMarketService.ts
src/lib/orderBook.ts
src/lib/riskManager.ts
src/lib/analyticsEngine.ts
src/lib/state.ts
src/lib/strategyEngine.ts
src/lib/integrity.ts
Omega 96 path map AI implementation documents.txt
96-path-lattice-analysis.md
node_map.json
node_legend.csv
docs/tradepro-96-path-implementation-plan.md
```

## Non-Negotiable Rules

Write code only for implementation changes:

```text
No trading advice.
No claims of guaranteed profit.
No hidden network calls.
No untyped any payloads in new code.
No floating account balances where integer cents are expected.
No order accepted without validation.
No execution without risk decision and proof payload.
No lattice state without traceable market data features.
```

## Required End-State Flow

```ts
MarketIngestion
  -> Normalization
  -> HistoricalLiveComparison
  -> LatticeMapping
  -> SignalScoring
  -> RiskGate
  -> OrderRouting
  -> Execution
  -> Proof
  -> Analytics;
```

## Phase 1: Market Data Ingestion

Create:

```text
src/lib/marketData/types.ts
src/lib/marketData/normalizer.ts
src/lib/marketData/historyStore.ts
src/lib/marketData/comparison.ts
src/lib/marketData/providers/simulatedProvider.ts
```

Implement:

```ts
export type AssetClass =
  | 'EQUITY'
  | 'ETF'
  | 'CRYPTO'
  | 'FX'
  | 'FUTURES'
  | 'INDEX'
  | 'MACRO';

export type DataMode = 'HISTORICAL' | 'LIVE' | 'SIMULATED';

export interface MarketDataPoint {
  symbol: string;
  venue: string;
  assetClass: AssetClass;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
  mode: DataMode;
}

export interface MarketRangeRequest {
  symbols: string[];
  start: string;
  end: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
}

export interface MarketDataProvider {
  readonly id: string;
  readonly mode: DataMode;
  fetchRange(params: MarketRangeRequest): Promise<MarketDataPoint[]>;
  subscribe?(symbols: string[], onTick: (tick: MarketDataPoint) => void): () => void;
}
```

Validation:

```ts
high >= low;
close <= high;
close >= low;
open > 0;
high > 0;
low > 0;
close > 0;
volume >= 0;
Number.isInteger(open);
Number.isInteger(high);
Number.isInteger(low);
Number.isInteger(close);
```

## Phase 2: 96-Path Lattice

Create:

```text
src/lib/lattice/types.ts
src/lib/lattice/registry.ts
src/lib/lattice/regime.ts
src/lib/lattice/marketMapper.ts
src/lib/lattice/guards.ts
```

Implement:

```ts
export type PathId = `P-${string}`;
export type Guardian = 'Lion' | 'Phoenix' | 'Dragon' | 'Owl' | 'Raven';
export type LatticePolarity = 'ANGELU' | 'DEMINU' | 'NEUTRAL' | 'DORMANT';
export type MarketRegime =
  | 'RISK_ON'
  | 'RISK_OFF'
  | 'LIQUIDITY_STRESS'
  | 'TRENDING'
  | 'MEAN_REVERTING'
  | 'UNKNOWN';

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

Registry rules:

```ts
const PATH_COUNT = 96;
const DEGREES_PER_PATH = 3.75;
const angleDeg = (index - 1) * DEGREES_PER_PATH;
```

Guardian arcs:

```ts
1..19 => 'Lion'
20..38 => 'Phoenix'
39..57 => 'Dragon'
58..76 => 'Owl'
77..96 => 'Raven'
```

## Phase 3: Rewrite `tradeEngine.ts`

Refactor to use typed events, typed execution context, validation-first submission, and proof-attached execution.

Implement:

```ts
export type OrderRejectReason =
  | 'INVALID_QTY'
  | 'INVALID_SYMBOL'
  | 'LIMIT_PRICE_REQUIRED'
  | 'STOP_PRICE_REQUIRED'
  | 'STOP_LIMIT_PRICES_REQUIRED'
  | 'RISK_BLOCKED'
  | 'NO_MARKET_DATA'
  | 'DORMANT_PATH_BLOCKED';

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
  reason?: OrderRejectReason;
}
```

Required behavior:

```ts
MARKET fills against current normalized quote.
LIMIT buy fills when close <= limitPrice.
LIMIT sell fills when close >= limitPrice.
STOP buy triggers when close >= stopPrice.
STOP sell triggers when close <= stopPrice.
STOP_LIMIT triggers at stopPrice and fills only if limit condition is satisfied.
Partial fill uses liquidity.maxExecutableQty.
Rejected orders do not enter the active order map.
Every trade gets canonical proof.
Every event is a discriminated union.
```

## Phase 4: Historical vs Live Comparison

Implement:

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

Calculations:

```ts
returnBps = ((currentClose - previousClose) / previousClose) * 10000;
zScore = historicalVolBps === 0 ? 0 : (liveReturnBps - historicalMeanBps) / historicalVolBps;
pathDrift = currentPath.index - historicalMedianPath.index;
regimeShift = currentRegime !== historicalDominantRegime;
```

## Phase 5: Risk, Proof, Analytics

Implement or extend:

```ts
export interface RiskCheck {
  id: string;
  status: 'pass' | 'warn' | 'block';
  message: string;
}

export interface RiskDecision {
  status: 'allow' | 'warn' | 'block';
  checks: RiskCheck[];
  maxExecutableQty: number;
}

export interface TradeProofPayload {
  order: EnhancedOrder;
  quote: MarketDataPoint;
  lattice: MarketLatticeState;
  risk: RiskDecision;
  trades: Trade[];
}
```

Use `canonicalHash` from `src/lib/integrity.ts` for proof determinism.

Add analytics:

```ts
fillsByPath;
slippageByPath;
rejectionsByReason;
riskBlocksByCheck;
realizedPnlByPath;
unrealizedPnlByPath;
regimePerformance;
```

## Phase 6: Tests and Finalization

Add tests for:

```text
market data normalization
deterministic simulated provider replay
96-path geometry
guardian arc mapping
dormant path blocking
historical/live comparison
market, limit, stop, stop-limit execution
partial fills
risk blocking
canonical proof determinism
analytics path attribution
```

Run:

```powershell
npm install
npm run build
npx tsc --noEmit
```

Commit:

```powershell
git checkout -b feature/tradepro-96-path-engine
git add .
git commit -m "Add TradePro 96-path engine implementation prompt"
git push -u origin feature/tradepro-96-path-engine
```

Open a PR into `main` with title:

```text
Implement 96-path market ingestion and execution engine plan
```

