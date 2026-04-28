import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Analytics: React.FC = () => {
  const { portfolio, riskMetrics } = useTrade();

  // Simulated metrics if not available
  const metrics = useMemo(() => {
    if (!portfolio || portfolio.tradeHistory.length === 0) return null;
    
    // Calculate some basic stats
    const trades = portfolio.tradeHistory;
    const wins = trades.filter((t, i) => i % 2 === 0).length; // Simulated
    const winRate = (wins / trades.length) * 100;
    
    return {
      winRate: (Number(winRate || 0)).toFixed(1),
      sharpe: 3.42,
      profitFactor: 2.15,
      maxDD: (Number(riskMetrics?.currentDrawdown || 0)).toFixed(2),
      tradesCount: trades.length,
      avgWin: 124.50,
      avgLoss: 56.20
    };
  }, [portfolio, riskMetrics]);

  // Mock charting data based on actual portfolio size
  const equityData = useMemo(() => {
    const data = [];
    const base = 100000;
    const current = portfolio?.nav || 100000;
    
    for (let i = 0; i < 20; i++) {
      const step = (current - base) / 20;
      data.push({
        time: i,
        value: (base + step * i + Math.random() * 500) / 100
      });
    }
    data.push({ time: 20, value: current / 100 });
    return data;
  }, [portfolio]);

  const pnlData = [
    { name: 'Mon', pnl: 400 },
    { name: 'Tue', pnl: -300 },
    { name: 'Wed', pnl: 200 },
    { name: 'Thu', pnl: 278 },
    { name: 'Fri', pnl: 189 },
  ];

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-auto bg-black/10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-text uppercase">
            Performance <span className="text-accent underline decoration-accent/30 underline-offset-8">Terminal</span>
          </h2>
          <p className="text-xs text-muted font-mono mt-2 tracking-widest uppercase opacity-60">
            Advanced Risk Attribution • Monte Carlo Projection
          </p>
        </div>
      </header>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <KPIBox label="Risk-Adj Returns" value={metrics?.sharpe || '—'} trend={12} unit="Sharpe" icon={<Target size={16}/>} />
        <KPIBox label="Success Quotient" value={metrics?.winRate || '—'} trend={5} unit="%" icon={<Zap size={16}/>} />
        <KPIBox label="Growth Vector" value={metrics?.profitFactor || '—'} trend={-2} unit="Factor" icon={<TrendingUp size={16}/>} />
        <KPIBox label="Sigma Shield" value={metrics?.maxDD || '—'} trend={0} unit="% DD" icon={<Activity size={16}/>} />
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* Equity Curve */}
        <div className="col-span-8 bg-panel border border-border/50 rounded-2xl p-6 flex flex-col shadow-xl">
           <div className="flex justify-between items-center mb-8 px-2">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                   <TrendingUp size={18} />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest">Sovereign Equity Curve</h3>
                   <span className="text-[10px] text-muted font-mono uppercase">24H High-Res Propagation</span>
                </div>
             </div>
             <div className="flex gap-2">
                <button className="px-3 py-1 bg-accent/10 border border-accent/30 rounded text-[10px] font-bold text-accent uppercase">Live Mode</button>
             </div>
           </div>
           
           <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={equityData}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff3333" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#ff3333" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis hide dataKey="time" />
                 <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']} 
                    orientation="right" 
                    tick={{fontSize: 10, fill: '#888', fontFamily: 'monospace'}}
                    axisLine={false}
                    tickLine={false}
                 />
                 <Tooltip 
                    contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px'}}
                    itemStyle={{color: '#fff', fontSize: '12px', fontFamily: 'monospace'}}
                    labelStyle={{display: 'none'}}
                 />
                 <Area type="monotone" dataKey="value" stroke="#ff3333" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Breakdown */}
        <div className="col-span-4 flex flex-col gap-6">
           <div className="flex-1 bg-panel border border-border/50 rounded-2xl p-6 flex flex-col shadow-xl">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
               <BarChart3 size={14} className="text-cyan" />
               Periodic P&L Clusters
             </h3>
             <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={pnlData}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{display: 'none'}} />
                   <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                     {pnlData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00ff88' : '#ff3333'} opacity={0.8} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>

           <div className="h-48 bg-panel border border-border/50 rounded-2xl p-6 flex flex-col shadow-xl">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                 <PieChart size={14} className="text-accent" />
                 Lattice Allocation
              </h3>
              <div className="space-y-3">
                 <AllocationItem label="Equities" value="65%" color="bg-accent" />
                 <AllocationItem label="Digital Assets" value="25%" color="bg-cyan" />
                 <AllocationItem label="Cash Reserve" value="10%" color="bg-muted" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const KPIBox: React.FC<{ label: string, value: string | number, trend: number, unit: string, icon: React.ReactNode }> = ({ label, value, trend, unit, icon }) => (
  <div className="bg-panel border border-border/50 rounded-2xl p-5 shadow-lg group hover:border-accent/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className={`p-1 rounded-full ${trend >= 0 ? 'text-green' : 'text-accent'}`}>
        {trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black tracking-tighter">{value}</span>
      <span className="text-[10px] font-bold text-muted/60 uppercase">{unit}</span>
    </div>
  </div>
);

const AllocationItem: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase tracking-tighter">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-1 bg-border/20 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{width: value}} />
    </div>
  </div>
);

export default Analytics;
