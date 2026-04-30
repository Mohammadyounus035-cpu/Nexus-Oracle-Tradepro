export type AssetClass = 'EQUITY' | 'ETF' | 'CRYPTO' | 'FX' | 'FUTURES' | 'INDEX' | 'MACRO';
export type DataMode = 'HISTORICAL' | 'LIVE' | 'SIMULATED';
export type MarketInterval = '1m' | '5m' | '15m' | '1h' | '1d';

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
  interval: MarketInterval;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly mode: DataMode;
  fetchRange(params: MarketRangeRequest): Promise<MarketDataPoint[]>;
  subscribe?(symbols: string[], onTick: (tick: MarketDataPoint) => void): () => void;
}

export interface ValidationIssue {
  code:
    | 'INVALID_SYMBOL'
    | 'INVALID_TIMESTAMP'
    | 'INVALID_PRICE'
    | 'HIGH_BELOW_LOW'
    | 'OPEN_OUT_OF_RANGE'
    | 'CLOSE_OUT_OF_RANGE'
    | 'NEGATIVE_VOLUME'
    | 'PRICE_MUST_BE_CENTS';
  message: string;
}

export interface MarketDataValidation {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface NormalizedMarketData {
  point: MarketDataPoint;
  validation: MarketDataValidation;
}

