import React, { useState } from "react";
import GlassCard from "../components/GlassCard";

const ROWS = [
  { name: "CONTENT ARCHETYPE", color: "border-destructive", bg: "bg-destructive/10", text: "text-destructive", values: ['UGC','PUGC','OGC','AIGC'] },
  { name: "MONETIZATION ENGINE", color: "border-accent", bg: "bg-accent/10", text: "text-accent", values: ['SVOD','AVOD','TVOD','FAST'] },
  { name: "DISTRIBUTION TOPOLOGY", color: "border-primary", bg: "bg-primary/10", text: "text-primary", values: ['Push','Pull','Social','Algorithmic'] },
  { name: "AUDIENCE PSYCHOGRAPHIC", color: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-500", values: ['Gen Z','Millennial','Gen X','Boomer'] },
  { name: "TECHNOLOGY STACK", color: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-500", values: ['Edge','Cloud','On-Prem','Hybrid'] },
  { name: "REGULATORY TERRAIN", color: "border-muted-foreground", bg: "bg-muted", text: "text-muted-foreground", values: ['GDPR','CCPA','COPPA','DSA'] },
];

const COLS = 16;

export default function MysticMap() {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-serif text-primary glow-text tracking-widest">THE MYSTIC MAP</h2>
        <p className="font-mono text-sm text-muted-foreground mt-2">6-DIMENSIONAL PLATFORM TYPOLOGY MATRIX</p>
      </div>

      <div className="flex-1 flex overflow-x-auto pb-4 relative">
        {/* Row Labels (Sticky Left) */}
        <div className="sticky left-0 z-10 bg-background/90 backdrop-blur pr-4 flex flex-col justify-around h-full border-r border-border/30">
          {ROWS.map((row, i) => (
            <div key={i} className="h-16 flex items-center justify-end text-right">
              <span className={`text-[10px] font-mono font-bold w-32 ${row.text}`}>{row.name}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex h-full min-w-max relative">
          {/* Hover/Select Highlights */}
          {selectedCol !== null && (
            <div 
              className="absolute top-0 bottom-0 border-x-2 border-primary/50 bg-primary/5 pointer-events-none transition-all duration-300 ease-out"
              style={{ left: `${selectedCol * 120}px`, width: '120px' }}
            />
          )}
          {hoveredCol !== null && hoveredCol !== selectedCol && (
            <div 
              className="absolute top-0 bottom-0 border-x border-primary/20 bg-primary/5 pointer-events-none transition-all duration-300 ease-out"
              style={{ left: `${hoveredCol * 120}px`, width: '120px' }}
            />
          )}

          {Array.from({ length: COLS }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="w-[120px] h-full flex flex-col justify-around relative cursor-pointer group"
              onMouseEnter={() => setHoveredCol(colIndex)}
              onMouseLeave={() => setHoveredCol(null)}
              onClick={() => setSelectedCol(colIndex)}
            >
              {/* Column Index Label */}
              <div className="absolute -top-6 left-0 right-0 text-center text-[10px] font-mono text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                PATH {colIndex.toString().padStart(2, '0')}
              </div>

              {ROWS.map((row, rowIndex) => {
                const val = row.values[colIndex % row.values.length];
                const isActive = selectedCol === colIndex || hoveredCol === colIndex;
                return (
                  <div key={rowIndex} className="px-2 h-16 flex items-center justify-center">
                    <div 
                      className={`w-full h-12 flex items-center justify-center text-[11px] font-mono font-bold rounded border transition-all duration-300
                        ${isActive ? `${row.bg} ${row.color} ${row.text} shadow-[0_0_10px_currentColor]` : 'bg-card border-border/30 text-muted-foreground'}
                      `}
                    >
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCol !== null && (
        <GlassCard className="h-48 shrink-0 p-6 mt-4 flex border-t-4 border-primary">
          <div className="w-48 border-r border-border/30 pr-6">
            <div className="text-4xl font-serif text-primary glow-text">PATH {selectedCol.toString().padStart(2, '0')}</div>
            <div className="text-xs font-mono text-muted-foreground mt-2">UNIQUE CONFIGURATION</div>
          </div>
          <div className="flex-1 pl-6 grid grid-cols-3 gap-6">
            {ROWS.map((row, i) => (
              <div key={i} className="flex flex-col justify-center">
                <span className="text-[10px] font-mono text-muted-foreground mb-1">{row.name}</span>
                <span className={`text-sm font-mono font-bold ${row.text}`}>{row.values[selectedCol % row.values.length]}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
