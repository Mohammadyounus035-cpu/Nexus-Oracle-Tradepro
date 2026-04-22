import { TAU_MAX } from "./constants.js";
import type { CoherenceState } from "./types.js";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function enforceInvariants(state: CoherenceState): CoherenceState {
  const alignment = clamp(state.alignment, 0, 1);
  const shellIntegrity = clamp(state.shellIntegrity, 0, 1);

  return {
    ...state,
    phase: Number.isFinite(state.phase) ? state.phase : 0,
    coherence: clamp(state.coherence, 0, alignment),
    alignment,
    shellIntegrity,
    temporalOffset: clamp(state.temporalOffset, -TAU_MAX, TAU_MAX),
    symbolicLoad: clamp(state.symbolicLoad, 0, shellIntegrity),
    operatorIntent: clamp(state.operatorIntent, 0, 1),
    energy: {
      fast: Math.max(0, state.energy.fast),
      mid: Math.max(0, state.energy.mid),
      deep: Math.max(0, state.energy.deep)
    }
  };
}

export function validateInvariants(state: CoherenceState): string[] {
  const violations: string[] = [];

  if (state.coherence > state.alignment) {
    violations.push("coherence_exceeds_alignment");
  }

  if (state.symbolicLoad > state.shellIntegrity) {
    violations.push("symbolic_load_exceeds_shell");
  }

  if (Math.abs(state.temporalOffset) > TAU_MAX) {
    violations.push("temporal_offset_exceeds_bound");
  }

  if (!state.grounded && !state.stable) {
    violations.push("advance_gate_not_satisfied");
  }

  return violations;
}
