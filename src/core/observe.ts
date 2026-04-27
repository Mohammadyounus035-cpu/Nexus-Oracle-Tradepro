import type { CoherenceState, MirrorReport, Observation } from "./types.js";

export function createObservation(
  tick: number,
  state: CoherenceState,
  mirror: MirrorReport
): Observation {
  return {
    tick,
    nodeId: state.id,
    coherence: state.coherence,
    alignment: state.alignment,
    shellIntegrity: state.shellIntegrity,
    symbolicLoad: state.symbolicLoad,
    temporalOffset: state.temporalOffset,
    faults: [...state.faultFlags],
    driftScore: mirror.driftScore
  };
}

export function summarizeObservation(observation: Observation): string {
  const faults = observation.faults.length > 0 ? observation.faults.join(",") : "NONE";
  return [
    `tick=${observation.tick}`,
    `id=${observation.nodeId}`,
    `coherence=${observation.coherence.toFixed(3)}`,
    `alignment=${observation.alignment.toFixed(3)}`,
    `drift=${observation.driftScore.toFixed(3)}`,
    `faults=${faults}`
  ].join(" ");
}
