import { suggestedRecoveryInstruction } from "../core/faults.js";
import { runMirror } from "../core/mirror.js";
import { createObservation } from "../core/observe.js";
import { applyInstruction } from "../core/transitions.js";
import type { CoherenceState, Instruction, Observation } from "../core/types.js";

export type StressResult = {
  finalState: CoherenceState;
  observations: Observation[];
};

export class StressHarness {
  public run(initial: CoherenceState, plan: Instruction[]): StressResult {
    let state = initial;
    const observations: Observation[] = [];
    let tick = 0;

    for (const instruction of plan) {
      state = applyInstruction(state, instruction);
      tick += 1;
      const mirror = runMirror(state);
      observations.push(createObservation(tick, state, mirror));

      if (state.faultFlags.length > 0) {
        for (const fault of state.faultFlags) {
          state = applyInstruction(state, suggestedRecoveryInstruction(fault));
          tick += 1;
          const recoveryMirror = runMirror(state);
          observations.push(createObservation(tick, state, recoveryMirror));
        }
      }
    }

    return {
      finalState: state,
      observations
    };
  }
}
