import type { Decision, Metrics, Vector } from "./testMatrix";

export type InvariantMetricsHook = (event: {
  vector: Vector;
  invariant: string;
  message: string;
}) => void;

export function assertInvariants(
  vector: Vector,
  decision: Decision,
  metrics?: Metrics,
  metricsHook?: InvariantMetricsHook,
): void {
  const fail = (invariant: string, message: string): never => {
    metricsHook?.({ vector, invariant, message });
    throw new Error(`${invariant}: ${message}`);
  };

  if (vector.risk === "high" && decision === "bypass") {
    fail("safety", "unsafe bypass");
  }

  if (vector.mode === "streaming" && decision !== "model") {
    fail("latency", "streaming must use model");
  }

  if (metrics) {
    if (metrics.safety < 0.5) {
      fail("safety", "safety floor violated");
    }

    if (metrics.latency < 0 || metrics.cost < 0) {
      fail("metrics", "invalid metric values");
    }
  }
}
