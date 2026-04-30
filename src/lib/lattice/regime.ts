import { MarketDataPoint } from '../marketData/types';
import { MarketRegime } from './types';

export function classifyMarketRegime(points: MarketDataPoint[]): MarketRegime {
  if (points.length < 2) return 'UNKNOWN';

  const returns = calculateReturns(points);
  const latestReturn = returns[returns.length - 1] ?? 0;
  const volatility = standardDeviation(returns);
  const averageReturn = mean(returns);
  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const volumeShock = latest && previous && previous.volume > 0 ? latest.volume / previous.volume : 1;

  if (volatility > 0.045 || volumeShock > 4) return 'LIQUIDITY_STRESS';
  if (Math.abs(averageReturn) > volatility * 0.6 && volatility > 0) return 'TRENDING';
  if (latestReturn < -0.02) return 'RISK_OFF';
  if (latestReturn > 0.02) return 'RISK_ON';
  return 'MEAN_REVERTING';
}

function calculateReturns(points: MarketDataPoint[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current && previous.close > 0) {
      returns.push((current.close - previous.close) / previous.close);
    }
  }
  return returns;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

