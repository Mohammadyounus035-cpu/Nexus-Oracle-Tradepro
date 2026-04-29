import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Clock, Radio } from "lucide-react";
import BrandMark from "./BrandMark";
import NewsTicker from "./NewsTicker";
import ResonanceWave from "./ResonanceWave";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [drift, setDrift] = useState(0);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = setInterval(() => {
      // micro-drift around 0.000% to feel alive but always within envelope
      setDrift((Math.random() - 0.5) * 0.008);
      setNow(new Date().toISOString());
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const navLinks = [
    { href: "/", label: "Console" },
    { href: "/lattice", label: "Lattice" },
    { href: "/verify", label: "Verify" },
    { href: "/backtest", label: "Backtest" },
    { href: "/tradepro", label: "TradePro" },
    { href: "/markets", label: "Markets" },
    { href: "/codex", label: "Codex" },
    { href: "/mystic-map", label: "Mystic Map" },
  ];

  const driftStr = (drift >= 0 ? "+" : "") + drift.toFixed(3) + "%";

  return (
    <div className="min-h-screen flex flex-col text-foreground font-sans">
      {/* Top Header */}
      <header className="h-16 glass-panel rounded-none border-b border-primary/30 flex items-center justify-between px-6 z-50 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark />
          <h1 className="font-serif font-bold text-base tracking-widest neon-cyan whitespace-nowrap hidden sm:block">
            NEXUS ORACLE <span className="opacity-50 hidden md:inline">·</span><span className="hidden md:inline"> TRADEPRO</span>
          </h1>
          <div
            className="hidden xl:flex items-center gap-2 ml-2 pl-3 border-l border-primary/20"
            data-testid="header-resonance"
          >
            <ResonanceWave width={80} height={22} />
          </div>
        </div>

        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1.5 rounded-md font-mono text-xs transition-all duration-200 whitespace-nowrap ${
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/50 glow-text" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-accent glow-text">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            STREAMING · LIVE
          </div>
          <div className="hidden sm:flex items-center gap-1 text-primary border border-primary/30 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3" />
            MIRROR HOLDS
          </div>
          <div className="text-muted-foreground tabular-nums">
            DRIFT <span className={Math.abs(drift) < 0.005 ? "text-accent" : "text-primary"}>{driftStr}</span>
          </div>
        </div>
      </header>

      {/* News Wire Ticker */}
      <NewsTicker />

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 glass-panel rounded-none border-t border-primary/30 flex items-center justify-between px-4 z-50 text-xs font-mono text-muted-foreground sticky bottom-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {now}</span>
          <span className="hidden md:inline">L0_TRACK <span className="text-accent">CONFIRMED</span></span>
          <span className="hidden lg:inline">L4_FAN <span className="text-primary">ACTIVE</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">τ <span className="text-accent">&gt; 50%</span></span>
          <span>LATENCY: <span className="text-accent">12ms</span></span>
          <span>PHASE-LOCK: <span className="text-primary">STABLE</span></span>
          <Activity className="w-3 h-3 text-primary animate-pulse" />
        </div>
      </footer>
    </div>
  );
}
