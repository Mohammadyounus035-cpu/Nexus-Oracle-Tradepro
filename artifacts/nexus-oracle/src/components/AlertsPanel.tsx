import React, { useMemo, useState } from "react";
import { Bell, BellRing, X, RotateCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMarket } from "../context/MarketContext";
import GlassCard from "./GlassCard";

export default function AlertsPanel() {
  const { selectedSymbol, prices, alerts, addAlert, removeAlert, reactivateAlert } = useMarket();
  const quote = prices.get(selectedSymbol);
  const [direction, setDirection] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [threshold, setThreshold] = useState("");

  const symbolAlerts = useMemo(
    () => alerts.filter(a => a.symbol === selectedSymbol),
    [alerts, selectedSymbol],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(threshold);
    if (!isFinite(v) || v <= 0) return;
    addAlert(selectedSymbol, direction, v);
    setThreshold("");
  };

  const currentPx = quote ? quote.price / 100 : 0;

  return (
    <GlassCard className="p-4 shrink-0" data-testid="panel-alerts">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-primary tracking-widest">
          <Bell className="w-3 h-3" />
          PRICE ALERTS
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {symbolAlerts.length} ACTIVE
        </span>
      </div>

      <form onSubmit={submit} className="flex gap-2 mb-3">
        <div className="flex bg-background rounded border border-primary/30 p-1 h-9">
          <button
            type="button"
            onClick={() => setDirection("ABOVE")}
            className={`px-2 text-[10px] font-mono rounded flex items-center gap-1 ${direction === "ABOVE" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            data-testid="button-direction-above"
          >
            <ArrowUpRight className="w-3 h-3" />
            ABOVE
          </button>
          <button
            type="button"
            onClick={() => setDirection("BELOW")}
            className={`px-2 text-[10px] font-mono rounded flex items-center gap-1 ${direction === "BELOW" ? "bg-destructive/20 text-destructive" : "text-muted-foreground"}`}
            data-testid="button-direction-below"
          >
            <ArrowDownRight className="w-3 h-3" />
            BELOW
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder={currentPx.toFixed(2)}
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          className="flex-1 min-w-0 bg-background border border-primary/30 px-2 rounded text-xs font-mono text-foreground focus:border-primary focus:outline-none"
          data-testid="input-alert-threshold"
        />
        <button
          type="submit"
          className="px-3 rounded bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-black font-mono text-[10px] font-bold tracking-widest"
          data-testid="button-arm-alert"
        >
          ARM
        </button>
      </form>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {symbolAlerts.length === 0 ? (
          <div className="text-center text-muted-foreground font-mono text-[10px] py-4">
            NO ALERTS ARMED FOR {selectedSymbol}
          </div>
        ) : (
          symbolAlerts.map(alert => {
            const triggered = !alert.active;
            const px = alert.thresholdCents / 100;
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between text-[11px] font-mono px-2 py-1.5 rounded border ${triggered ? "border-amber/40 bg-amber/10 text-amber" : "border-primary/20 bg-primary/5"}`}
                style={triggered ? { borderColor: "rgba(255,170,0,0.4)", color: "var(--color-amber, #ffaa00)" } : {}}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {triggered ? <BellRing className="w-3 h-3 shrink-0" /> : <Bell className="w-3 h-3 shrink-0 text-primary" />}
                  <span className={alert.direction === "ABOVE" ? "text-accent" : "text-destructive"}>
                    {alert.direction === "ABOVE" ? "≥" : "≤"}
                  </span>
                  <span className="text-foreground">${px.toFixed(2)}</span>
                  {triggered && <span className="text-[9px] uppercase tracking-widest">FIRED</span>}
                </div>
                <div className="flex items-center gap-1">
                  {triggered && (
                    <button
                      onClick={() => reactivateAlert(alert.id)}
                      className="text-primary hover:text-foreground p-0.5"
                      aria-label="Re-arm"
                      data-testid={`button-rearm-${alert.id}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                    aria-label="Remove"
                    data-testid={`button-remove-alert-${alert.id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
