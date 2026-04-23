import type { AllocatorResponse, Vector } from "./testMatrix";

export type MetricsHook = (event: string, meta: Record<string, unknown>) => void;

export function assertInvariants(
  v: Vector,
  res: AllocatorResponse,
  metricsHook?: MetricsHook,
): void {
  function fail(reason: string): never {
    metricsHook?.("allocator.invariant.violation", { reason, vector: v });
    throw new Error(reason);
  }

  if (!res.headers["Content-Type"]) {
    fail("Missing Content-Type");
  }

  if (v.risk === "high" && res.autoApproved) {
    fail("High-risk auto-approved");
  }

  if (v.decision === "defer" && res.apiCalls > 0) {
    fail("Deferred made API call");
  }

  if (v.mode === "streaming" && res.latency >= 200) {
    fail("Streaming latency exceeded");
  }
}
