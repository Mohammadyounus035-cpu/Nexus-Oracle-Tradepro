export type FaultFlag =
  | "COHERENCE_DRIFT"
  | "SYMBOLIC_OVERLOAD"
  | "RESONANCE_COLLAPSE"
  | "INTENT_MISMATCH"
  | "TEMPORAL_SHEAR";

export type Instruction =
  | "APPROX"
  | "ADVANCE"
  | "DETECT"
  | "CORRECT"
  | "ENTANGLE"
  | "STABILIZE"
  | "GROUND"
  | "CONVERGE";

export enum SabrPhase {
  INHALE = "INHALE",
  HOLD = "HOLD",
  RELEASE = "RELEASE",
  REST = "REST"
}

export enum SystemMode {
  BUILD = "BUILD",
  OBSERVE = "OBSERVE",
  STRESS = "STRESS",
  RECOVER = "RECOVER",
  SEAL = "SEAL"
}

export enum CertificationLevel {
  EXPERIMENTAL = "EXPERIMENTAL",
  PROVISIONAL = "PROVISIONAL",
  STABLE = "STABLE",
  CERTIFIED = "CERTIFIED",
  SEALED = "SEALED"
}

export type CoherenceBudget = {
  fast: number;
  mid: number;
  deep: number;
};

export type CoherenceState = {
  id: string;
  phase: number;
  coherence: number;
  alignment: number;
  shellIntegrity: number;
  grounded: boolean;
  stable: boolean;
  temporalOffset: number;
  symbolicLoad: number;
  operatorIntent: number;
  energy: CoherenceBudget;
  faultFlags: FaultFlag[];
};

export type AdaptiveProfile = {
  learningRate: number;
  trustWindow: number;
  driftTolerance: number;
  updateEnabled: boolean;
};

export type MirrorReport = {
  ambiguity: number;
  invariantViolations: string[];
  driftScore: number;
  unresolvedPaths: string[];
  tightened: boolean;
  sealed: boolean;
};

export type Observation = {
  tick: number;
  nodeId: string;
  coherence: number;
  alignment: number;
  shellIntegrity: number;
  symbolicLoad: number;
  temporalOffset: number;
  faults: string[];
  driftScore: number;
};
