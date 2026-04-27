import { DRIFT_CRITICAL } from "./constants.js";
import type { MirrorReport, SystemMode } from "./types.js";

export function deriveSystemMode(report: MirrorReport): SystemMode {
  if (report.sealed) {
    return "SEAL";
  }

  if (report.invariantViolations.length > 0) {
    return "RECOVER";
  }

  if (report.driftScore >= DRIFT_CRITICAL) {
    return "STRESS";
  }

  if (report.ambiguity > 0) {
    return "OBSERVE";
  }

  return "BUILD";
}
