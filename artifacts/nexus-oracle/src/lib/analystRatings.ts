export interface AnalystRating {
  firm: string;
  rating: 'buy' | 'hold' | 'sell';
  target: number;
}

export interface Consensus {
  buy: number;
  hold: number;
  sell: number;
  avgTarget: number;
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
}

const FIRMS = [
  "Goldman Sachs", "Morgan Stanley", "JPMorgan", "Bank of America", 
  "Citigroup", "Wells Fargo", "Barclays", "UBS", "Deutsche Bank", 
  "RBC Capital", "Jefferies", "Wedbush", "Piper Sandler", "Bernstein", "Evercore"
];

// Seed predictable but varied ratings based on symbol string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function getRatings(symbol: string, currentPrice: number): AnalystRating[] {
  const seed = hashString(symbol);
  const count = 12 + Math.floor(pseudoRandom(seed) * 4); // 12-15 ratings
  const ratings: AnalystRating[] = [];
  
  // Create a bias based on symbol
  const bias = pseudoRandom(seed + 1) * 2 - 1; // -1 to 1
  
  const shuffledFirms = [...FIRMS].sort((a, b) => pseudoRandom(hashString(a+seed)) - 0.5);

  for (let i = 0; i < count; i++) {
    const firm = shuffledFirms[i];
    const rand = pseudoRandom(seed + i + 2);
    const adjustedRand = rand + bias * 0.3; // Shift probability based on bias
    
    let rating: 'buy' | 'hold' | 'sell' = 'hold';
    let targetMultiplier = 1.0;

    if (adjustedRand > 0.6) {
      rating = 'buy';
      targetMultiplier = 1.1 + pseudoRandom(seed + i + 3) * 0.3; // +10% to +40%
    } else if (adjustedRand < 0.3) {
      rating = 'sell';
      targetMultiplier = 0.7 + pseudoRandom(seed + i + 3) * 0.2; // -10% to -30%
    } else {
      rating = 'hold';
      targetMultiplier = 0.95 + pseudoRandom(seed + i + 3) * 0.1; // -5% to +5%
    }

    ratings.push({
      firm,
      rating,
      target: Math.round(currentPrice * targetMultiplier)
    });
  }

  return ratings;
}

export function getConsensus(symbol: string, currentPrice: number): Consensus {
  const ratings = getRatings(symbol, currentPrice);
  
  let buy = 0;
  let hold = 0;
  let sell = 0;
  let totalTarget = 0;

  ratings.forEach(r => {
    if (r.rating === 'buy') buy++;
    else if (r.rating === 'hold') hold++;
    else if (r.rating === 'sell') sell++;
    totalTarget += r.target;
  });

  const avgTarget = totalTarget / ratings.length;
  const score = (buy * 5 + hold * 3 + sell * 1) / ratings.length;
  
  let recommendation: Consensus['recommendation'] = 'HOLD';
  if (score > 4.2) recommendation = 'STRONG BUY';
  else if (score > 3.5) recommendation = 'BUY';
  else if (score < 1.8) recommendation = 'STRONG SELL';
  else if (score < 2.5) recommendation = 'SELL';

  return {
    buy, hold, sell, avgTarget, recommendation
  };
}
