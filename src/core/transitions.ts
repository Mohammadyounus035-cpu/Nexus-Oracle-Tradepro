import { CONVERGENCE_EPSILON, TWO_PI } from "./constants.js";
import { detectFaults } from "./faults.js";
import { enforceInvariants } from "./invariants.js";
import type { CoherenceState, Instruction } from "./types.js";

export function applyInstruction(
  state: CoherenceState,
  instruction: Instruction
): CoherenceState {
  let next: CoherenceState;

  switch (instruction) {
    case "GROUND":
      next = {
        ...state,
        grounded: true
      };
      break;

    case "STABILIZE":
      next = {
        ...state,
        coherence: Math.min(state.coherence, state.alignment),
        temporalOffset: state.temporalOffset * 0.5,
        stable: true
      };
      break;

    case "ADVANCE":
      if (!(state.grounded || state.stable)) {
        next = { ...state };
        break;
      }

      next = {
        ...state,
        phase: (state.phase + 0.1) % TWO_PI,
        energy: {
          ...state.energy,
          fast: Math.max(0, state.energy.fast - 0.05)
        }
      };
      break;

    case "DETECT":
      next = {
        ...state
      };
      break;

    case "CORRECT":
      next = {
        ...state,
        coherence: Math.min(state.coherence, state.alignment),
        symbolicLoad: Math.min(state.symbolicLoad, state.shellIntegrity),
        temporalOffset: state.temporalOffset * 0.25,
        grounded: true,
        stable: true
      };
      break;

    case "APPROX":
      next = {
        ...state,
        coherence: state.coherence * 0.98,
        symbolicLoad: state.symbolicLoad * 0.95
      };
      break;

    case "ENTANGLE":
      next = {
        ...state,
        temporalOffset: state.temporalOffset * 0.8
      };
      break;

    case "CONVERGE":
      next = {
        ...state,
        coherence: state.coherence + 0.1 * (state.alignment - state.coherence),
        stable: Math.abs(state.alignment - state.coherence) < CONVERGENCE_EPSILON
      };
      break;
  }

  const enforced = enforceInvariants(next);

  return {
    ...enforced,
    faultFlags: detectFaults(enforced)
  };
}
