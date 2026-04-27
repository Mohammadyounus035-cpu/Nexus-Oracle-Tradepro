import { validateInvariants } from "./invariants.js";
import type { CoherenceState, MirrorReport } from "./types.js";

export function runMirror(state: CoherenceState): MirrorReport {
  const invariantViolations = validateInvariants(state);
  const ambiguity =
    Number(!state.grounded) +
    Number(!state.stable) +
    Number(state.faultFlags.length > 0);
  const driftScore =
    Math.max(0, state.coherence - state.alignment) +
    Math.max(0, state.symbolicLoad - state.shellIntegrity) +
    Math.max(0, Math.abs(state.temporalOffset) - 1.0);
  const unresolvedPaths = [...invariantViolations];

  return {
    ambiguity,
    invariantViolations,
    driftScore,
    unresolvedPaths,
    tightened: invariantViolations.length === 0,
    sealed: invariantViolations.length === 0 && ambiguity === 0
  };
}
