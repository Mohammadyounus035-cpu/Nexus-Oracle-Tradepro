import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { MockPriceGenerator, Quote } from "../lib/marketData";
import { PortfolioManager, Trade } from "../lib/portfolio";

interface MarketContextType {
  prices: Map<string, Quote>;
  portfolio: ReturnType<PortfolioManager["getSummary"]>;
  trades: Trade[];
  executeOrder: (params: { symbol: string; side: "BUY" | "SELL"; quantity: number; currentPrice: number }) => void;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  history: Map<string, number[]>;
}

const MarketContext = createContext<MarketContextType | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [generator] = useState(() => new MockPriceGenerator());
  const [portfolioManager] = useState(() => new PortfolioManager());
  
  const [prices, setPrices] = useState<Map<string, Quote>>(new Map());
  const [history, setHistory] = useState<Map<string, number[]>>(new Map());
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");
  
  // Force re-render on tick
  const [, setTick] = useState(0);

  useEffect(() => {
    // Initial load
    const initialPrices = new Map<string, Quote>();
    const initialHistory = new Map<string, number[]>();
    generator.getStocks().forEach(stock => {
      const quote = generator.getQuote(stock.symbol);
      initialPrices.set(stock.symbol, quote);
      initialHistory.set(stock.symbol, quote.history);
    });
    setPrices(initialPrices);
    setHistory(initialHistory);

    const interval = setInterval(() => {
      generator.tick();
      const newPrices = new Map<string, Quote>();
      const newHistory = new Map<string, number[]>();
      generator.getStocks().forEach(stock => {
        const quote = generator.getQuote(stock.symbol);
        newPrices.set(stock.symbol, quote);
        newHistory.set(stock.symbol, quote.history);
      });
      setPrices(newPrices);
      setHistory(newHistory);
      setTick(t => t + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, [generator]);

  const executeOrder = useCallback((params: { symbol: string; side: "BUY" | "SELL"; quantity: number; currentPrice: number }) => {
    portfolioManager.executeOrder(params.symbol, params.side, params.quantity, params.currentPrice);
    setTick(t => t + 1);
  }, [portfolioManager]);

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
      history
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
