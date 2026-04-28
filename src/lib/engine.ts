/**
 * engine.ts — Market Data & Trade Execution Engine
 */

export interface StockConfig {
  symbol: string;
  name: string;
  basePrice: number; // in cents
  volatility: number;
  drift: number;
}

export interface Quote {
  symbol: string;
  price: number; // cents
  change: number;
  changePercent: number;
  timestamp: string;
}

export const MARKET_DATA_CONFIG: Record<string, StockConfig> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 17542, volatility: 0.015, drift: 0.0005 },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 88212, volatility: 0.025, drift: 0.001 },
  TSLA: { symbol: 'TSLA', name: 'Tesla, Inc.', basePrice: 16847, volatility: 0.03, drift: -0.0002 },
  BTC: { symbol: 'BTC', name: 'Bitcoin', basePrice: 6543200, volatility: 0.04, drift: 0.0008 },
};

export class MarketDataEngine {
  private prices: Map<string, number> = new Map();
  private history: Map<string, number[]> = new Map();
  private rngState: number;

  constructor(seed: number = 12345) {
    this.rngState = seed;
    Object.keys(MARKET_DATA_CONFIG).forEach(sym => {
      this.prices.set(sym, MARKET_DATA_CONFIG[sym].basePrice);
      this.history.set(sym, Array.from({ length: 50 }, () => MARKET_DATA_CONFIG[sym].basePrice));
    });
  }

  private rng(): number {
    this.rngState = (this.rngState * 16807 + 0) % 2147483647;
    return (this.rngState - 1) / 2147483646;
  }

  private boxMuller(): number {
    const u1 = this.rng();
    const u2 = this.rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  tick(): Map<string, Quote> {
    const quotes = new Map<string, Quote>();
    Object.keys(MARKET_DATA_CONFIG).forEach(sym => {
      const config = MARKET_DATA_CONFIG[sym];
      const current = this.prices.get(sym)!;
      
      // Geometric Brownian Motion
      const shock = this.boxMuller();
      const pctChange = config.drift + config.volatility * shock;
      const next = Math.max(1, Math.round(current * (1 + pctChange)));
      
      this.prices.set(sym, next);
      const hist = this.history.get(sym)!;
      hist.push(next);
      if (hist.length > 100) hist.shift();

      quotes.set(sym, {
        symbol: sym,
        price: next,
        change: next - config.basePrice,
        changePercent: ((next - config.basePrice) / config.basePrice) * 100,
        timestamp: new Date().toISOString(),
      });
    });
    return quotes;
  }

  getHistory(symbol: string): number[] {
    return this.history.get(symbol) || [];
  }

  getPrice(symbol: string): number {
    return this.prices.get(symbol) || 0;
  }
}

// --- Trade Engine Types ---

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  limitPrice?: number;
  stopPrice?: number;
  timestamp: string;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  price: number;
  timestamp: string;
  proof: string; // signature
}
