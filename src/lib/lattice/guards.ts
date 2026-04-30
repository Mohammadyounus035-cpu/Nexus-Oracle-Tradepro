import { MarketLatticeState } from './types';

export interface LatticeGuardDecision {
  status: 'allow' | 'warn' | 'block';
  reasons: string[];
}

export function evaluateLatticeGuards(state: MarketLatticeState, minConfidence = 50): LatticeGuardDecision {
  const reasons: string[] = [];
  let status: LatticeGuardDecision['status'] = 'allow';

  if (!state.path.active) {
    return { status: 'block', reasons: [`${state.path.id} is dormant`] };
  }

  if (state.confidence < minConfidence) {
    status = 'warn';
    reasons.push(`Lattice confidence ${state.confidence.toFixed(1)} below ${minConfidence}`);
  }

  if (state.regime === 'LIQUIDITY_STRESS') {
    status = 'warn';
    reasons.push('Liquidity stress regime active');
  }

  return { status, reasons };
}

