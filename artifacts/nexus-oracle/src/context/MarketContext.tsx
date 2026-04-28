import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MockPriceGenerator, Quote } from "../lib/marketData";
import { PortfolioManager, Trade } from "../lib/portfolio";
import { AlertManager, PriceAlert, TriggerEvent, AlertDirection } from "../lib/alerts";
import { loadCustomSymbols, saveCustomSymbols, CustomSymbol } from "../lib/customSymbols";

interface AddTickerInput {
  symbol: string;
  name: string;
  sector: string;
  initialDollars: number;
  vol: number;
}

interface MarketContextType {
  prices: Map<string, Quote>;
  portfolio: ReturnType<PortfolioManager["getSummary"]>;
  trades: Trade[];
  executeOrder: (params: { symbol: string; side: "BUY" | "SELL"; quantity: number; currentPrice: number }) => void;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  history: Map<string, number[]>;
  // Symbol management
  addTicker: (input: AddTickerInput) => { ok: boolean; reason?: string };
  removeTicker: (symbol: string) => boolean;
  customSymbols: string[];
  // Alerts
  alerts: PriceAlert[];
  addAlert: (symbol: string, direction: AlertDirection, thresholdDollars: number) => void;
  removeAlert: (id: string) => void;
  reactivateAlert: (id: string) => void;
  recentTriggers: TriggerEvent[];
  dismissTrigger: (id: string) => void;
}

const MarketContext = createContext<MarketContextType | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [generator] = useState(() => new MockPriceGenerator());
  const [portfolioManager] = useState(() => new PortfolioManager());
  const [alertManager] = useState(() => new AlertManager());
  const customListRef = useRef<CustomSymbol[]>([]);
  
  const [prices, setPrices] = useState<Map<string, Quote>>(new Map());
  const [history, setHistory] = useState<Map<string, number[]>>(new Map());
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => alertManager.list());
  const [recentTriggers, setRecentTriggers] = useState<TriggerEvent[]>([]);
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  
  // Force re-render on tick
  const [, setTick] = useState(0);

  // Restore custom symbols on mount
  useEffect(() => {
    const stored = loadCustomSymbols();
    customListRef.current = stored;
    stored.forEach(c => {
      generator.addStock(c.symbol, c.name, c.sector, c.initialDollars, c.vol);
    });
    setCustomSymbols(stored.map(s => s.symbol));
  }, [generator]);

  const refreshPrices = useCallback(() => {
    const newPrices = new Map<string, Quote>();
    const newHistory = new Map<string, number[]>();
    generator.getStocks().forEach(stock => {
      const quote = generator.getQuote(stock.symbol);
      newPrices.set(stock.symbol, quote);
      newHistory.set(stock.symbol, quote.history);
    });
    setPrices(newPrices);
    setHistory(newHistory);
    return newPrices;
  }, [generator]);

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(() => {
      generator.tick();
      const newPrices = refreshPrices();
      const events = alertManager.evaluate(newPrices);
      if (events.length > 0) {
        setAlerts(alertManager.list());
        setRecentTriggers(prev => [...events, ...prev].slice(0, 6));
      }
      setTick(t => t + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, [generator, alertManager, refreshPrices]);

  const executeOrder = useCallback((params: { symbol: string; side: "BUY" | "SELL"; quantity: number; currentPrice: number }) => {
    portfolioManager.executeOrder(params.symbol, params.side, params.quantity, params.currentPrice);
    setTick(t => t + 1);
  }, [portfolioManager]);

  const addTicker = useCallback((input: AddTickerInput) => {
    const sym = input.symbol.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,6}$/.test(sym)) {
      return { ok: false, reason: "Symbol must be 1-6 letters/digits" };
    }
    if (generator.hasSymbol(sym)) {
      return { ok: false, reason: "Symbol already exists in market" };
    }
    if (!isFinite(input.initialDollars) || input.initialDollars <= 0) {
      return { ok: false, reason: "Initial price must be positive" };
    }
    if (!isFinite(input.vol) || input.vol <= 0) {
      return { ok: false, reason: "Volatility must be positive" };
    }
    const ok = generator.addStock(sym, input.name, input.sector, input.initialDollars, input.vol);
    if (!ok) return { ok: false, reason: "Failed to register symbol" };
    const entry: CustomSymbol = {
      symbol: sym,
      name: input.name || sym,
      sector: input.sector || "Custom",
      initialDollars: input.initialDollars,
      vol: input.vol,
    };
    customListRef.current = [...customListRef.current, entry];
    saveCustomSymbols(customListRef.current);
    setCustomSymbols(customListRef.current.map(c => c.symbol));
    refreshPrices();
    setSelectedSymbol(sym);
    return { ok: true };
  }, [generator, refreshPrices]);

  const removeTicker = useCallback((symbol: string) => {
    const ok = generator.removeStock(symbol);
    if (!ok) return false;
    customListRef.current = customListRef.current.filter(c => c.symbol !== symbol);
    saveCustomSymbols(customListRef.current);
    setCustomSymbols(customListRef.current.map(c => c.symbol));
    alertManager.removeBySymbol(symbol);
    setAlerts(alertManager.list());
    if (selectedSymbol === symbol) {
      const stocks = generator.getStocks();
      if (stocks.length > 0) setSelectedSymbol(stocks[0].symbol);
    }
    refreshPrices();
    return true;
  }, [generator, alertManager, refreshPrices, selectedSymbol]);

  const addAlert = useCallback((symbol: string, direction: AlertDirection, thresholdDollars: number) => {
    const cents = Math.round(thresholdDollars * 100);
    if (!isFinite(cents) || cents <= 0) return;
    alertManager.add(symbol, direction, cents);
    setAlerts(alertManager.list());
  }, [alertManager]);

  const removeAlert = useCallback((id: string) => {
    alertManager.remove(id);
    setAlerts(alertManager.list());
  }, [alertManager]);

  const reactivateAlert = useCallback((id: string) => {
    alertManager.reactivate(id);
    setAlerts(alertManager.list());
  }, [alertManager]);

  const dismissTrigger = useCallback((id: string) => {
    setRecentTriggers(prev => prev.filter(t => t.alert.id !== id));
  }, []);

  const portfolio = useMemo(() => portfolioManager.getSummary(prices), [portfolioManager, prices]);
  const trades = portfolioManager.trades;

  return (
    <MarketContext.Provider value={{
      prices,
      portfolio,
      trades,
      executeOrder,
      selectedSymbol,
      setSelectedSymbol,
      history,
      addTicker,
      removeTicker,
      customSymbols,
      alerts,
      addAlert,
      removeAlert,
      reactivateAlert,
      recentTriggers,
      dismissTrigger,
    }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}
