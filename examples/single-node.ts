import { SAFE_BOOT_SEQUENCE } from "../src/core/commands.js";
import { DEFAULT_STATE } from "../src/core/constants.js";
import { deriveSystemMode } from "../src/core/modes.js";
import { summarizeObservation } from "../src/core/observe.js";
import { StressHarness } from "../src/engine/StressHarness.js";

const harness = new StressHarness();
const result = harness.run(DEFAULT_STATE, [...SAFE_BOOT_SEQUENCE, "ADVANCE", "ADVANCE"]);

for (const observation of result.observations) {
  console.log(summarizeObservation(observation));
}

const finalMirror = {
  ambiguity: Number(!result.finalState.grounded) + Number(!result.finalState.stable),
  invariantViolations: [],
  driftScore: Math.max(0, result.finalState.coherence - result.finalState.alignment),
  unresolvedPaths: [],
  tightened: true,
  sealed: result.finalState.grounded && result.finalState.stable
};

console.log("mode", deriveSystemMode(finalMirror));
console.log("final", result.finalState);
