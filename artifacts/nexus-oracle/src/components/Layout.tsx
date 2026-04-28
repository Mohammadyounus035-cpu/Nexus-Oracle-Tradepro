import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Clock } from "lucide-react";
import BrandMark from "./BrandMark";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Console" },
    { href: "/lattice", label: "Lattice" },
    { href: "/tradepro", label: "TradePro" },
    { href: "/markets", label: "Markets" },
    { href: "/codex", label: "Codex" },
    { href: "/mystic-map", label: "Mystic Map" },
  ];

  return (
    <div className="min-h-screen flex flex-col text-foreground font-sans">
      {/* Top Header */}
      <header className="h-16 glass-panel rounded-none border-b border-primary/30 flex items-center justify-between px-6 z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <BrandMark />
          <h1 className="font-serif font-bold text-lg tracking-widest neon-cyan">
            NEXUS ORACLE <span className="opacity-50">·</span> TRADEPRO
          </h1>
        </div>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md font-mono text-sm transition-all duration-200 ${
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
          <div className="text-muted-foreground">
            DRIFT <span className="text-primary">0.000%</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 glass-panel rounded-none border-t border-primary/30 flex items-center justify-between px-4 z-50 text-xs font-mono text-muted-foreground sticky bottom-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toISOString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>LATENCY: <span className="text-accent">12ms</span></span>
          <span>PHASE-LOCK: <span className="text-primary">OPTIMAL</span></span>
          <Activity className="w-3 h-3 text-primary animate-pulse" />
        </div>
      </footer>
    </div>
  );
}
