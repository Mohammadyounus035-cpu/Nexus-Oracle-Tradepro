import { Quote, Money } from "./marketData";

export interface Position {
  symbol: string;
  shares: number;
  averageEntryPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  shares: number;
  price: number;
  timestamp: number;
}

export class PortfolioManager {
  public cash: number = 10000000;
  public positions = new Map<string, Position>();
  public trades: Trade[] = [];

  executeOrder(symbol: string, side: "BUY" | "SELL", shares: number, currentPrice: number) {
    const cost = shares * currentPrice;
    
    if (side === "BUY" && this.cash < cost) {
      throw new Error("Insufficient funds");
    }
    
    const pos = this.positions.get(symbol) || { symbol, shares: 0, averageEntryPrice: 0 };
    
    if (side === "SELL" && pos.shares < shares) {
      throw new Error("Insufficient shares");
    }

    if (side === "BUY") {
      const totalCost = (pos.shares * pos.averageEntryPrice) + cost;
      pos.shares += shares;
      pos.averageEntryPrice = Math.round(totalCost / pos.shares);
      this.cash -= cost;
    } else {
      pos.shares -= shares;
      this.cash += cost;
    }

    if (pos.shares > 0) {
      this.positions.set(symbol, pos);
    } else {
      this.positions.delete(symbol);
    }

    this.trades.unshift({
      id: Math.random().toString(36).substring(7),
      symbol,
      side,
      shares,
      price: currentPrice,
      timestamp: Date.now()
    });
  }

  getSummary(quotes: Map<string, Quote>) {
    let positionsValue = 0;
    let dayPnl = 0;
    let totalPnl = 0;

    this.positions.forEach(pos => {
      const quote = quotes.get(pos.symbol);
      if (quote) {
        const currentValue = pos.shares * quote.price;
        const entryValue = pos.shares * pos.averageEntryPrice;
        positionsValue += currentValue;
        totalPnl += (currentValue - entryValue);
        // simple mock for day pnl
        dayPnl += (currentValue - entryValue) * (Math.random() * 0.2); 
      }
    });

    return {
      cash: new Money(this.cash),
      totalValue: new Money(this.cash + positionsValue),
      dayPnl: new Money(dayPnl),
      totalPnl: new Money(totalPnl),
      positions: this.positions
    };
  }
}
