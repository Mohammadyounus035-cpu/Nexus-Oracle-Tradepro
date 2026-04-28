import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sessionStore } from '../lib/sessionStore';
import { 
  MarketDataEngine, 
  Quote 
} from '../lib/engine';
import { 
  getOrCreateIdentity, 
  SovereignIdentity 
} from '../lib/integrity';
import { 
  PortfolioManager, 
  PortfolioSnapshot 
} from '../lib/state';
import { RiskManager, DEFAULT_RISK_CONFIG, RiskMetrics } from '../lib/riskManager';
import { AnalyticsEngine } from '../lib/analyticsEngine';
import { RealtimeMarketService, PriceTick } from '../lib/realtimeMarketService';
import { tradeEngine as teInstance, EngineEvent } from '../lib/tradeEngine';
import { orderBook } from '../lib/orderBook';
import { StrategyOrchestrator, MeanReversionStrategy } from '../lib/strategyEngine';

interface TradeContextType {
  identity: SovereignIdentity | null;
  quotes: Map<string, Quote>;
  portfolio: PortfolioSnapshot | null;
  riskMetrics: RiskMetrics | null;
  engineEvents: EngineEvent[];
  marketService: RealtimeMarketService | null;
  teInstance: typeof teInstance;
  resetSession: () => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentity] = useState<SovereignIdentity | null>(null);
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [engineEvents, setEngineEvents] = useState<EngineEvent[]>([]);

  const engineRef = useRef<MarketDataEngine | null>(null);
  const portfolioRef = useRef<PortfolioManager | null>(null);
  const riskRef = useRef<RiskManager | null>(null);
  const analyticsRef = useRef<AnalyticsEngine | null>(null);
  const marketServiceRef = useRef<RealtimeMarketService | null>(null);
  const orchestratorRef = useRef<StrategyOrchestrator | null>(null);

  useEffect(() => {
    async function init() {
      const id = await getOrCreateIdentity();
      setIdentity(id);

      const engine = new MarketDataEngine();
      engineRef.current = engine;

      const portfolioManager = new PortfolioManager();
      portfolioRef.current = portfolioManager;

      const risk = new RiskManager(DEFAULT_RISK_CONFIG, 10000000);
      riskRef.current = risk;

      const analytics = new AnalyticsEngine();
      analyticsRef.current = analytics;

      const marketService = new RealtimeMarketService();
      marketServiceRef.current = marketService;

      const orchestrator = new StrategyOrchestrator(marketService);
      orchestratorRef.current = orchestrator;

      // Add strategy
      const meanRev = new MeanReversionStrategy({
        name: 'MeanRev',
        enabled: true,
        symbols: ['AAPL', 'NVDA', 'TSLA', 'BTC'],
        maxPositionSize: 50,
        entryThreshold: 2.0,
        exitThreshold: 1.0,
        holdingPeriod: 3600000,
        cooldownPeriod: 60000
      }, marketService, risk);
      orchestrator.addStrategy(meanRev);

      // Listen for trade execution
      const unsubscribeExec = teInstance.on('tradeExecuted', (event) => {
        const { trade } = event.data;
        portfolioManager.executeTrade(trade);
        const snap = portfolioManager.getSnapshot();
        const formattedSnap = {
          ...snap,
          positions: Array.from(snap.positions.values())
        } as any;
        setPortfolio(formattedSnap);
        
        // Persist session state
        sessionStore.save({
          portfolio: formattedSnap,
          identity: id
        });
      });

      // Listen for all events for terminal
      teInstance.on('orderSubmitted', (e) => setEngineEvents(prev => [e, ...prev].slice(0, 100)));
      teInstance.on('orderFilled', (e) => setEngineEvents(prev => [e, ...prev].slice(0, 100)));
      teInstance.on('tradeExecuted', (e) => setEngineEvents(prev => [e, ...prev].slice(0, 100)));

      const interval = setInterval(() => {
        if (engineRef.current && portfolioRef.current) {
          const newQuotes = engineRef.current.tick();
          setQuotes(new Map(newQuotes));
          
          portfolioRef.current.updatePrices(newQuotes);
          const snap = portfolioRef.current.getSnapshot();
          setPortfolio({
            ...snap,
            positions: Array.from(snap.positions.values())
          } as any);
          
          // Market Service Integration
          newQuotes.forEach(q => {
            const tick: PriceTick = {
              symbol: q.symbol,
              price: q.price,
              bid: q.price - 10,
              ask: q.price + 10,
              volume: 1000,
              timestamp: Date.now(),
              source: 'poll'
            };
            marketService.emit('tick', tick);
            
            // Order Book update (simulated for now)
            orderBook.clear();
            orderBook.addOrder('o1', 'SELL', q.price + 10, 1200);
            orderBook.addOrder('o2', 'SELL', q.price + 20, 850);
            orderBook.addOrder('o3', 'BUY', q.price - 10, 1100);
            orderBook.addOrder('o4', 'BUY', q.price - 20, 2420);

            // Process open orders in tradeEngine
            teInstance.processOrders(q.symbol, q.price, (t) => "0x" + Math.random().toString(16).slice(2, 18));
          });

          // New Analytics & Risk
          setRiskMetrics(risk.calculateMetrics(snap));
          analytics.recordSnapshot(Date.now(), snap.cash, snap.positions);
        }
      }, 2000);

      return () => {
        clearInterval(interval);
        unsubscribeExec();
      };
    }
    init();
  }, []);

  const resetSession = () => {
    sessionStore.purge();
    window.location.reload();
  };

  return (
    <TradeContext.Provider value={{
      identity,
      quotes,
      portfolio,
      riskMetrics,
      engineEvents,
      marketService: marketServiceRef.current,
      teInstance,
      resetSession
    }}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};
