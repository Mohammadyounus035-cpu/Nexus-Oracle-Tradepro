/**
 * riskManager.ts — Risk & Compliance Layer
 * 
 * Real-time position risk, concentration limits, volatility-adjusted exposure,
 * and pre-trade confirmation with projected P&L impact.
 */

import { Portfolio, Position } from './state';
import { Order, OrderSide } from './engine';

// ---------------------------------------------------------------------------
// Risk Configuration
// ---------------------------------------------------------------------------

export interface RiskConfig {
  maxPositionConcentration: number;  // Max % of portfolio in single position (0-100)
  maxTotalExposure: number;          // Max % of portfolio in all positions (0-100)
  maxVolatilityExposure: number;     // Max vol-adjusted exposure (VaR-like)
  maxDrawdownLimit: number;          // Halt trading if drawdown exceeds %
  largeTradeThreshold: number;       // $ amount triggering confirmation (cents)
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionConcentration: 25,      // 25% max single position
  maxTotalExposure: 80,              // 80% max total exposure
  maxVolatilityExposure: 15,         // 15% daily VaR limit
  maxDrawdownLimit: 10,              // 10% max drawdown
  largeTradeThreshold: 10000_00,     // $10,000
};

// ---------------------------------------------------------------------------
// Risk Metrics
// ---------------------------------------------------------------------------

export interface RiskMetrics {
  concentration: Record<string, number>;  // Symbol -> % of portfolio
  totalExposure: number;                   // % of portfolio in positions
  volatilityAdjustedExposure: number;      // Weighted by asset volatility
  currentDrawdown: number;                 // % from peak
  status: 'green' | 'yellow' | 'red';
  warnings: string[];
}

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

// Volatility assumptions (annualized) for risk calculations
const VOLATILITY_ASSUMPTIONS: Record<string, number> = {
  AAPL: 0.25,
  NVDA: 0.35,
  TSLA: 0.45,
  BTC: 0.60,
  DEFAULT: 0.30,
};

// ---------------------------------------------------------------------------
// Risk Manager
// ---------------------------------------------------------------------------

export class RiskManager {
  private config: RiskConfig;
  private peakValue: number;

  constructor(config: RiskConfig = DEFAULT_RISK_CONFIG, initialPortfolioValue: number) {
    this.config = config;
    this.peakValue = initialPortfolioValue;
  }

  /**
   * Calculate current risk metrics from portfolio state
   */
  calculateMetrics(portfolio: Portfolio): RiskMetrics {
    const warnings: string[] = [];
    
    // Concentration per position
    const concentration: Record<string, number> = {};
    let positionValue = 0;
    let volExposure = 0;

    portfolio.positions.forEach((pos, sym) => {
      const value = pos.shares * pos.currentPrice;
      positionValue += value;

      const pct = (value / portfolio.nav) * 100;
      concentration[sym] = pct;
      
      if (pct > this.config.maxPositionConcentration) {
        warnings.push(`${sym} concentration ${pct.toFixed(1)}% exceeds ${this.config.maxPositionConcentration}% limit`);
      }

      const vol = VOLATILITY_ASSUMPTIONS[sym] || VOLATILITY_ASSUMPTIONS.DEFAULT;
      // Daily VaR approximation: value * vol / sqrt(252)
      const dailyVaR = value * (vol / Math.sqrt(252));
      volExposure += dailyVaR;
    });
    
    const totalExposure = (positionValue / portfolio.nav) * 100;
    
    if (totalExposure > this.config.maxTotalExposure) {
      warnings.push(`Total exposure ${totalExposure.toFixed(1)}% exceeds ${this.config.maxTotalExposure}% limit`);
    }
    
    const volatilityAdjustedExposure = (volExposure / portfolio.nav) * 100;
    
    if (volatilityAdjustedExposure > this.config.maxVolatilityExposure) {
      warnings.push(`Vol-adjusted exposure ${volatilityAdjustedExposure.toFixed(1)}% exceeds ${this.config.maxVolatilityExposure}% limit`);
    }
    
    // Drawdown
    if (portfolio.nav > this.peakValue) {
      this.peakValue = portfolio.nav;
    }
    const drawdown = ((this.peakValue - portfolio.nav) / this.peakValue) * 100;
    
    if (drawdown > this.config.maxDrawdownLimit) {
      warnings.push(`Drawdown ${drawdown.toFixed(1)}% exceeds ${this.config.maxDrawdownLimit}% limit — trading halted`);
    }
    
    // Status
    let status: 'green' | 'yellow' | 'red' = 'green';
    if (warnings.length > 0) status = 'yellow';
    if (drawdown > this.config.maxDrawdownLimit) status = 'red';
    
    return {
      concentration,
      totalExposure,
      volatilityAdjustedExposure,
      currentDrawdown: drawdown,
      status,
      warnings,
    };
  }

  /**
   * Pre-trade risk check
   */
  checkOrder(
    symbol: string,
    side: OrderSide,
    qty: number,
    price: number,
    portfolio: Portfolio
  ): { status: 'allowed' | 'warning' | 'blocked'; reasons: string[] } {
    const reasons: string[] = [];
    const total = qty * price;

    if (total > this.config.largeTradeThreshold) {
      reasons.push(`Large trade: ${(total/100).toFixed(2)} exceeds threshold`);
    }

    const currentMetrics = this.calculateMetrics(portfolio);
    if (currentMetrics.status === 'red') {
      reasons.push('Trading halted: Maximum drawdown exceeded');
      return { status: 'blocked', reasons };
    }

    return { 
      status: reasons.length > 0 ? 'warning' : 'allowed', 
      reasons 
    };
  }

  evaluateOrder(
    symbol: string,
    side: OrderSide,
    qty: number,
    price: number,
    portfolio?: Portfolio
  ): RiskDecision {
    const checks: RiskCheck[] = [];
    const notional = qty * price;

    checks.push({
      id: 'positive-notional',
      status: notional > 0 ? 'pass' : 'block',
      message: notional > 0 ? 'Order notional is positive' : 'Order notional must be positive',
    });

    checks.push({
      id: 'large-trade',
      status: notional > this.config.largeTradeThreshold ? 'warn' : 'pass',
      message: notional > this.config.largeTradeThreshold
        ? `Large trade ${(notional / 100).toFixed(2)} exceeds threshold`
        : 'Trade size below large-trade threshold',
    });

    if (portfolio) {
      const metrics = this.calculateMetrics(portfolio);
      checks.push({
        id: 'drawdown',
        status: metrics.status === 'red' ? 'block' : 'pass',
        message: metrics.status === 'red' ? 'Trading halted: maximum drawdown exceeded' : 'Drawdown inside configured limit',
      });

      if (side === 'BUY' && portfolio.cash < notional) {
        checks.push({
          id: 'cash',
          status: 'block',
          message: 'Insufficient cash for requested order',
        });
      }

      const position = portfolio.positions.get(symbol);
      if (side === 'SELL' && (!position || position.shares < qty)) {
        checks.push({
          id: 'inventory',
          status: 'block',
          message: 'Insufficient shares for sell order',
        });
      }
    }

    const hasBlock = checks.some((check) => check.status === 'block');
    const hasWarn = checks.some((check) => check.status === 'warn');

    return {
      status: hasBlock ? 'block' : hasWarn ? 'warn' : 'allow',
      checks,
      maxExecutableQty: hasBlock ? 0 : qty,
    };
  }
}
