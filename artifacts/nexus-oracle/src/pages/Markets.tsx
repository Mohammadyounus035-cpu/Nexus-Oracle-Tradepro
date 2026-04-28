import React from "react";
import GlassCard from "../components/GlassCard";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar, Legend
} from "recharts";

const trajData = [
  { year: 2020, social: 380, streaming: 160 },
  { year: 2021, social: 520, streaming: 220 },
  { year: 2022, social: 680, streaming: 290 },
  { year: 2023, social: 820, streaming: 360 },
  { year: 2024, social: 950, streaming: 440 },
  { year: 2025, social: 1002, streaming: 520 },
  { year: 2026, social: 1349, streaming: 620 },
  { year: 2027, social: 1810, streaming: 750 },
  { year: 2028, social: 2430, streaming: 910 },
  { year: 2029, social: 3260, streaming: 1120 },
  { year: 2030, social: 4425, streaming: 1380 },
];

const ecoData = [
  { name: 'Facebook', x: 3.0, y: 134, z: 40, fill: 'hsl(var(--primary))' },
  { name: 'YouTube', x: 2.7, y: 31, z: 80, fill: 'hsl(var(--destructive))' },
  { name: 'Instagram', x: 2.4, y: 51, z: 60, fill: 'hsl(var(--primary))' },
  { name: 'TikTok', x: 1.6, y: 14, z: 95, fill: 'hsl(var(--accent))' },
  { name: 'Netflix', x: 0.26, y: 33, z: 70, fill: 'hsl(var(--destructive))' },
  { name: 'Amazon Prime', x: 0.2, y: 35, z: 45, fill: 'hsl(var(--destructive))' },
  { name: 'Disney+', x: 0.15, y: 8, z: 40, fill: 'hsl(var(--destructive))' },
  { name: 'X/Twitter', x: 0.5, y: 3, z: 35, fill: 'hsl(var(--primary))' },
  { name: 'Snapchat', x: 0.4, y: 4, z: 50, fill: 'hsl(var(--primary))' },
  { name: 'LinkedIn', x: 0.9, y: 15, z: 20, fill: 'hsl(var(--primary))' },
];

const pieData = [
  { name: 'Streaming', value: 47.5, color: 'hsl(var(--primary))' },
  { name: 'Broadcast', value: 21.4, color: 'hsl(var(--muted-foreground))' },
  { name: 'Cable', value: 20.2, color: 'hsl(var(--destructive))' },
  { name: 'Other', value: 10.9, color: 'hsl(var(--border))' },
];

const cordData = [
  { year: '2018', paytv: 95, cordcutters: 35 },
  { year: '2019', paytv: 88, cordcutters: 40 },
  { year: '2020', paytv: 82, cordcutters: 48 },
  { year: '2021', paytv: 76, cordcutters: 55 },
  { year: '2022', paytv: 70, cordcutters: 62 },
  { year: '2023', paytv: 65, cordcutters: 68 },
  { year: '2024', paytv: 64, cordcutters: 70 },
  { year: '2025', paytv: 63, cordcutters: 72 },
  { year: '2026', paytv: 62, cordcutters: 75 },
];

const tiktokData = [
  { year: '2023', global: 4.4, us: 0.4 },
  { year: '2024', global: 33.2, us: 6 },
  { year: '2025', global: 65, us: 12 },
  { year: '2026', global: 123, us: 24 },
  { year: '2027', global: 197, us: 38 },
];

const genData = [
  { platform: 'YouTube', GenZ: 95, Millennial: 93, GenX: 83, Boomer: 68 },
  { platform: 'Facebook', GenZ: 33, Millennial: 69, GenX: 76, Boomer: 73 },
  { platform: 'Instagram', GenZ: 76, Millennial: 82, GenX: 58, Boomer: 35 },
  { platform: 'TikTok', GenZ: 72, Millennial: 48, GenX: 31, Boomer: 13 },
  { platform: 'Snapchat', GenZ: 65, Millennial: 35, GenX: 16, Boomer: 5 },
  { platform: 'X', GenZ: 42, Millennial: 45, GenX: 35, Boomer: 20 },
];

const regionalData = [
  // Rows: NA, Europe, APAC, LatAm, MEA
  // Cols: Social %, Stream $B, Ad $B, Comm $B, Time
  [ 72,  38,  120, 250, 140 ],
  [ 68,  22,  85,  180, 110 ],
  [ 85,  45,  160, 480, 190 ],
  [ 78,  8,   25,  60,  210 ],
  [ 55,  4,   15,  40,  160 ]
];

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <GlassCard className="p-4 h-[400px] flex flex-col">
      <h3 className="text-primary font-mono text-sm mb-4">{title}</h3>
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 border border-primary p-2 text-xs font-mono rounded">
        <p className="text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Markets() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto overflow-y-auto h-[calc(100vh-6rem)] space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* A */}
        <ChartCard title="GLOBAL MARKET TRAJECTORY ($B)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajData}>
              <defs>
                <linearGradient id="gradSocial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradStream" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="social" stackId="1" stroke="hsl(var(--primary))" fill="url(#gradSocial)" />
              <Area type="monotone" dataKey="streaming" stackId="1" stroke="hsl(var(--destructive))" fill="url(#gradStream)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* B */}
        <ChartCard title="PLATFORM ECOSYSTEM (x:MAU B, y:Rev $B, z:Eng)">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" dataKey="x" name="MAU" unit="B" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <YAxis type="number" dataKey="y" name="Rev" unit="$B" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Platforms" data={ecoData}>
                {ecoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* C - Heatmap */}
        <ChartCard title="REGIONAL DISTRIBUTION HEATMAP">
          <div className="w-full h-full flex flex-col">
            <div className="grid grid-cols-6 gap-1 text-[10px] font-mono text-muted-foreground text-center mb-2">
              <div></div>
              <div>SOCIAL %</div>
              <div>STREAM $B</div>
              <div>AD $B</div>
              <div>COMM $B</div>
              <div>TIME(m)</div>
            </div>
            <div className="flex-1 grid grid-rows-5 gap-1">
              {['NA', 'EUR', 'APAC', 'LATAM', 'MEA'].map((region, rIdx) => (
                <div key={region} className="grid grid-cols-6 gap-1">
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-end pr-2">{region}</div>
                  {regionalData[rIdx].map((val, cIdx) => {
                    const max = Math.max(...regionalData.map(r => r[cIdx]));
                    const opacity = Math.max(0.1, val / max);
                    return (
                      <div 
                        key={cIdx} 
                        className="rounded flex items-center justify-center text-xs font-mono"
                        style={{ 
                          backgroundColor: `rgba(0, 212, 255, ${opacity})`,
                          color: opacity > 0.5 ? '#000' : '#fff'
                        }}
                      >
                        {val}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* D & E */}
        <div className="grid grid-cols-2 gap-4 h-[400px]">
          <GlassCard className="p-4 flex flex-col">
            <h3 className="text-primary font-mono text-sm mb-2">US TV VIEWING SHARE</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col">
            <h3 className="text-primary font-mono text-sm mb-2">CORD-CUTTING (M)</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cordData}>
                  <XAxis dataKey="year" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="paytv" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cordcutters" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* F */}
        <ChartCard title="TIKTOK SHOP GMV EXPLOSION ($B)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tiktokData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
              <Bar dataKey="global" fill="hsl(var(--primary))" />
              <Bar dataKey="us" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* G */}
        <ChartCard title="GENERATIONAL PENETRATION (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="platform" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Bar dataKey="GenZ" fill="hsl(var(--primary))" />
              <Bar dataKey="Millennial" fill="hsl(var(--accent))" />
              <Bar dataKey="GenX" fill="hsl(var(--yellow-500))" />
              <Bar dataKey="Boomer" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
