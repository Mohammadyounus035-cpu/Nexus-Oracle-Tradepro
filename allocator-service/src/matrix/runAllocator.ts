import type { AllocatorResponse, Vector } from "./testMatrix";

function resolveLatency(vector: Vector): number {
  if (vector.mode === "streaming") return 120;
  if (vector.decision === "defer") return 240;
  if (vector.env === "production") return 190;
  return 150;
}

export function runAllocator(vector: Vector): AllocatorResponse {
  const streaming = vector.mode === "streaming";
  const deferred = vector.decision === "defer";
  const autoApproved =
    vector.decision === "model" &&
    vector.risk !== "high" &&
    vector.auth === "protected";

  return {
    headers: {
      "content-type": "application/json",
    },
    autoApproved,
    externalApiCalls: deferred ? 0 : 1,
    latencyMs: resolveLatency(vector),
    deferred,
    streaming,
  };
}
