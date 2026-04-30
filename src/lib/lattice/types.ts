export type PathId = `P-${string}`;
export type Guardian = 'Lion' | 'Phoenix' | 'Dragon' | 'Owl' | 'Raven';
export type LatticePolarity = 'ANGELU' | 'DEMINU' | 'NEUTRAL' | 'DORMANT';
export type MarketRegime = 'RISK_ON' | 'RISK_OFF' | 'LIQUIDITY_STRESS' | 'TRENDING' | 'MEAN_REVERTING' | 'UNKNOWN';

export interface LatticePath {
  id: PathId;
  index: number;
  angleDeg: number;
  guardian: Guardian;
  polarity: LatticePolarity;
  confidence: number;
  active: boolean;
  domain?: string;
  category?: string;
}

export interface MarketLatticeState {
  timestamp: string;
  symbol: string;
  path: LatticePath;
  regime: MarketRegime;
  momentumScore: number;
  volatilityScore: number;
  liquidityScore: number;
  anomalyScore: number;
  confidence: number;
}

export interface MarketFeatureVector {
  symbol: string;
  timestamp: string;
  returnBps: number;
  momentumScore: number;
  volatilityScore: number;
  liquidityScore: number;
  anomalyScore: number;
}

