import { isValidVector } from "../matrix/constraints";
import { assertInvariants, type MetricsHook } from "../matrix/invariants";
import type { AllocatorResponse, Vector } from "../matrix/testMatrix";

function resolveLatency(vector: Vector): number {
  if (vector.mode === "streaming") {
    return vector.env === "production" ? 140 : 110;
  }

  if (vector.decision === "defer") {
    return vector.env === "production" ? 280 : 230;
  }

  return vector.env === "production" ? 190 : 160;
}

export async function runAllocator(vector: Vector): Promise<AllocatorResponse> {
  if (!isValidVector(vector)) {
    throw new Error("Invalid vector");
  }

  const deferred = vector.decision === "defer";

  const autoApproved =
    vector.decision === "model" &&
    vector.auth === "protected" &&
    (vector.risk === "low" || vector.risk === "medium");

  return {
    headers: {
      "Content-Type": "application/json",
    },
    autoApproved,
    apiCalls: deferred ? 0 : 1,
    latency: resolveLatency(vector),
    stream: vector.mode === "streaming",
    deferred,
  };
}

export async function safeRunAllocator(
  vector: Vector,
  metricsHook?: MetricsHook,
): Promise<AllocatorResponse> {
  const res = await runAllocator(vector);
  assertInvariants(vector, res, metricsHook);
  return res;
}
