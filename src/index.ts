import { HFCECore } from "./engine/HFCECore.js";

const core = new HFCECore();
const program = ["GROUND", "ADVANCE", "DETECT", "CONVERGE", "STABILIZE"] as const;

for (const op of program) {
  const result = core.step(op, 0.02);
  console.log(op, result.state, result.mirror);
}
