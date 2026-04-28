import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useMarket } from "../context/MarketContext";

const SECTORS = [
  "Technology",
  "Consumer Cyclical",
  "Communication Services",
  "Financial",
  "Healthcare",
  "Energy",
  "Industrials",
  "Crypto",
  "Custom",
];

export default function AddTickerDialog() {
  const { addTicker } = useMarket();
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("Custom");
  const [initial, setInitial] = useState("100");
  const [vol, setVol] = useState("0.025");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSymbol("");
    setName("");
    setSector("Custom");
    setInitial("100");
    setVol("0.025");
    setError(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addTicker({
      symbol,
      name,
      sector,
      initialDollars: parseFloat(initial),
      vol: parseFloat(vol),
    });
    if (!result.ok) {
      setError(result.reason || "Could not add ticker");
      return;
    }
    close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded font-mono text-xs text-primary border border-primary/40 bg-primary/5 hover:bg-primary/15 transition-colors glow-border"
        data-testid="button-add-ticker"
      >
        <Plus className="w-3 h-3" />
        REGISTER NEW TICKER
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={close}
          data-testid="dialog-add-ticker"
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={submit}
            className="glass-panel relative w-full max-w-md p-6 border border-primary/40 bg-background/95"
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 text-muted-foreground hover:text-primary"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="font-mono text-xs text-primary tracking-[0.25em] mb-1">SYMBOL REGISTRY</div>
            <div className="font-serif text-xl glow-text mb-5">Spawn New Instrument</div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Symbol</label>
                <input
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ORCL"
                  className="w-full bg-background border border-primary/30 px-3 py-2 rounded focus:border-primary focus:outline-none text-foreground"
                  data-testid="input-symbol"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Display Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Oracle Corp."
                  className="w-full bg-background border border-primary/30 px-3 py-2 rounded focus:border-primary focus:outline-none text-foreground"
                  data-testid="input-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Initial Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={initial}
                    onChange={e => setInitial(e.target.value)}
                    className="w-full bg-background border border-primary/30 px-3 py-2 rounded focus:border-primary focus:outline-none text-foreground"
                    data-testid="input-price"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Volatility</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="0.2"
                    value={vol}
                    onChange={e => setVol(e.target.value)}
                    className="w-full bg-background border border-primary/30 px-3 py-2 rounded focus:border-primary focus:outline-none text-foreground"
                    data-testid="input-vol"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Sector</label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full bg-background border border-primary/30 px-3 py-2 rounded focus:border-primary focus:outline-none text-foreground"
                  data-testid="select-sector"
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="text-[10px] text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                Volatility 0.005 = stable utility · 0.025 = standard equity · 0.05+ = high-beta / crypto.
                Symbols persist across sessions until removed.
              </div>

              {error && (
                <div className="text-destructive border border-destructive/40 bg-destructive/10 px-3 py-2 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={close}
                className="flex-1 py-2 rounded border border-border/50 text-muted-foreground hover:bg-muted/30 font-mono text-xs"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black glow-border font-mono text-xs font-bold tracking-widest"
                data-testid="button-confirm-add"
              >
                REGISTER
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
