import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  TrendingUp, 
  Settings, 
  Database,
  Cpu,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTrade } from '../context/TradeContext';

const Layout: React.FC = () => {
  const { identity, riskMetrics } = useTrade();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    // 671.6 Hz visual representation (scaled to a visible pulse)
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 1489); // approx pulse period
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden font-sans relative">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20" />
      <div className="scanline z-50 opacity-10" />
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border/50 bg-panel/30 flex flex-col relative">
        <div className="p-6 border-b border-border/50 bg-panel/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-accent font-bold tracking-tighter mb-1">
            <div className="relative">
              <Activity size={20} className="text-accent animate-pulse" />
              <motion.div 
                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.48, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-accent/30"
              />
            </div>
            <span className="text-lg">NEXUS • ORACLE</span>
          </div>
          <div className="text-[10px] text-muted uppercase tracking-[3px] font-medium opacity-60">
            Lattice Node v4.0 • 671.6 Hz
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Engine Dashboard" />
          <NavItem to="/ledger" icon={<History size={18} />} label="Global Ledger" />
          <NavItem to="/analytics" icon={<TrendingUp size={18} />} label="High-Fi Analytics" />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Node Settings" />
        </nav>

        <div className="p-4 mt-auto border-t border-border/50 bg-panel/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 text-accent">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Sovereign Identity</div>
              <div className="text-[11px] font-mono truncate opacity-60">
                {identity?.publicKey.slice(0, 16)}...
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/10">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
              <span className="text-muted">Node Status</span>
              <span className={riskMetrics?.status === 'green' ? 'text-green' : (riskMetrics?.status === 'yellow' ? 'text-yellow' : 'text-accent')}>
                {riskMetrics?.status?.toUpperCase() || 'INITIALIZING'}
              </span>
            </div>
            <div className="h-1 bg-border/20 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${riskMetrics?.status === 'green' ? 'bg-green' : (riskMetrics?.status === 'yellow' ? 'bg-yellow' : 'bg-accent')}`}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-all duration-200
        ${isActive 
          ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(255,51,51,0.1)]' 
          : 'text-muted hover:bg-white/5 hover:text-text'}
      `}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default Layout;
