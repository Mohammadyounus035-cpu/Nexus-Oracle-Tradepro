/**
 * state.ts — Portfolio, Risk & Performance State
 */

import { Quote, Trade } from './engine';

export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
}

export interface PortfolioSnapshot {
  cash: number;
  nav: number;
  positions: Map<string, Position>;
  tradeHistory: Trade[];
}

export type Portfolio = PortfolioSnapshot;

export class PortfolioManager {
  private cash: number;
  private nav: number;
  private positions: Map<string, Position>;
  private tradeHistory: Trade[];
  private peakNav: number;

  constructor(initialCash: number = 10000000) {
    this.cash = initialCash;
    this.nav = initialCash;
    this.positions = new Map();
    this.tradeHistory = [];
    this.peakNav = initialCash;
  }

  updatePrices(quotes: Map<string, Quote>) {
    let positionValue = 0;
    this.positions.forEach((pos, sym) => {
      const quote = quotes.get(sym);
      if (quote) {
        pos.currentPrice = quote.price;
        pos.pnl = (pos.currentPrice - pos.avgCost) * pos.shares;
        positionValue += pos.shares * pos.currentPrice;
      }
    });
    this.nav = this.cash + positionValue;
    if (this.nav > this.peakNav) {
      this.peakNav = this.nav;
    }
  }

  executeTrade(trade: Trade) {
    const total = trade.qty * trade.price;
    if (trade.side === 'BUY') {
      if (this.cash < total) throw new Error('Insufficient funds');
      this.cash -= total;
      
      const existing = this.positions.get(trade.symbol) || {
        symbol: trade.symbol,
        shares: 0,
        avgCost: 0,
        currentPrice: trade.price,
        pnl: 0
      };
      
      const newShares = existing.shares + trade.qty;
      existing.avgCost = Math.round((existing.avgCost * existing.shares + total) / newShares);
      existing.shares = newShares;
      existing.currentPrice = trade.price;
      existing.pnl = (existing.currentPrice - existing.avgCost) * existing.shares;
      this.positions.set(trade.symbol, existing);
    } else {
      const existing = this.positions.get(trade.symbol);
      if (!existing || existing.shares < trade.qty) throw new Error('Insufficient shares');
      
      this.cash += total;
      existing.shares -= trade.qty;
      if (existing.shares === 0) {
        this.positions.delete(trade.symbol);
      } else {
        existing.pnl = (existing.currentPrice - existing.avgCost) * existing.shares;
        this.positions.set(trade.symbol, existing);
      }
    }
    this.tradeHistory.push(trade);
  }

  getSnapshot(): PortfolioSnapshot {
    return {
      cash: this.cash,
      nav: this.nav,
      positions: new Map(this.positions),
      tradeHistory: [...this.tradeHistory]
    };
  }
}
