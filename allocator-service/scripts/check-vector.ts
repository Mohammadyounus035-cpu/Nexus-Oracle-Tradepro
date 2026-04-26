import { assertInvariants } from "../src/matrix/invariants";
import { computeMetrics } from "../src/matrix/metrics";
import type { Vector } from "../src/matrix/testMatrix";

const payload = process.argv[2];

if (!payload) {
  throw new Error("Expected a JSON vector argument");
}

const candidate = JSON.parse(payload) as Vector;
const metrics = computeMetrics(candidate, candidate.decision);

assertInvariants(candidate, candidate.decision, metrics);
console.log(`ok ${JSON.stringify({ vector: candidate, metrics })}`);
