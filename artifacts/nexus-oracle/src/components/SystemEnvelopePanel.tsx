import GlassCard from "./GlassCard";

interface Band {
  zone: "VALID" | "BOUNDARY" | "INVALID";
  label: string;
  detail: string;
}

const BANDS: Band[] = [
  { zone: "VALID", label: "f < n/2", detail: "Consensus guaranteed" },
  { zone: "VALID", label: "Connected graph", detail: "Truth propagates" },
  { zone: "VALID", label: "Gossip > TTL decay", detail: "Truth survives" },
  { zone: "BOUNDARY", label: "f = n/2", detail: "Safe stalemate · no split-brain" },
  { zone: "INVALID", label: "f > n/2", detail: "Safety violation · mathematical limit" },
];

const ZONE_STYLE: Record<Band["zone"], { color: string; bg: string; tag: string }> = {
  VALID: { color: "#00ffaa", bg: "rgba(0,255,170,0.08)", tag: "VALID" },
  BOUNDARY: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", tag: "BOUNDARY" },
  INVALID: { color: "#ff4466", bg: "rgba(255,68,102,0.08)", tag: "INVALID" },
};

export default function SystemEnvelopePanel() {
  return (
    <GlassCard className="p-4" data-testid="panel-envelope">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-primary tracking-widest">
          SYSTEM VALIDITY ENVELOPE
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">OPERATIONAL</div>
      </div>

      <div className="relative h-12 mb-4 rounded overflow-hidden border border-border/40">
        <div className="absolute inset-y-0 left-0 w-[58%]" style={{ background: "linear-gradient(90deg, rgba(0,255,170,0.35), rgba(0,255,170,0.15))" }} />
        <div className="absolute inset-y-0 left-[58%] w-[14%]" style={{ background: "linear-gradient(90deg, rgba(255,170,0,0.35), rgba(255,170,0,0.15))" }} />
        <div className="absolute inset-y-0 left-[72%] w-[28%]" style={{ background: "linear-gradient(90deg, rgba(255,68,102,0.25), rgba(255,68,102,0.1))" }} />
        <div className="absolute inset-y-0 left-[58%] w-px bg-amber" style={{ background: "#ffaa00" }} />
        <div className="absolute inset-y-0 left-[72%] w-px bg-destructive" />

        <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-[10px] text-foreground/80">
          <span>0</span>
          <span style={{ color: "#ffaa00" }}>n/2</span>
          <span className="text-destructive">n</span>
        </div>

        {/* Operating-point marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px]"
          style={{ left: "26%", background: "#00d4ff", boxShadow: "0 0 10px #00d4ff" }}
        />
        <div
          className="absolute -top-1 text-[9px] font-mono"
          style={{ left: "26%", transform: "translateX(-50%)", color: "#00d4ff" }}
        >
          NOW
        </div>
      </div>

      <div className="space-y-1.5">
        {BANDS.map(band => {
          const style = ZONE_STYLE[band.zone];
          return (
            <div
              key={band.label}
              className="flex items-center justify-between px-3 py-1.5 rounded border font-mono text-[11px]"
              style={{ borderColor: `${style.color}40`, background: style.bg }}
              data-testid={`envelope-${band.zone.toLowerCase()}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-[9px] tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: style.color, border: `1px solid ${style.color}55` }}
                >
                  {style.tag}
                </span>
                <span className="text-foreground">{band.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{band.detail}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
