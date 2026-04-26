import { describe, expect, it } from "vitest";
import { allocate } from "../src/matrix/allocator";
import { buildCanonical } from "../src/matrix/canonical";
import { isValidVector } from "../src/matrix/constraints";
import { generateAllVectors } from "../src/matrix/generator";
import { assertInvariants } from "../src/matrix/invariants";
import { computeMetrics } from "../src/matrix/metrics";
import type { Vector } from "../src/matrix/testMatrix";

const V18: Vector = {
  env: "preview",
  mode: "streaming",
  risk: "low",
  decision: "model",
  auth: "protected",
};

const V42: Vector = {
  env: "production",
  mode: "non-streaming",
  risk: "high",
  decision: "model",
  auth: "protected",
};

describe("allocator matrix", () => {
  it("generates all valid vectors and filters invalid combinations", () => {
    const vectors = generateAllVectors();

    expect(vectors.length).toBe(36);
    expect(vectors.every(isValidVector)).toBe(true);
    expect(vectors).toContainEqual(V18);
    expect(vectors).toContainEqual(V42);
    expect(
      vectors.some((vector) => vector.mode === "streaming" && vector.auth === "bypass"),
    ).toBe(false);
  });

  it("enforces invariants for every generated vector", () => {
    const vectors = generateAllVectors();

    for (const vector of vectors) {
      const metrics = computeMetrics(vector, vector.decision);
      assertInvariants(vector, vector.decision, metrics);
    }
  });

  it("builds canonical state with metrics in hash", () => {
    const vectorInput = {
      env: "preview",
      mode: "streaming",
      risk: "medium",
      auth: "protected",
    } as const;

    const canonicalA = buildCanonical(vectorInput);
    const canonicalB = buildCanonical(vectorInput);

    expect(canonicalA).toEqual(canonicalB);
    expect(canonicalA.proof.invariantsPassed).toBe(true);
    expect(canonicalA.metrics).toEqual({ latency: 120, cost: 0.8, safety: 0.9 });
  });

  it("decision scoring remains deterministic", () => {
    const input = {
      env: "production",
      mode: "non-streaming",
      risk: "medium",
      auth: "protected",
    } as const;

    expect(allocate(input)).toBe("reject");
    expect(allocate(input)).toBe("reject");
  });

  it("records metrics on invariant failures", () => {
    const metrics: Array<{ invariant: string; message: string }> = [];

    expect(() =>
      assertInvariants(
        { ...V18, decision: "bypass" },
        "bypass",
        { latency: 20, cost: 0.2, safety: 0.4 },
        (event) => {
          metrics.push({ invariant: event.invariant, message: event.message });
        },
      ),
    ).toThrow(/latency/);

    expect(metrics.length).toBe(1);
    expect(metrics[0]?.invariant).toBe("latency");
  });
});
