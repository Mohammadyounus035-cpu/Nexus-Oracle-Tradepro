import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Activity, Database, Crosshair, Shield, Zap } from "lucide-react";
import GlassCard from "../components/GlassCard";
import MiniLattice from "../components/MiniLattice";

const MOCK_SIGNALS = [
  { symbol: "NVDA", text: "Volume surge 4x average", source: "POLYGON", score: 85 },
  { symbol: "AAPL", text: "Options sweep call side", source: "OPRA", score: 72 },
  { symbol: "TSLA", text: "Sentiment drop detected", source: "SOCIAL", score: 41 },
  { symbol: "MSFT", text: "Large block trade", source: "DARKPOOL", score: 88 },
  { symbol: "AMZN", text: "Retail flow accelerating", source: "INTERNAL", score: 65 },
  { symbol: "META", text: "Volatility expansion", source: "CBOE", score: 55 },
];

export default function Console() {
  const [signals, setSignals] = useState(MOCK_SIGNALS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => {
        const next = [...prev];
        const newSignal = prev[Math.floor(Math.random() * prev.length)];
        next.unshift({ ...newSignal, score: Math.floor(Math.random() * 40) + 50 });
        if (next.length > 12) next.pop();
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-[1600px] mx-auto space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "TOTAL SIGNALS", value: "14", color: "border-l-primary" },
          { label: "ACT", value: "3", color: "border-l-destructive" },
          { label: "PREPARE", value: "5", color: "border-l-accent" },
          { label: "MONITOR", value: "6", color: "border-l-yellow-500" },
          { label: "LATEST SCORE", value: "43.0", color: "border-l-primary" },
        ].map((kpi, i) => (
          <GlassCard key={i} className={`p-4 border-l-4 ${kpi.color}`}>
            <div className="text-xs text-muted-foreground font-mono">{kpi.label}</div>
            <div className="text-2xl font-serif font-bold mt-1 text-foreground glow-text">{kpi.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HERO */}
        <GlassCard className="col-span-1 lg:col-span-2 p-6 flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 text-yellow-500 mb-4">
              <Eye className="w-8 h-8" />
              <h2 className="text-4xl font-serif font-bold tracking-wider">MONITOR</h2>
            </div>
            <div className="text-right">
              <div className="text-5xl font-mono font-bold text-yellow-500 glow-text">43.0</div>
              <div className="text-sm font-mono text-muted-foreground mt-1">CONFIDENCE 85%</div>
            </div>
          </div>
          
          <div className="my-8 font-mono text-lg text-foreground border-l-2 border-primary/50 pl-4 py-2 bg-primary/5">
            NVDA volume surge 4x average · MARKETS · SRC: POLYGON · REP 62%
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "MOMENTUM", val: 57, color: "bg-primary" },
              { label: "VOLATILITY", val: 14, color: "bg-destructive" },
              { label: "CONFIDENCE", val: 85, color: "bg-accent" }
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="text-foreground">{bar.val}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* SIGNAL STREAM */}
        <GlassCard className="col-span-1 flex flex-col h-[300px]">
          <div className="p-4 border-b border-border/50 text-xs font-mono font-bold flex items-center justify-between">
            <span className="text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" /> LIVE FEED
            </span>
            <span className="text-muted-foreground">SIGNAL STREAM</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
            {signals.map((sig, i) => (
              <motion.div 
                key={i + sig.symbol + sig.score}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 border-b border-border/30 pb-3 last:border-0"
              >
                <div className="w-12 font-bold text-accent">{sig.symbol}</div>
                <div className="flex-1">
                  <div className="text-foreground">{sig.text}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">SRC: {sig.source}</div>
                </div>
                <div className="text-primary">{sig.score}</div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PIPELINE */}
        <GlassCard className="col-span-1 lg:col-span-2 p-6">
          <div className="text-xs font-mono text-primary mb-6">MFCS UNIFIED PIPELINE</div>
          <div className="flex justify-between items-center relative py-8 px-4">
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-primary/20 -z-10 -translate-y-1/2" />
            {['INGEST', 'NORM', 'SCORE', 'PATTERN', 'CONTEXT', 'MFCS', 'ENVELOPE', 'OUTPUT'].map((node, i) => (
              <div key={node} className="flex flex-col items-center gap-2 bg-background p-1">
                <div className={`w-4 h-4 rounded-full ${i === 7 ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-primary shadow-[0_0_10px_#00d4ff] animate-pulse'}`} />
                <div className="text-[10px] font-mono text-muted-foreground -rotate-45 origin-top-left mt-2">{node}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-border/30">
            <div className="font-mono text-[10px]">
              <div className="text-muted-foreground mb-1">SOURCE TIER</div>
              <div className="text-foreground">SECONDARY</div>
            </div>
            <div className="font-mono text-[10px]">
              <div className="text-muted-foreground mb-1">DECISION CONFIDENCE</div>
              <div className="text-accent glow-text">96%</div>
            </div>
            <div className="font-mono text-[10px]">
              <div className="text-muted-foreground mb-1">PIPELINE STAGE</div>
              <div className="text-foreground">OUTPUT</div>
            </div>
            <div className="font-mono text-[10px]">
              <div className="text-muted-foreground mb-1">TAGS</div>
              <div className="text-primary bg-primary/10 px-1 py-0.5 rounded inline-block">HIGH_CONFIDENCE</div>
            </div>
          </div>
        </GlassCard>

        <div className="col-span-1 flex flex-col gap-4">
          {/* ENVELOPE LAW */}
          <GlassCard className="p-4 flex-1">
             <div className="flex justify-between items-start mb-4">
                <div className="text-xs font-mono text-primary">ENVELOPE LAW · RUNTIME CHECK</div>
                <div className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/50 font-mono">WARNING</div>
             </div>
             
             <div className="font-serif text-xl mb-4 italic text-foreground text-center">e + C·ψ·ψ + C·r·r ≤ M</div>
             
             <div className="flex justify-between items-end mb-2 font-mono">
               <div>
                 <div className="text-[10px] text-muted-foreground">VALUE</div>
                 <div className="text-2xl text-yellow-500">6.28</div>
               </div>
               <div className="text-right">
                 <div className="text-[10px] text-muted-foreground">MARGIN +3.73</div>
                 <div className="text-sm text-foreground">LIMIT M 10.0</div>
               </div>
             </div>

             <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
               <div className="h-full bg-yellow-500 w-[62.8%]" />
             </div>

             <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center mb-4">
               <div className="bg-card p-2 rounded border border-border/50">
                 <div className="text-muted-foreground mb-1">C·ψ (phase)</div>
                 <div className="text-foreground">1.00</div>
               </div>
               <div className="bg-card p-2 rounded border border-border/50">
                 <div className="text-muted-foreground mb-1">C·r (readiness)</div>
                 <div className="text-foreground">0.50</div>
               </div>
               <div className="bg-card p-2 rounded border border-border/50">
                 <div className="text-muted-foreground mb-1">M (bound)</div>
                 <div className="text-foreground">10.00</div>
               </div>
             </div>

             <div className="text-[10px] font-mono text-primary text-center pt-2 border-t border-border/30">
               ZERO_BLEED · PHASE_CANCELLATION · NOISE_FLOOR — all clear
             </div>
          </GlassCard>

          {/* MINI LATTICE */}
          <div className="h-[200px]">
            <MiniLattice />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
