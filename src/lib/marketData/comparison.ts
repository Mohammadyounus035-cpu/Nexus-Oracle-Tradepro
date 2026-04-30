import { MarketLatticeState } from '../lattice/types';
import { classifyMarketRegime } from '../lattice/regime';
import { mapMarketToLattice } from '../lattice/marketMapper';
import { MarketDataPoint } from './types';

export interface HistoricalLiveComparison {
  symbol: string;
  timestamp: string;
  lookbackDays: number;
  liveReturnBps: number;
  historicalMeanBps: number;
  historicalVolBps: number;
  zScore: number;
  percentileRank: number;
  pathDrift: number;
  regimeShift: boolean;
}

export function compareHistoricalToLive(
  historical: MarketDataPoint[],
  live: MarketDataPoint,
  lookbackDays = 252
): HistoricalLiveComparison {
  const window = historical.slice(-Math.max(2, lookbackDays));
  const returns = calculateReturnBpsSeries(window);
  const previous = window[window.length - 1];
  const liveReturnBps = previous ? returnBps(previous.close, live.close) : 0;
  const historicalMeanBps = mean(returns);
  const historicalVolBps = standardDeviation(returns);
  const zScore = historicalVolBps === 0 ? 0 : (liveReturnBps - historicalMeanBps) / historicalVolBps;
  const percentileRank = returns.length === 0
    ? 50
    : (returns.filter((value) => value <= liveReturnBps).length / returns.length) * 100;

  const currentState = mapMarketToLattice([...window, live]);
  const historicalStates = window.map((_, index) => mapMarketToLattice(window.slice(0, index + 1)));
  const historicalMedianPath = median(historicalStates.map((state) => state.path.index));
  const historicalDominantRegime = dominantRegime(historicalStates);
  const currentRegime = classifyMarketRegime([...window, live]);

  return {
    symbol: live.symbol,
    timestamp: live.timestamp,
    lookbackDays,
    liveReturnBps,
    historicalMeanBps,
    historicalVolBps,
    zScore,
    percentileRank,
    pathDrift: currentState.path.index - historicalMedianPath,
    regimeShift: currentRegime !== historicalDominantRegime,
  };
}

function calculateReturnBpsSeries(points: MarketDataPoint[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current) returns.push(returnBps(previous.close, current.close));
  }
  return returns;
}

function returnBps(previousClose: number, currentClose: number): number {
  return previousClose === 0 ? 0 : ((currentClose - previousClose) / previousClose) * 10000;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

function median(values: number[]): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const middle = sorted[mid] ?? 1;
  if (sorted.length % 2 === 1) return middle;
  return Math.round(((sorted[mid - 1] ?? middle) + middle) / 2);
}

function dominantRegime(states: MarketLatticeState[]): string {
  const counts = new Map<string, number>();
  for (const state of states) {
    counts.set(state.regime, (counts.get(state.regime) ?? 0) + 1);
  }
  let best = 'UNKNOWN';
  let bestCount = -1;
  for (const [regime, count] of counts) {
    if (count > bestCount) {
      best = regime;
      bestCount = count;
    }
  }
  return best;
}

