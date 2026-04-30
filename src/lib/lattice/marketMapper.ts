import { MarketDataPoint } from '../marketData/types';
import { classifyMarketRegime } from './regime';
import { getNearestActivePath, getPathByIndex, PATH_COUNT } from './registry';
import { MarketFeatureVector, MarketLatticeState } from './types';

export function mapMarketToLattice(points: MarketDataPoint[], allowDormant = false): MarketLatticeState {
  const feature = extractMarketFeatures(points);
  const rawIndex = featureToPathIndex(feature);
  const rawPath = getPathByIndex(rawIndex);
  const path = rawPath.active || allowDormant ? rawPath : getNearestActivePath(rawPath.index);
  const confidencePenalty = feature.anomalyScore * 15 + (rawPath.active ? 0 : 20);

  return {
    timestamp: feature.timestamp,
    symbol: feature.symbol,
    path,
    regime: classifyMarketRegime(points),
    momentumScore: feature.momentumScore,
    volatilityScore: feature.volatilityScore,
    liquidityScore: feature.liquidityScore,
    anomalyScore: feature.anomalyScore,
    confidence: clamp(path.confidence - confidencePenalty, 0, 100),
  };
}

export function extractMarketFeatures(points: MarketDataPoint[]): MarketFeatureVector {
  const latest = points[points.length - 1];
  if (!latest) {
    return {
      symbol: 'UNKNOWN',
      timestamp: new Date(0).toISOString(),
      returnBps: 0,
      momentumScore: 0,
      volatilityScore: 0,
      liquidityScore: 0,
      anomalyScore: 0,
    };
  }

  const returns = calculateReturns(points);
  const latestReturn = returns[returns.length - 1] ?? 0;
  const meanReturn = mean(returns);
  const volatility = standardDeviation(returns);
  const averageVolume = mean(points.slice(0, -1).map((point) => point.volume));
  const volumeRatio = averageVolume > 0 ? latest.volume / averageVolume : 1;

  return {
    symbol: latest.symbol,
    timestamp: latest.timestamp,
    returnBps: latestReturn * 10000,
    momentumScore: clamp((meanReturn * 100) / 5, -1, 1),
    volatilityScore: clamp(volatility / 0.05, 0, 1),
    liquidityScore: clamp(Math.log10(Math.max(volumeRatio, 0.1)), -1, 1),
    anomalyScore: clamp(Math.abs(latestReturn) / 0.08 + Math.max(0, volumeRatio - 3) / 7, 0, 1),
  };
}

function featureToPathIndex(feature: MarketFeatureVector): number {
  const composite =
    0.35 * normalizeSigned(feature.momentumScore) +
    0.25 * feature.volatilityScore +
    0.2 * normalizeSigned(feature.liquidityScore) +
    0.2 * feature.anomalyScore;

  return Math.max(1, Math.min(PATH_COUNT, Math.round(composite * (PATH_COUNT - 1)) + 1));
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

function normalizeSigned(value: number): number {
  return (clamp(value, -1, 1) + 1) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

