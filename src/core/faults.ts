import {
  INTENT_MISMATCH_THRESHOLD,
  RESONANCE_COLLAPSE_COHERENCE_THRESHOLD,
  RESONANCE_COLLAPSE_SHELL_THRESHOLD,
  TAU_MAX
} from "./constants.js";
import type { CoherenceState, FaultFlag, Instruction } from "./types.js";

export function detectFaults(state: CoherenceState): FaultFlag[] {
  const faults: FaultFlag[] = [];

  if (state.coherence > state.alignment) {
    faults.push("COHERENCE_DRIFT");
  }

  if (state.symbolicLoad > state.shellIntegrity) {
    faults.push("SYMBOLIC_OVERLOAD");
  }

  if (
    state.shellIntegrity < RESONANCE_COLLAPSE_SHELL_THRESHOLD &&
    state.coherence > RESONANCE_COLLAPSE_COHERENCE_THRESHOLD
  ) {
    faults.push("RESONANCE_COLLAPSE");
  }

  if (Math.abs(state.operatorIntent - state.alignment) > INTENT_MISMATCH_THRESHOLD) {
    faults.push("INTENT_MISMATCH");
  }

  if (Math.abs(state.temporalOffset) > TAU_MAX) {
    faults.push("TEMPORAL_SHEAR");
  }

  return faults;
}

export function suggestedRecoveryInstruction(fault: FaultFlag): Instruction {
  switch (fault) {
    case "COHERENCE_DRIFT":
      return "STABILIZE";
    case "SYMBOLIC_OVERLOAD":
      return "APPROX";
    case "RESONANCE_COLLAPSE":
      return "CORRECT";
    case "INTENT_MISMATCH":
      return "GROUND";
    case "TEMPORAL_SHEAR":
      return "CONVERGE";
  }
}
