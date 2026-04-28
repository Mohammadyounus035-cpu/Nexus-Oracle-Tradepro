import React, { useEffect } from "react";
import { BellRing, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMarket } from "../context/MarketContext";

export default function AlertOverlay() {
  const { recentTriggers, dismissTrigger } = useMarket();

  useEffect(() => {
    if (recentTriggers.length === 0) return;
    const timers = recentTriggers.map(t =>
      setTimeout(() => dismissTrigger(t.alert.id), 8000),
    );
    return () => timers.forEach(clearTimeout);
  }, [recentTriggers, dismissTrigger]);

  if (recentTriggers.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col gap-2 w-80 pointer-events-none" data-testid="alert-overlay">
      {recentTriggers.map(t => {
        const isUp = t.alert.direction === "ABOVE";
        return (
          <div
            key={t.alert.id}
            className="pointer-events-auto glass-panel border bg-background/95 px-4 py-3 flex items-start gap-3 animate-in slide-in-from-right-4"
            style={{
              borderColor: isUp ? "rgba(0,255,170,0.5)" : "rgba(255,0,170,0.5)",
              boxShadow: isUp
                ? "0 0 24px rgba(0,255,170,0.35)"
                : "0 0 24px rgba(255,0,170,0.35)",
            }}
            data-testid={`trigger-${t.alert.id}`}
          >
            <BellRing
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: isUp ? "#00ffaa" : "#ff00aa" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                <span style={{ color: isUp ? "#00ffaa" : "#ff00aa" }}>ALERT</span>
                <span>·</span>
                <span>{t.alert.symbol}</span>
              </div>
              <div className="font-sans text-sm text-foreground flex items-center gap-1">
                {isUp ? (
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                )}
                <span className="font-bold">{t.alert.symbol}</span>
                <span className="text-muted-foreground">crossed</span>
                <span className="font-mono">${(t.alert.thresholdCents / 100).toFixed(2)}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                LAST PRICE ${(t.priceCents / 100).toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => dismissTrigger(t.alert.id)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Dismiss"
              data-testid={`button-dismiss-${t.alert.id}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
