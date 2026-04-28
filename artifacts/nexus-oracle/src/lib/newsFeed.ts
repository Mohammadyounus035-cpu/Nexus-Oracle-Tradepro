export type NewsCategory =
  | "EARNINGS"
  | "ANALYST"
  | "PRODUCT"
  | "MACRO"
  | "INSIDER"
  | "MERGER"
  | "REGULATORY"
  | "TECHNICAL";

export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsHeadline {
  id: string;
  symbol: string;
  category: NewsCategory;
  sentiment: NewsSentiment;
  headline: string;
  source: string;
  timestamp: number;
}

const SOURCES = [
  "REUTERS",
  "BLOOMBERG",
  "WSJ",
  "CNBC",
  "FT",
  "BARRONS",
  "BENZINGA",
  "MARKETWATCH",
  "POLYGON",
  "DARKPOOL",
];

const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple",
  GOOGL: "Alphabet",
  MSFT: "Microsoft",
  AMZN: "Amazon",
  TSLA: "Tesla",
  META: "Meta",
  NVDA: "Nvidia",
  NFLX: "Netflix",
};

const TEMPLATES: Record<
  NewsCategory,
  { sentiment: NewsSentiment; templates: ((s: string, n: string) => string)[] }[]
> = {
  EARNINGS: [
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `${n} beats Q3 EPS estimates, ${s} guidance raised`,
        (s, n) => `${s} earnings surprise: ${n} tops revenue forecast by 8%`,
        (s, n) => `${n} reports record quarter, ${s} margin expands 240bps`,
      ],
    },
    {
      sentiment: "bearish",
      templates: [
        (s, n) => `${n} misses on top line, ${s} cuts FY outlook`,
        (s, n) => `${s} guidance disappoints, ${n} flags demand softness`,
        (s, n) => `${n} Q4 print weak, ${s} margin contracts on input costs`,
      ],
    },
  ],
  ANALYST: [
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `Goldman raises ${s} price target, sees 22% upside in ${n}`,
        (s, n) => `Morgan Stanley upgrades ${s} to overweight on ${n} AI tailwinds`,
        (s, n) => `JPMorgan adds ${s} to focus list, ${n} cited as durable compounder`,
      ],
    },
    {
      sentiment: "bearish",
      templates: [
        (s, n) => `Wedbush downgrades ${s} to neutral on ${n} valuation concerns`,
        (s, n) => `Bernstein cuts ${s} target, sees ${n} multiple compression`,
      ],
    },
  ],
  PRODUCT: [
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `${n} unveils new flagship, ${s} pre-orders trending strong`,
        (s, n) => `${s} launches enterprise tier, ${n} expands TAM by $40B`,
        (s, n) => `${n} ships next-gen platform, ${s} developer adoption accelerates`,
      ],
    },
    {
      sentiment: "neutral",
      templates: [
        (s, n) => `${n} delays product roadmap, ${s} reaffirms commitment to launch`,
      ],
    },
  ],
  MACRO: [
    {
      sentiment: "bullish",
      templates: [
        (s) => `Fed dovish tone lifts mega-caps, ${s} leads tape higher`,
        (s) => `${s} catches bid as 10Y yield retreats below 4.1%`,
      ],
    },
    {
      sentiment: "bearish",
      templates: [
        (s) => `${s} pressured as DXY spikes on hawkish CPI print`,
        (s) => `Risk-off flow hits ${s}, semis sell off into close`,
      ],
    },
  ],
  INSIDER: [
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `${n} CFO purchases $4.2M of ${s} on open market`,
        (s, n) => `${n} board authorizes $25B ${s} buyback expansion`,
      ],
    },
    {
      sentiment: "bearish",
      templates: [
        (s, n) => `${n} insider selling cluster, ${s} 13D shows fund exit`,
      ],
    },
  ],
  MERGER: [
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `${n} in advanced talks for $8B bolt-on, ${s} pops on report`,
        (s, n) => `${n} JV with leading hyperscaler, ${s} cited as moat extender`,
      ],
    },
  ],
  REGULATORY: [
    {
      sentiment: "bearish",
      templates: [
        (s, n) => `EU opens probe into ${n} antitrust, ${s} weighs response`,
        (s, n) => `FTC scrutinizes ${n} acquisition, ${s} faces extended review`,
      ],
    },
    {
      sentiment: "bullish",
      templates: [
        (s, n) => `Court dismisses ${n} class action, ${s} headline overhang lifts`,
      ],
    },
  ],
  TECHNICAL: [
    {
      sentiment: "bullish",
      templates: [
        (s) => `${s} breaks 50-day on volume surge, momentum scan flags`,
        (s) => `${s} closes above prior resistance, options skew turns call-heavy`,
      ],
    },
    {
      sentiment: "bearish",
      templates: [
        (s) => `${s} loses 200-day, dealer gamma flips short`,
        (s) => `${s} forms bearish engulfing, RSI confirms divergence`,
      ],
    },
  ],
};

const SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX"];

let counter = 0;
function nextId(): string {
  counter += 1;
  return `news_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export function generateHeadline(symbol?: string, ts?: number): NewsHeadline {
  const sym = symbol ?? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const name = STOCK_NAMES[sym] ?? sym;
  const categories = Object.keys(TEMPLATES) as NewsCategory[];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const buckets = TEMPLATES[category];
  const bucket = buckets[Math.floor(Math.random() * buckets.length)];
  const tmpl = bucket.templates[Math.floor(Math.random() * bucket.templates.length)];
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  return {
    id: nextId(),
    symbol: sym,
    category,
    sentiment: bucket.sentiment,
    headline: tmpl(sym, name),
    source,
    timestamp: ts ?? Date.now(),
  };
}

export function seedHeadlines(count: number = 16): NewsHeadline[] {
  const now = Date.now();
  const out: NewsHeadline[] = [];
  for (let i = 0; i < count; i++) {
    out.push(generateHeadline(undefined, now - i * 90_000));
  }
  return out;
}

export function sentimentColor(s: NewsSentiment): string {
  if (s === "bullish") return "#00ffaa";
  if (s === "bearish") return "#ff00aa";
  return "#00d4ff";
}
