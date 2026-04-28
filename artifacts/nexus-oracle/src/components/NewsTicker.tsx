import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import {
  generateHeadline,
  seedHeadlines,
  sentimentColor,
  type NewsHeadline,
} from "../lib/newsFeed";

interface NewsTickerProps {
  intervalMs?: number;
}

export default function NewsTicker({ intervalMs = 6500 }: NewsTickerProps) {
  const [items, setItems] = useState<NewsHeadline[]>(() => seedHeadlines(20));

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const next = [generateHeadline(), ...prev];
        if (next.length > 28) next.pop();
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const loop = [...items, ...items];

  return (
    <div
      className="relative h-9 w-full overflow-hidden border-b border-primary/30 bg-black/60 backdrop-blur-md"
      data-testid="news-ticker"
    >
      <div className="absolute left-0 top-0 z-20 flex h-full items-center gap-2 border-r border-primary/40 bg-background/80 px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
        <Newspaper className="h-3 w-3" />
        <span className="glow-text">News Wire</span>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="ticker-track flex h-full items-center pl-32 pr-8 font-mono text-xs">
        {loop.map((n, i) => {
          const color = sentimentColor(n.sentiment);
          const arrow =
            n.sentiment === "bullish" ? "▲" : n.sentiment === "bearish" ? "▼" : "■";
          return (
            <span
              key={`${n.id}_${i}`}
              className="mx-6 inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
              data-testid={`news-item-${n.symbol}`}
            >
              <span style={{ color }} className="text-[10px]">
                {arrow}
              </span>
              <span className="text-accent">{n.symbol}</span>
              <span className="text-foreground/90">{n.headline}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {n.source}
              </span>
              <span className="text-muted-foreground">·</span>
              <span
                className="rounded-sm border px-1 text-[9px] uppercase tracking-widest"
                style={{ color, borderColor: `${color}66` }}
              >
                {n.category}
              </span>
              <span className="px-4 text-primary/30">||</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
