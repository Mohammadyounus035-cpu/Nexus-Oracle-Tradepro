import { MarketDataPoint } from './types';

export class MarketHistoryStore {
  private candles = new Map<string, MarketDataPoint[]>();

  constructor(private readonly maxPointsPerSymbol = 7560) {}

  append(point: MarketDataPoint): void {
    const history = this.candles.get(point.symbol) ?? [];
    history.push(point);
    history.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    if (history.length > this.maxPointsPerSymbol) {
      history.splice(0, history.length - this.maxPointsPerSymbol);
    }
    this.candles.set(point.symbol, history);
  }

  appendMany(points: MarketDataPoint[]): void {
    for (const point of points) this.append(point);
  }

  get(symbol: string, limit?: number): MarketDataPoint[] {
    const history = this.candles.get(symbol.toUpperCase()) ?? [];
    return typeof limit === 'number' ? history.slice(-limit) : [...history];
  }

  latest(symbol: string): MarketDataPoint | undefined {
    const history = this.candles.get(symbol.toUpperCase());
    return history?.[history.length - 1];
  }

  clear(symbol?: string): void {
    if (symbol) {
      this.candles.delete(symbol.toUpperCase());
      return;
    }
    this.candles.clear();
  }
}

