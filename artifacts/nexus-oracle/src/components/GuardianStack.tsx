import { Eye, AlertTriangle, Flame, Sparkles, Crown, Check, X } from "lucide-react";
import GlassCard from "./GlassCard";
import { GUARDIAN_LABELS, type ValidationResult, type Guardian } from "../lib/tradingEngine";

const ICONS: Record<Guardian, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  owl: Eye,
  raven: AlertTriangle,
  phoenix: Flame,
  dragon: Sparkles,
  lion: Crown,
};

interface Props {
  validation?: ValidationResult;
  compact?: boolean;
}

export default function GuardianStack({ validation, compact = false }: Props) {
  const order: Guardian[] = ["owl", "raven", "phoenix", "dragon", "lion"];

  return (
    <GlassCard className="p-4" data-testid="panel-guardians">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-primary tracking-widest">
          SOVEREIGN GUARDIANS · Γ1 → Γ5
        </div>
        {validation && (
          <div
            className="text-[10px] font-mono px-2 py-0.5 rounded border"
            style={{
              color: validation.approved ? "#00ffaa" : "#ff4466",
              borderColor: validation.approved ? "#00ffaa55" : "#ff446655",
              background: validation.approved ? "rgba(0,255,170,0.08)" : "rgba(255,68,102,0.08)",
            }}
          >
            {validation.approved ? "APPROVED" : "REJECTED"}
          </div>
        )}
      </div>

      <div className={compact ? "grid grid-cols-5 gap-2" : "grid grid-cols-5 gap-3"}>
        {order.map(g => {
          const meta = GUARDIAN_LABELS[g];
          const result = validation?.results.find(r => r.guardian === g);
          const isReject = result && !result.passed;
          const isPass = result && result.passed;
          const Icon = ICONS[g];
          return (
            <div
              key={g}
              className="rounded border p-2 flex flex-col items-center gap-1.5 transition-colors"
              style={{
                borderColor: isReject ? "#ff4466" : isPass ? meta.color + "66" : "#ffffff20",
                background: isReject ? "rgba(255,68,102,0.1)" : isPass ? meta.color + "10" : "rgba(255,255,255,0.02)",
              }}
              data-testid={`guardian-${g}`}
            >
              <Icon className="w-5 h-5" style={{ color: isReject ? "#ff4466" : meta.color }} />
              <div className="font-mono text-[9px] tracking-widest text-muted-foreground">{meta.gamma}</div>
              <div className="font-mono text-[10px]" style={{ color: isReject ? "#ff4466" : meta.color }}>
                {meta.name.toUpperCase()}
              </div>
              {!compact && <div className="font-mono text-[8px] text-muted-foreground text-center leading-tight">{meta.role}</div>}
              <div>
                {isReject ? (
                  <X className="w-3 h-3 text-destructive" />
                ) : isPass ? (
                  <Check className="w-3 h-3 text-accent" />
                ) : (
                  <span className="block w-3 h-3 rounded-full border border-muted" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {validation && !validation.approved && validation.rejectionReason && (
        <div className="mt-3 px-3 py-2 rounded border border-destructive/40 bg-destructive/5 font-mono text-[10px] text-destructive">
          BLOCKED · {validation.rejectingGuardian?.toUpperCase()} · {validation.rejectionReason}
        </div>
      )}
    </GlassCard>
  );
}
