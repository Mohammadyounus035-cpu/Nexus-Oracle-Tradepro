import type { Decision, Metrics, Vector } from "./testMatrix";

export function computeMetrics(v: Vector, d: Decision): Metrics {
  const latency = d === "model" ? 120 : d === "bypass" ? 20 : 10;
  const cost = d === "model" ? 0.8 : d === "bypass" ? 0.2 : 0.05;
  const safety =
    v.risk === "high"
      ? d === "model"
        ? 1
        : 0
      : v.risk === "medium"
        ? d === "bypass"
          ? 0.6
          : 0.9
        : 1;

  return { latency, cost, safety };
}
