import type { AdaptiveProfile, CoherenceState } from "./types.js";

export const TWO_PI = Math.PI * 2;
export const TAU_MAX = 1.0;
export const DRIFT_CRITICAL = 0.25;
export const RESONANCE_COLLAPSE_SHELL_THRESHOLD = 0.35;
export const RESONANCE_COLLAPSE_COHERENCE_THRESHOLD = 0.6;
export const INTENT_MISMATCH_THRESHOLD = 0.4;
export const CONVERGENCE_EPSILON = 0.05;

export const DEFAULT_ADAPTIVE_PROFILE: AdaptiveProfile = {
  learningRate: 0.1,
  trustWindow: 10,
  driftTolerance: 0.05,
  updateEnabled: true
};

export const DEFAULT_STATE: CoherenceState = {
  id: "node-0",
  phase: 0,
  coherence: 0.5,
  alignment: 0.7,
  shellIntegrity: 0.8,
  grounded: true,
  stable: false,
  temporalOffset: 0,
  symbolicLoad: 0.2,
  operatorIntent: 0.6,
  energy: {
    fast: 1,
    mid: 1,
    deep: 1
  },
  faultFlags: []
};
