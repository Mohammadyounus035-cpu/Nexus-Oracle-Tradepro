import { sha256, stableStringify } from "../lib/hash";
import { allocate } from "./allocator";
import { assertInvariants } from "./invariants";
import { computeMetrics } from "./metrics";
import type { CanonicalState, Vector } from "./testMatrix";

export function buildCanonical(vector: Omit<Vector, "decision">): CanonicalState {
  const decision = allocate(vector);
  const resolvedVector: Vector = { ...vector, decision };
  const metrics = computeMetrics(resolvedVector, decision);

  assertInvariants(resolvedVector, decision, metrics);

  const base = {
    vector: resolvedVector,
    decision,
    metrics,
  };

  return {
    ...base,
    proof: {
      hash: sha256(stableStringify(base)),
      invariantsPassed: true,
    },
  };
}
