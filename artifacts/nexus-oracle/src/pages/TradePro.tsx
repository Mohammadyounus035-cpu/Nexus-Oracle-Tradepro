import React, { useState, useMemo } from "react";
import { useMarket } from "../context/MarketContext";
import GlassCard from "../components/GlassCard";
import Sparkline from "../components/Sparkline";
import AddTickerDialog from "../components/AddTickerDialog";
import AlertsPanel from "../components/AlertsPanel";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getConsensus } from "../lib/analystRatings";
import { Activity, Trash2, Bell } from "lucide-react";
import { Input } from "../components/ui/input";

export default function TradePro() {
  const { prices, portfolio, trades, executeOrder, selectedSymbol, setSelectedSymbol, history, customSymbols, removeTicker, alerts, recentTriggers } = useMarket();
  const customSet = useMemo(() => new Set(customSymbols), [customSymbols]);
  const triggeredSymbols = useMemo(() => new Set(recentTriggers.map(t => t.alert.symbol)), [recentTriggers]);
  const alertsBySymbol = useMemo(() => {
    const m = new Map<string, number>();
    alerts.forEach(a => {
      if (a.active) m.set(a.symbol, (m.get(a.symbol) || 0) + 1);
    });
    return m;
  }, [alerts]);
  
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("100");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [limitPrice, setLimitPrice] = useState("");

  const stocksList = useMemo(() => Array.from(prices.values()), [prices]);
  const currentQuote = prices.get(selectedSymbol);
  const currentHistory = history.get(selectedSymbol) || [];
  
  const chartData = useMemo(() => {
    return currentHistory.map((val, i) => ({ time: i, price: val / 100 }));
  }, [currentHistory]);

  const consensus = useMemo(() => {
    if (!currentQuote) return null;
    return getConsensus(selectedSymbol, currentQuote.price / 100);
  }, [selectedSymbol, currentQuote]);

  if (!currentQuote) return <div className="p-8 font-mono text-primary animate-pulse">CONNECTING TO LIQUIDITY POOL...</div>;

  const cost = (parseInt(quantity) || 0) * (currentQuote.price / 100);

  const handleExecute = () => {
    try {
      executeOrder({
        symbol: selectedSymbol,
        side,
        quantity: parseInt(quantity) || 0,
        currentPrice: currentQuote.price
      });
      // Optionally reset qty
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Drift Check Banner */}
      <div className="mb-4 glass-panel bg-primary/5 border-primary/20 p-2 px-4 flex justify-between items-center text-sm font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">PORTFOLIO HEALTH</span>
          <span className="text-accent">OPTIMAL</span>
        </div>
        <div className="text-primary">LIQUIDITY RESERVES: {portfolio.cash.format()}</div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN */}
        <div className="col-span-3 flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-3 border-b border-border/30 text-xs font-mono text-primary tracking-widest flex items-center justify-between">
              <span>WATCHLIST</span>
              <span className="text-muted-foreground">{stocksList.length} SYM</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {stocksList.map(quote => {
                const isSelected = quote.symbol === selectedSymbol;
                const isPos = quote.changePercent >= 0;
                const isCustom = customSet.has(quote.symbol);
                const isTriggered = triggeredSymbols.has(quote.symbol);
                const armed = alertsBySymbol.get(quote.symbol) || 0;
                return (
                  <div 
                    key={quote.symbol}
                    onClick={() => setSelectedSymbol(quote.symbol)}
                    className={`relative p-3 border-b border-border/10 cursor-pointer flex items-center justify-between gap-2 transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                    style={isTriggered ? { boxShadow: 'inset 0 0 12px rgba(255,170,0,0.5)' } : undefined}
                    data-testid={`row-${quote.symbol}`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-foreground font-sans flex items-center gap-1.5">
                        {quote.symbol}
                        {isCustom && <span className="text-[8px] font-mono text-amber" style={{ color: '#ffaa00' }}>SIM</span>}
                        {armed > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-primary font-mono">
                            <Bell className="w-2.5 h-2.5" />
                            {armed}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{(quote.price/100).toFixed(2)}</div>
                    </div>
                    <div className="w-14 h-8 shrink-0">
                      <Sparkline data={quote.history} color={isPos ? "hsl(var(--accent))" : "hsl(var(--destructive))"} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${isPos ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
                        {isPos ? '+' : ''}{quote.changePercent.toFixed(2)}%
                      </div>
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove ${quote.symbol} from the simulation?`)) removeTicker(quote.symbol);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label={`Remove ${quote.symbol}`}
                          data-testid={`button-remove-${quote.symbol}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-border/30 bg-background/40">
              <AddTickerDialog />
            </div>
          </GlassCard>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-6 flex flex-col gap-4">
          {/* Chart */}
          <GlassCard className="p-4 h-[350px] flex flex-col shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-mono text-primary">MARKET CHART · {selectedSymbol}</div>
              <div className="text-2xl font-serif glow-text">${(currentQuote.price/100).toFixed(2)}</div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid hsl(var(--primary))', borderRadius: '4px' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Order Ticket */}
          <GlassCard className="p-4 shrink-0">
            <div className="text-sm font-mono text-primary mb-4">ORDER TICKET</div>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setSide("BUY")}
                className={`flex-1 py-2 font-bold font-mono rounded transition-colors ${side === 'BUY' ? 'bg-accent text-black shadow-[0_0_10px_var(--color-accent)]' : 'bg-muted text-muted-foreground'}`}
              >
                BUY
              </button>
              <button 
                onClick={() => setSide("SELL")}
                className={`flex-1 py-2 font-bold font-mono rounded transition-colors ${side === 'SELL' ? 'bg-destructive text-black shadow-[0_0_10px_var(--color-destructive)]' : 'bg-muted text-muted-foreground'}`}
              >
                SELL
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1">QUANTITY</label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="font-mono bg-background border-primary/30 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1">ORDER TYPE</label>
                <div className="flex bg-background rounded border border-primary/30 p-1 h-10">
                  <button onClick={() => setOrderType("MARKET")} className={`flex-1 text-xs font-mono rounded ${orderType === 'MARKET' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>MKT</button>
                  <button onClick={() => setOrderType("LIMIT")} className={`flex-1 text-xs font-mono rounded ${orderType === 'LIMIT' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>LMT</button>
                </div>
              </div>
            </div>

            {orderType === "LIMIT" && (
               <div className="mb-4">
                 <label className="text-xs font-mono text-muted-foreground block mb-1">LIMIT PRICE</label>
                 <Input 
                   type="number" 
                   value={limitPrice} 
                   onChange={(e) => setLimitPrice(e.target.value)} 
                   placeholder={(currentQuote.price/100).toFixed(2)}
                   className="font-mono bg-background border-primary/30"
                 />
               </div>
            )}

            <div className="flex justify-between items-center mb-4 font-mono text-sm">
              <span className="text-muted-foreground">ESTIMATED {side === 'BUY' ? 'COST' : 'CREDIT'}</span>
              <span className="text-foreground text-lg">${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            <button 
              onClick={handleExecute}
              className={`w-full py-3 rounded font-mono font-bold tracking-widest transition-all ${side === 'BUY' ? 'bg-accent/20 text-accent border border-accent hover:bg-accent hover:text-black glow-border' : 'bg-destructive/20 text-destructive border border-destructive hover:bg-destructive hover:text-black shadow-[0_0_10px_var(--color-destructive)]'}`}
              data-testid="button-execute-order"
            >
              EXECUTE {side}
            </button>
          </GlassCard>

          {/* Positions */}
          <GlassCard className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/30 text-xs font-mono text-primary">POSITIONS</div>
            <div className="flex-1 overflow-y-auto p-3">
              {portfolio.positions.size === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">NO OPEN POSITIONS</div>
              ) : (
                <table className="w-full text-sm font-mono text-left">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/30">
                      <th className="pb-2 font-normal">SYM</th>
                      <th className="pb-2 font-normal">QTY</th>
                      <th className="pb-2 font-normal">AVG</th>
                      <th className="pb-2 font-normal">CURR</th>
                      <th className="pb-2 font-normal text-right">UNREALIZED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(portfolio.positions.values()).map(pos => {
                      const quote = prices.get(pos.symbol);
                      if (!quote) return null;
                      const curr = quote.price;
                      const pnl = (curr - pos.averageEntryPrice) * pos.shares / 100;
                      const isPos = pnl >= 0;
                      return (
                        <tr key={pos.symbol} className="border-b border-border/10 last:border-0">
                          <td className="py-2 text-primary font-bold">{pos.symbol}</td>
                          <td className="py-2">{pos.shares}</td>
                          <td className="py-2 text-muted-foreground">{(pos.averageEntryPrice/100).toFixed(2)}</td>
                          <td className="py-2">{(curr/100).toFixed(2)}</td>
                          <td className={`py-2 text-right ${isPos ? 'text-accent' : 'text-destructive'}`}>
                            {isPos ? '+' : ''}{pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Portfolio Summary */}
          <GlassCard className="p-4 shrink-0">
            <div className="text-xs font-mono text-primary mb-4">PORTFOLIO VALUE</div>
            <div className="text-3xl font-serif glow-text mb-4">{portfolio.totalValue.format()}</div>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <div className="text-muted-foreground text-[10px] mb-1">CASH</div>
                <div>{portfolio.cash.format()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px] mb-1">DAY P&L</div>
                <div className={portfolio.dayPnl.cents >= 0 ? "text-accent" : "text-destructive"}>
                  {portfolio.dayPnl.cents >= 0 ? '+' : ''}{portfolio.dayPnl.format()}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Alerts */}
          <AlertsPanel />

          {/* Order Book */}
          <GlassCard className="p-4 shrink-0 font-mono text-xs">
             <div className="text-primary mb-3">ORDER BOOK</div>
             <div className="space-y-1 mb-2">
               {[...Array(5)].map((_, i) => (
                 <div key={'ask'+i} className="flex justify-between text-destructive">
                   <span>{((currentQuote.price/100) + (5-i)*0.05).toFixed(2)}</span>
                   <span className="opacity-70">{Math.floor(Math.random() * 500) + 100}</span>
                 </div>
               ))}
             </div>
             <div className="py-1 border-y border-border/30 my-1 flex justify-between font-bold text-foreground">
               <span>{(currentQuote.price/100).toFixed(2)}</span>
               <span>SPREAD 0.01</span>
             </div>
             <div className="space-y-1 mt-2">
               {[...Array(5)].map((_, i) => (
                 <div key={'bid'+i} className="flex justify-between text-accent">
                   <span>{((currentQuote.price/100) - (i+1)*0.05).toFixed(2)}</span>
                   <span className="opacity-70">{Math.floor(Math.random() * 500) + 100}</span>
                 </div>
               ))}
             </div>
          </GlassCard>

          {/* Recent Trades */}
          <GlassCard className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/30 text-xs font-mono text-primary">RECENT TRADES</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
              {trades.length === 0 ? (
                <div className="text-muted-foreground text-center mt-4">NO RECENT TRADES</div>
              ) : (
                trades.slice(0, 8).map(trade => (
                  <div key={trade.id} className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                    <div>
                      <span className={trade.side === 'BUY' ? 'text-accent' : 'text-destructive'}>{trade.side}</span>
                      <span className="mx-2 text-foreground font-bold">{trade.symbol}</span>
                      <span className="text-muted-foreground">{trade.shares}</span>
                    </div>
                    <div>{(trade.price/100).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Analyst Consensus */}
          {consensus && (
            <GlassCard className="p-4 shrink-0">
               <div className="text-xs font-mono text-primary mb-3">ANALYST CONSENSUS</div>
               <div className="flex items-end gap-2 mb-4">
                 <div className="text-xl font-bold font-sans text-foreground">{consensus.recommendation}</div>
                 <div className="text-xs font-mono text-muted-foreground pb-1">AVG TGT ${(consensus.avgTarget).toFixed(2)}</div>
               </div>
               <div className="flex h-4 rounded overflow-hidden">
                 <div className="bg-accent" style={{ width: `${(consensus.buy / (consensus.buy + consensus.hold + consensus.sell))*100}%` }} />
                 <div className="bg-yellow-500" style={{ width: `${(consensus.hold / (consensus.buy + consensus.hold + consensus.sell))*100}%` }} />
                 <div className="bg-destructive" style={{ width: `${(consensus.sell / (consensus.buy + consensus.hold + consensus.sell))*100}%` }} />
               </div>
               <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
                 <span>{consensus.buy} BUY</span>
                 <span>{consensus.hold} HOLD</span>
                 <span>{consensus.sell} SELL</span>
               </div>
            </GlassCard>
          )}

        </div>
      </div>
    </div>
  );
}
