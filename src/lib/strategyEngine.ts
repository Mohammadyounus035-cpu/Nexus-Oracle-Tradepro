/**
 * strategyEngine.ts
 * Phase 4: Automated trading strategies with risk integration
 */

import { EventEmitter } from 'events';
import { RealtimeMarketService, PriceTick } from './realtimeMarketService';
import { RiskManager } from './riskManager';
import { OrderSide } from './engine';
import { Portfolio } from './state';

export interface StrategyConfig {
  name: string;
  enabled: boolean;
  symbols: string[];
  maxPositionSize: number;       // Max shares per position
  entryThreshold: number;        // Signal threshold (std devs)
  exitThreshold: number;         // Take profit / stop loss
  holdingPeriod: number;         // Max holding time (ms)
  cooldownPeriod: number;        // Min time between trades (ms)
}

export interface StrategySignal {
  symbol: string;
  side: OrderSide;
  confidence: number;            // 0-1
  reason: string;
  timestamp: number;
}

export abstract class BaseStrategy extends EventEmitter {
  protected lastTradeTime: Map<string, number> = new Map();
  protected activePositions: Map<string, { entryPrice: number; qty: number; entryTime: number }> = new Map();

  constructor(
    public config: StrategyConfig,
    protected marketService: RealtimeMarketService,
    protected riskManager: RiskManager
  ) {
    super();
  }

  abstract onTick(tick: PriceTick): void;
  abstract getName(): string;

  protected canTrade(symbol: string): boolean {
    const lastTrade = this.lastTradeTime.get(symbol) || 0;
    return Date.now() - lastTrade >= this.config.cooldownPeriod;
  }

  protected async executeSignal(signal: StrategySignal, portfolio: Portfolio): Promise<void> {
    if (!this.canTrade(signal.symbol)) return;

    // Pre-trade risk check
    const riskCheck = this.riskManager.checkOrder(
      signal.symbol,
      signal.side,
      this.config.maxPositionSize,
      0, // Price handled by engine
      portfolio
    );

    if (riskCheck.status === 'blocked') {
      this.emit('trade_blocked', { signal, reason: riskCheck.reasons });
      return;
    }

    if (riskCheck.status === 'warning') {
      this.emit('trade_warning', { signal, warnings: riskCheck.reasons });
    }

    const orderData = {
      id: `strat-${Date.now()}-${signal.symbol}`,
      symbol: signal.symbol,
      side: signal.side,
      qty: this.calculatePositionSize(signal),
      timestamp: Date.now(),
    };

    this.lastTradeTime.set(signal.symbol, Date.now());
    this.emit('order', orderData);
  }

  private calculatePositionSize(signal: StrategySignal): number {
    const baseSize = this.config.maxPositionSize;
    return Math.floor(baseSize * signal.confidence);
  }

  protected recordPosition(symbol: string, price: number, qty: number): void {
    this.activePositions.set(symbol, {
      entryPrice: price,
      qty,
      entryTime: Date.now()
    });
  }

  protected closePosition(symbol: string): void {
    this.activePositions.delete(symbol);
  }

  protected getPosition(symbol: string) {
    return this.activePositions.get(symbol);
  }
}

// Mean Reversion Strategy: Buy dips, sell rallies
export class MeanReversionStrategy extends BaseStrategy {
  private priceHistory: Map<string, number[]> = new Map();
  private windowSize = 20;

  getName(): string { return 'MeanReversion'; }

  onTick(tick: PriceTick): void {
    if (!this.config.enabled) return;
    if (!this.config.symbols.includes(tick.symbol)) return;

    const history = this.priceHistory.get(tick.symbol) || [];
    history.push(tick.price);
    
    if (history.length > this.windowSize) {
      history.shift();
    }
    
    this.priceHistory.set(tick.symbol, history);

    if (history.length < this.windowSize) return;

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    const zScore = stdDev > 0 ? (tick.price - mean) / stdDev : 0;

    const position = this.getPosition(tick.symbol);
    
    // Entry signals
    if (zScore < -this.config.entryThreshold && !position) {
        this.emit('signal', {
            symbol: tick.symbol,
            side: 'BUY',
            confidence: Math.min(Math.abs(zScore) / 3, 1.0),
            reason: `mean_reversion_zscore_${zScore.toFixed(2)}`,
            timestamp: Date.now()
        });
    } else if (zScore > this.config.entryThreshold && position) {
        this.emit('signal', {
            symbol: tick.symbol,
            side: 'SELL',
            confidence: 1.0,
            reason: `mean_reversion_exit_zscore_${zScore.toFixed(2)}`,
            timestamp: Date.now()
        });
    }
  }
}

// Strategy Orchestrator: Manages multiple strategies
export class StrategyOrchestrator extends EventEmitter {
  private strategies: BaseStrategy[] = [];

  constructor(private marketService: RealtimeMarketService) {
    super();
    this.marketService.on('tick', (tick: PriceTick) => {
      this.strategies.forEach(strategy => strategy.onTick(tick));
    });
  }

  addStrategy(strategy: BaseStrategy): void {
    this.strategies.push(strategy);
    
    strategy.on('signal', (signal: StrategySignal) => {
      this.emit('strategy_signal', { strategy: strategy.getName(), signal });
    });
    
    strategy.on('trade_blocked', (data: any) => {
      this.emit('trade_blocked', { strategy: strategy.getName(), ...data });
    });
  }

  getStrategies(): string[] {
    return this.strategies.map(s => s.getName());
  }

  enableStrategy(name: string): void {
    const strategy = this.strategies.find(s => s.getName() === name);
    if (strategy) strategy.config.enabled = true;
  }

  disableStrategy(name: string): void {
    const strategy = this.strategies.find(s => s.getName() === name);
    if (strategy) strategy.config.enabled = false;
  }
}
