import { MARKET_DATA_CONFIG } from '../../engine';
import { normalizeMarketDataPoint } from '../normalizer';
import { MarketDataPoint, MarketDataProvider, MarketRangeRequest } from '../types';

const INTERVAL_MS: Record<MarketRangeRequest['interval'], number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '1d': 86_400_000,
};

export class SimulatedMarketDataProvider implements MarketDataProvider {
  readonly id = 'deterministic-simulated-provider';
  readonly mode = 'SIMULATED' as const;
  private rngState: number;

  constructor(seed = 12345) {
    this.rngState = seed;
  }

  async fetchRange(params: MarketRangeRequest): Promise<MarketDataPoint[]> {
    const startMs = Date.parse(params.start);
    const endMs = Date.parse(params.end);
    const step = INTERVAL_MS[params.interval];
    const points: MarketDataPoint[] = [];

    for (const symbol of params.symbols) {
      const normalizedSymbol = symbol.toUpperCase();
      const config = MARKET_DATA_CONFIG[normalizedSymbol] ?? {
        symbol: normalizedSymbol,
        name: normalizedSymbol,
        basePrice: 10_000,
        volatility: 0.02,
        drift: 0.0001,
      };
      let previousClose = config.basePrice;

      for (let timestamp = startMs; timestamp <= endMs; timestamp += step) {
        const shock = this.boxMuller();
        const pctChange = config.drift + config.volatility * shock;
        const close = Math.max(1, Math.round(previousClose * (1 + pctChange)));
        const range = Math.max(1, Math.round(Math.abs(close - previousClose) + close * config.volatility * 0.25));
        const high = Math.max(previousClose, close) + range;
        const low = Math.max(1, Math.min(previousClose, close) - range);
        const normalized = normalizeMarketDataPoint({
          symbol: normalizedSymbol,
          timestamp,
          open: previousClose,
          high,
          low,
          close,
          volume: Math.round(10_000 + Math.abs(shock) * 25_000),
          source: this.id,
          mode: this.mode,
        });

        if (normalized.validation.ok) points.push(normalized.point);
        previousClose = close;
      }
    }

    return points;
  }

  subscribe(symbols: string[], onTick: (tick: MarketDataPoint) => void): () => void {
    const timers = symbols.map((symbol) => {
      let price = MARKET_DATA_CONFIG[symbol]?.basePrice ?? 10_000;
      return window.setInterval(() => {
        const shock = this.boxMuller();
        const close = Math.max(1, Math.round(price * (1 + 0.001 * shock)));
        const high = Math.max(price, close);
        const low = Math.min(price, close);
        const normalized = normalizeMarketDataPoint({
          symbol,
          timestamp: new Date(),
          open: price,
          high,
          low,
          close,
          volume: Math.round(1000 + Math.abs(shock) * 5000),
          source: this.id,
          mode: this.mode,
        });
        price = close;
        if (normalized.validation.ok) onTick(normalized.point);
      }, 1000);
    });

    return () => timers.forEach((timer) => window.clearInterval(timer));
  }

  private rng(): number {
    this.rngState = (this.rngState * 16807) % 2147483647;
    return (this.rngState - 1) / 2147483646;
  }

  private boxMuller(): number {
    const u1 = Math.max(this.rng(), Number.EPSILON);
    const u2 = this.rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

