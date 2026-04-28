import React from "react";
import GlassCard from "../components/GlassCard";
import { Shield, Zap, Diamond, Crosshair, Lock, ArrowRight } from "lucide-react";

const STACK = [
  { icon: Shield, label: "STABILIZE", tag: "Consensus & State", spec: "PBFT + HotStuff Byzantine Consensus · 2f+1 supermajority, <100ms finality, BLS signatures" },
  { icon: Zap, label: "BOOST", tag: "Compute & Execution", spec: "WASM/eBPF Runtime · Parallel execution, optimistic concurrency, state rent" },
  { icon: Diamond, label: "SIMULATE", tag: "Data Availability", spec: "Erasure Coding + DHT · KZG commitments, data availability sampling (DAS)" },
  { icon: Crosshair, label: "TRACE", tag: "Network Layer", spec: "GossipSub Protocol · Structured overlay, mesh-based pub/sub, adaptive routing" },
  { icon: Lock, label: "LOCK", tag: "Cryptography", spec: "ZK-SNARKs + Plonk · Recursive proofs, post-quantum signatures, homomorphic encryption" },
];

const MAP = [
  { sym: "Lattice Core", desc: "The central nexus of truth.", eng: "Layer 1 Blockchain", spec: "Base state machine & settlement layer" },
  { sym: "Mirrors", desc: "Reflections of the core state.", eng: "Rollups / L2s", spec: "Off-chain execution, on-chain data" },
  { sym: "Triad Bridges", desc: "Paths between domains.", eng: "Cross-chain Bridges", spec: "Light clients, threshold signatures" },
  { sym: "Envelope Field", desc: "The boundary of operations.", eng: "Mempool / sequencer", spec: "Transaction queuing and ordering" },
  { sym: "Telemetry Dust", desc: "Whispers of activity.", eng: "Indexer & Events", spec: "RPC nodes, graph indexers" },
  { sym: "Threshold Gate", desc: "The final barrier.", eng: "RPC Gateway", spec: "Rate limiting, auth, WAF" },
  { sym: "Phase Cancellation", desc: "Silencing the noise.", eng: "MEV Protection", spec: "Flashbots, order flow auctions" },
  { sym: "Zero Bleed", desc: "Perfect containment.", eng: "Slashing Conditions", spec: "Economic security mechanisms" },
  { sym: "Oracles", desc: "Eyes on the outside world.", eng: "Price Feeds", spec: "Chainlink, Pyth network" },
];

export default function Codex() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto overflow-y-auto h-[calc(100vh-6rem)] space-y-12">
      
      <section>
        <h2 className="text-2xl font-serif text-primary mb-6 glow-text tracking-widest border-b border-primary/30 pb-2">L4_PROTECTION FUNCTION STACK</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STACK.map((item, i) => (
            <GlassCard key={i} className="p-6 hover:border-primary/50 transition-colors group">
              <item.icon className="w-12 h-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
              <h3 className="text-xl font-bold font-mono text-foreground mb-1">{item.label}</h3>
              <div className="text-xs font-mono text-accent mb-4">{item.tag}</div>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">{item.spec}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif text-primary mb-6 glow-text tracking-widest border-b border-primary/30 pb-2">SYMBOLIC → ENGINEERING TRANSLATION MAP</h2>
        <div className="space-y-4">
          {MAP.map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4">
              <GlassCard className="flex-1 p-4 w-full md:w-auto border-l-4 border-l-yellow-500">
                <div className="font-serif italic text-lg text-foreground mb-1">{item.sym}</div>
                <div className="font-mono text-xs text-muted-foreground">{item.desc}</div>
              </GlassCard>
              
              <div className="text-primary hidden md:block animate-pulse">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div className="text-primary md:hidden animate-pulse rotate-90">
                <ArrowRight className="w-6 h-6" />
              </div>

              <GlassCard className="flex-1 p-4 w-full md:w-auto border-l-4 border-l-primary">
                <div className="font-mono font-bold text-lg text-primary mb-1">{item.eng}</div>
                <div className="font-mono text-xs text-muted-foreground">{item.spec}</div>
              </GlassCard>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
