import type { Metrics } from "./testMatrix";

export function score(metrics: Metrics): number {
  return metrics.safety * 2 - (metrics.cost + metrics.latency / 200);
}
