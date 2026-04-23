import type { AllocatorResponse, Vector } from "./testMatrix";

export function assertInvariants(vector: Vector, response: AllocatorResponse): void {
  if (!response.headers["content-type"]) {
    throw new Error("Invariant violation: missing Content-Type header");
  }

  if (vector.risk === "high" && response.autoApproved) {
    throw new Error("Invariant violation: high-risk vector cannot auto-approve");
  }

  if (vector.decision === "defer" && response.externalApiCalls > 0) {
    throw new Error("Invariant violation: deferred vector cannot call external APIs");
  }

  if (vector.mode === "streaming" && response.latencyMs >= 200) {
    throw new Error("Invariant violation: streaming latency must be under 200ms");
  }
}
