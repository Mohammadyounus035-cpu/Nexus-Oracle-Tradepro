export class Money {
  constructor(public cents: number) {}
  
  get dollars() {
    return this.cents / 100;
  }
  
  format() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.dollars);
  }
}

export interface Quote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
  changePercent: number;
  history: number[];
}

export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  initial: number;
  vol: number;
  custom?: boolean;
}

const DEFAULT_STOCKS: StockMeta[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", initial: 18500, vol: 0.015 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", initial: 14200, vol: 0.018 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", initial: 37800, vol: 0.012 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", initial: 17800, vol: 0.020 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical", initial: 24800, vol: 0.035 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", initial: 50500, vol: 0.022 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", initial: 87500, vol: 0.028 },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services", initial: 62800, vol: 0.025 }
];

export class MockPriceGenerator {
  private prices = new Map<string, number>();
  private histories = new Map<string, number[]>();
  private initialPrices = new Map<string, number>();
  private stocks: StockMeta[] = [];

  constructor() {
    DEFAULT_STOCKS.forEach(stock => this.seedStock(stock));
  }

  private seedStock(stock: StockMeta) {
    this.stocks.push(stock);
    this.initialPrices.set(stock.symbol, stock.initial);

    const history = [stock.initial];
    let current = stock.initial;
    for (let i = 0; i < 120; i++) {
      const shock = 1 + (Math.random() - 0.5) * stock.vol;
      current = Math.round(current * shock);
      history.push(current);
    }
    this.histories.set(stock.symbol, history);
    this.prices.set(stock.symbol, current);
  }

  getStocks() {
    return this.stocks;
  }

  hasSymbol(symbol: string) {
    return this.prices.has(symbol);
  }

  addStock(symbol: string, name: string, sector: string, initialDollars: number, vol: number): boolean {
    const sym = symbol.trim().toUpperCase();
    if (!sym || this.hasSymbol(sym)) return false;
    const cents = Math.max(1, Math.round(initialDollars * 100));
    const safeVol = Math.min(0.2, Math.max(0.001, vol));
    this.seedStock({ symbol: sym, name: name || sym, sector: sector || "Custom", initial: cents, vol: safeVol, custom: true });
    return true;
  }

  removeStock(symbol: string): boolean {
    const idx = this.stocks.findIndex(s => s.symbol === symbol);
    if (idx === -1 || !this.stocks[idx].custom) return false;
    this.stocks.splice(idx, 1);
    this.prices.delete(symbol);
    this.histories.delete(symbol);
    this.initialPrices.delete(symbol);
    return true;
  }

  tick() {
    this.stocks.forEach(stock => {
      const current = this.prices.get(stock.symbol)!;
      const shock = 1 + (Math.random() - 0.5) * stock.vol;
      const next = Math.round(current * shock);
      this.prices.set(stock.symbol, next);
      
      const history = this.histories.get(stock.symbol)!;
      history.push(next);
      if (history.length > 120) history.shift();
    });
  }

  getQuote(symbol: string): Quote {
    const price = this.prices.get(symbol)!;
    const initial = this.initialPrices.get(symbol)!;
    const spread = Math.round(price * 0.001);
    
    return {
      symbol,
      price,
      bid: price - spread,
      ask: price + spread,
      volume: Math.floor(Math.random() * 10000),
      timestamp: Date.now(),
      changePercent: ((price - initial) / initial) * 100,
      history: this.histories.get(symbol)!
    };
  }
}
