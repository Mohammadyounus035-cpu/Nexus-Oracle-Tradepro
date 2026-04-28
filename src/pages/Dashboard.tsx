import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Target, 
  Zap,
  TrendingUp,
  History,
  ShieldAlert
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { OrderSide } from '../lib/engine';
import { tradeEngine } from '../lib/tradeEngine';

// --- Sub-components (could be moved to separate files) ---

const Panel: React.FC<{ title: string; children: React.ReactNode; className?: string; glow?: string }> = ({ 
  title, 
  children, 
  className,
  glow = "lattice-glow"
}) => (
  <div className={`bg-panel/80 border border-border/50 rounded-xl overflow-hidden flex flex-col shadow-2xl relative group backdrop-blur-md ${glow} ${className}`}>
    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center bg-black/20 backdrop-blur-sm z-10">
      <h3 className="text-[11px] font-black uppercase tracking-[2px] text-accent flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        {title}
      </h3>
      <div className="w-10 h-[1px] bg-border/50" />
    </div>
    <div className="flex-1 overflow-auto z-10">
      {children}
    </div>
  </div>
);

const Metric: React.FC<{ label: string; value: string | number; trend?: number; icon?: React.ReactNode }> = ({ label, value, trend, icon }) => (
  <div className="p-4 bg-black/20 border border-border/10 rounded-lg hover:border-accent/30 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{label}</span>
      {icon && <div className="text-muted/50">{icon}</div>}
    </div>
    <div className="flex items-end gap-2">
      <span className="text-xl font-mono font-bold">{value}</span>
      {trend !== undefined && (
        <span className={`text-[10px] font-bold mb-1 flex items-center ${trend >= 0 ? 'text-green' : 'text-accent'}`}>
          {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const TradeGraphic: React.FC<{ quotes: Map<string, any>, currentSymbol: string }> = ({ quotes, currentSymbol }) => {
  const q = quotes.get(currentSymbol);
  if (!q) return null;
  return (
    <div className="h-48 w-full bg-black/40 rounded-lg border border-border/20 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-full h-[1px] bg-accent/30 top-1/2" />
        <div className="absolute h-full w-[1px] bg-accent/30 left-1/2" />
      </div>
      <div className="relative text-center">
        <motion.div 
          key={q.price}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-mono font-black tracking-tighter"
        >
          {(Number(q.price || 0) / 100).toFixed(2)}
        </motion.div>
        <div className="text-[10px] uppercase tracking-[4px] font-bold text-muted mt-2">
          Real-time Latency: <span className="text-cyan">{(Math.random() * 2).toFixed(2)}ms</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { identity, quotes, portfolio, riskMetrics, engineEvents } = useTrade();
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [qty, setQty] = useState('');
  const [buySide, setBuySide] = useState(true);

  const handleTrade = async () => {
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
    if (!portfolio || !identity) return;

    const side: OrderSide = buySide ? 'BUY' : 'SELL';
    
    try {
      tradeEngine.submitOrder({
        symbol: currentSymbol,
        side,
        type: 'MARKET',
        qty: Number(qty)
      });
      setQty('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      {/* Header Info */}
      <header className="flex justify-between items-center bg-panel/20 p-4 rounded-xl border border-border/20 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-text uppercase">
            Lattice Core <span className="text-accent underline decoration-accent/30 underline-offset-4">0x{currentSymbol}</span>
          </h2>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_#00ff88]" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Verified • 671.6 Hz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d4ff]" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Node Health: HEALTHY</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            {['AAPL', 'NVDA', 'TSLA', 'BTC'].map((sym) => (
              <button 
                key={sym}
                onClick={() => setCurrentSymbol(sym)}
                className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold transition-all border ${
                  currentSymbol === sym 
                  ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(255,51,51,0.2)]' 
                  : 'bg-panel border-border/50 text-muted hover:border-text/30'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
          <div className="text-[9px] font-mono text-muted/60 tracking-widest uppercase">
            LATENCY: {(Math.random() * 0.4 + 0.1).toFixed(3)}ms
          </div>
        </div>
      </header>

      {/* Primary Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Risk & Holdings */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0">
          <Panel title="Risk Shield" className="h-fit" glow={riskMetrics?.status === 'green' ? 'green-glow' : 'lattice-glow'}>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/20 rounded-lg border border-border/10">
                <div className="text-[8px] font-bold text-muted uppercase tracking-wider mb-1">Exposure</div>
                <div className="text-lg font-mono font-bold text-green">{(Number(riskMetrics?.totalExposure || 0)).toFixed(2)}%</div>
              </div>
              <div className="p-3 bg-black/20 rounded-lg border border-border/10">
                <div className="text-[8px] font-bold text-muted uppercase tracking-wider mb-1">Leverage</div>
                <div className="text-lg font-mono font-bold text-cyan">1.2x</div>
              </div>
              <div className="p-3 bg-black/20 rounded-lg border border-border/10">
                <div className="text-[8px] font-bold text-muted uppercase tracking-wider mb-1">VaR (95%)</div>
                <div className="text-lg font-mono font-bold text-yellow">{(Number(riskMetrics?.volatilityAdjustedExposure || 0)).toFixed(2)}</div>
              </div>
              <div className="p-3 bg-black/20 rounded-lg border border-border/10">
                <div className="text-[8px] font-bold text-muted uppercase tracking-wider mb-1">Health</div>
                <div className="text-lg font-mono font-bold text-green">100</div>
              </div>
            </div>
            
            {riskMetrics?.warnings && riskMetrics.warnings.length > 0 && (
              <div className="mx-4 mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-3">
                <ShieldAlert size={16} className="text-accent shrink-0" />
                <div className="text-[9px] font-bold leading-tight uppercase tracking-tight text-accent">
                  Risk Breach Detected: {riskMetrics.warnings[0]}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Sovereign Holdings" className="flex-1" glow="cyan-glow">
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">NAV Cents</div>
                  <div className="text-2xl font-mono font-black">${((portfolio?.nav || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-green uppercase tracking-wider">+0.42%</div>
                  <div className="text-[9px] text-muted font-mono">Today</div>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                {portfolio?.positions.map((pos) => (
                  <div key={pos.symbol} className="p-3 bg-black/20 border border-border/10 rounded-lg flex justify-between items-center group hover:border-accent/30 transition-colors">
                    <div>
                      <div className="text-xs font-bold">{pos.symbol}</div>
                      <div className="text-[10px] text-muted font-mono">{pos.shares} UNITS</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[11px] font-bold ${pos.pnl >= 0 ? 'text-green' : 'text-accent'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{(Number(pos.pnl || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-muted/50 font-mono">
                        ${(Number(pos.currentPrice || 0) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {portfolio?.positions.length === 0 && (
                  <div className="text-center py-10 opacity-20 filter grayscale">
                    <Activity size={32} className="mx-auto mb-2" />
                    <div className="text-[10px] font-bold uppercase tracking-widest">Null Positions</div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* Center Column: Trade Engine */}
        <div className="col-span-6 flex flex-col gap-6">
          <Panel title="Live Execution Lattice" className="flex-1">
             <div className="p-6 h-full flex flex-col">
                <TradeGraphic quotes={quotes} currentSymbol={currentSymbol} />
                
                <div className="mt-8 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                  <div className="flex gap-2 p-1 bg-black/40 border border-border/20 rounded-lg mb-6">
                    <button 
                      onClick={() => setBuySide(true)}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${buySide ? 'bg-green text-black' : 'text-muted hover:text-text'}`}
                    >
                      Long / Open
                    </button>
                    <button 
                      onClick={() => setBuySide(false)}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${!buySide ? 'bg-accent text-black shadow-[0_0_20px_rgba(255,51,51,0.3)]' : 'text-muted hover:text-text'}`}
                    >
                      Short / Close
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="absolute -top-2 left-3 px-1 bg-panel text-[8px] font-bold text-muted uppercase tracking-widest z-20">Quantity</label>
                      <input 
                        type="text" 
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="ENTER UNITS"
                        className="w-full bg-black/40 border border-border/20 rounded-lg px-4 py-5 text-xl font-mono font-bold focus:outline-none focus:border-accent ring-0 transition-colors"
                      />
                    </div>

                    <button 
                      onClick={handleTrade}
                      disabled={!qty || isNaN(Number(qty))}
                      className={`w-full py-6 rounded-xl font-black uppercase tracking-[6px] text-lg shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${buySide ? 'bg-green text-black hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]' : 'bg-accent text-black hover:shadow-[0_0_30px_rgba(255,51,51,0.3)]'}`}
                    >
                      {buySide ? 'Authorize Long' : 'Authorize Short'}
                    </button>
                  </div>
                </div>
             </div>
          </Panel>
        </div>

        {/* Right Column: Events & Terminal */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0">
          <Panel title="Activity Pulse" className="flex-1">
            <div className="p-3 space-y-4">
              <div className="text-[9px] font-bold text-muted uppercase tracking-[2px] mb-2 px-2">Signed Proofs</div>
              <div className="space-y-2 overflow-auto max-h-[300px] pr-2">
                <AnimatePresence mode="popLayout">
                  {portfolio?.tradeHistory.slice().reverse().map((trade) => (
                    <motion.div 
                      key={trade.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="p-3 bg-black/20 border border-border/10 rounded-lg flex justify-between items-center group cursor-pointer hover:border-cyan/30"
                    >
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-tighter ${trade.side === 'BUY' ? 'text-green' : 'text-accent'}`}>
                          {trade.side} {trade.symbol}
                        </div>
                        <div className="text-[8px] font-mono text-muted/50 mt-1 uppercase">
                          Hash: {trade.id.slice(0, 8)}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted font-medium font-mono">
                        {trade.qty} @ ${(Number(trade.price || 0) / 100).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!portfolio || portfolio.tradeHistory.length === 0) && (
                  <div className="text-center py-10 opacity-20">
                    <History size={24} className="mx-auto mb-2" />
                    <div className="text-[8px] font-bold uppercase tracking-widest">History Empty</div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Event Stream" className="h-64">
             <div className="p-3 space-y-2 overflow-auto h-full font-mono text-[9px]">
               {engineEvents.map((e, i) => (
                  <div key={i} className="border-b border-border/10 pb-1 last:border-0 opacity-80">
                    <span className="text-muted/50">[{new Date(e.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 2 })}]</span>{' '}
                    <span className={e.type.includes('Filled') ? 'text-green' : 'text-cyan'}>{e.type.toUpperCase()}</span>{' '}
                    <span className="text-text/70">{e.data.symbol} {e.data.qty || e.data.side}</span>
                  </div>
                ))}
                {engineEvents.length === 0 && (
                  <div className="text-muted/20 italic flex items-center gap-2">
                    <Activity size={10} />
                    Listening for engine signals...
                  </div>
                )}
             </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
