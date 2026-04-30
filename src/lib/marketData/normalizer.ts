import {
  AssetClass,
  DataMode,
  MarketDataPoint,
  MarketDataValidation,
  NormalizedMarketData,
  ValidationIssue,
} from './types';

const DEFAULT_VENUE_BY_ASSET: Record<AssetClass, string> = {
  EQUITY: 'NASDAQ',
  ETF: 'ARCA',
  CRYPTO: 'GLOBAL',
  FX: 'GLOBAL',
  FUTURES: 'CME',
  INDEX: 'GLOBAL',
  MACRO: 'GLOBAL',
};

export interface RawMarketDataPoint {
  symbol: string;
  venue?: string;
  assetClass?: AssetClass;
  timestamp: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  source?: string;
  mode?: DataMode;
}

export function normalizeMarketDataPoint(raw: RawMarketDataPoint): NormalizedMarketData {
  const assetClass = raw.assetClass ?? inferAssetClass(raw.symbol);
  const point: MarketDataPoint = {
    symbol: normalizeSymbol(raw.symbol),
    venue: raw.venue ?? DEFAULT_VENUE_BY_ASSET[assetClass],
    assetClass,
    timestamp: normalizeTimestamp(raw.timestamp),
    open: Math.round(raw.open),
    high: Math.round(raw.high),
    low: Math.round(raw.low),
    close: Math.round(raw.close),
    volume: Math.max(0, Math.round(raw.volume ?? 0)),
    source: raw.source ?? 'unknown',
    mode: raw.mode ?? 'SIMULATED',
  };

  return {
    point,
    validation: validateMarketDataPoint(point),
  };
}

export function validateMarketDataPoint(point: MarketDataPoint): MarketDataValidation {
  const issues: ValidationIssue[] = [];

  if (!/^[A-Z0-9._-]{1,20}$/.test(point.symbol)) {
    issues.push({ code: 'INVALID_SYMBOL', message: 'Symbol must be normalized uppercase market identifier.' });
  }

  if (Number.isNaN(Date.parse(point.timestamp))) {
    issues.push({ code: 'INVALID_TIMESTAMP', message: 'Timestamp must parse as ISO-8601.' });
  }

  const prices = [point.open, point.high, point.low, point.close];
  if (prices.some((price) => price <= 0 || !Number.isFinite(price))) {
    issues.push({ code: 'INVALID_PRICE', message: 'OHLC prices must be positive finite integer cents.' });
  }

  if (prices.some((price) => !Number.isInteger(price))) {
    issues.push({ code: 'PRICE_MUST_BE_CENTS', message: 'OHLC prices must be integer cents.' });
  }

  if (point.high < point.low) {
    issues.push({ code: 'HIGH_BELOW_LOW', message: 'High cannot be below low.' });
  }

  if (point.open > point.high || point.open < point.low) {
    issues.push({ code: 'OPEN_OUT_OF_RANGE', message: 'Open must sit inside high/low range.' });
  }

  if (point.close > point.high || point.close < point.low) {
    issues.push({ code: 'CLOSE_OUT_OF_RANGE', message: 'Close must sit inside high/low range.' });
  }

  if (point.volume < 0) {
    issues.push({ code: 'NEGATIVE_VOLUME', message: 'Volume cannot be negative.' });
  }

  return { ok: issues.length === 0, issues };
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function inferAssetClass(symbol: string): AssetClass {
  const normalized = normalizeSymbol(symbol);
  if (normalized === 'BTC' || normalized === 'ETH' || normalized.includes('-USD')) return 'CRYPTO';
  if (normalized.startsWith('^')) return 'INDEX';
  if (normalized.length === 6 && /^[A-Z]{6}$/.test(normalized)) return 'FX';
  return 'EQUITY';
}

function normalizeTimestamp(timestamp: string | number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString();
}

