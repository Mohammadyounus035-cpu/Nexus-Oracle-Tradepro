import { describe, expect, it } from "vitest";
import { isValidVector } from "../src/matrix/constraints";
import { generateAllVectors } from "../src/matrix/generator";
import { assertInvariants } from "../src/matrix/invariants";
import type { AllocatorResponse, Vector } from "../src/matrix/testMatrix";
import { safeRunAllocator } from "../src/runtime/enforce";
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
  decision: "defer",
  decision: "model",
  auth: "protected",
};

describe("allocator matrix", () => {
  it("generates all and only valid vectors", () => {
    const vectors = generateAllVectors();

    expect(vectors.length).toBe(40);
    expect(vectors.every(isValidVector)).toBe(true);
    expect(new Set(vectors.map((v) => JSON.stringify(v))).size).toBe(vectors.length);

    expect(vectors).not.toContainEqual({
      env: "preview",
      mode: "streaming",
      risk: "low",
      decision: "defer",
      auth: "protected",
    });
  });

  it("enforces invariants for every generated vector", async () => {
    for (const vector of generateAllVectors()) {
      await expect(safeRunAllocator(vector)).resolves.toBeDefined();
    }
  });
});

describe("golden vectors", () => {
  it("V18 fast path", async () => {
    const res = await safeRunAllocator(V18);

    expect(res.stream).toBe(true);
    expect(res.autoApproved).toBe(true);
    expect(res.latency).toBeLessThan(200);
  });

  it("V42 safety path", async () => {
    const res = await safeRunAllocator(V42);

    expect(res.autoApproved).toBe(false);
    expect(res.apiCalls).toBe(0);
    expect(res.deferred).toBe(true);
  });
});

describe("transitions", () => {
  it("low risk -> high risk removes auto-approval", async () => {
    const lowRiskModel: Vector = {
      env: "production",
      mode: "non-streaming",
      risk: "low",
      decision: "model",
      auth: "protected",
    };
    const highRiskDefer: Vector = {
      env: "production",
      mode: "non-streaming",
      risk: "high",
      decision: "defer",
      auth: "protected",
    };

    const before = await safeRunAllocator(lowRiskModel);
    const after = await safeRunAllocator(highRiskDefer);

    expect(before.autoApproved).toBe(true);
    expect(after.autoApproved).toBe(false);
    expect(after.apiCalls).toBe(0);
  });

  it("streaming -> deferred has no cached unsafe behavior", async () => {
    const streaming: Vector = {
      env: "preview",
      mode: "streaming",
      risk: "medium",
      decision: "model",
      auth: "protected",
    };
    const deferred: Vector = {
      env: "preview",
      mode: "non-streaming",
      risk: "medium",
      decision: "defer",
      auth: "protected",
    };

    const first = await safeRunAllocator(streaming);
    const second = await safeRunAllocator(deferred);

    expect(first.stream).toBe(true);
    expect(second.stream).toBe(false);
    expect(second.deferred).toBe(true);
    expect(second.apiCalls).toBe(0);
  });
});

describe("metrics hook", () => {
  it("fires on invariant violation", () => {
    let called = false;
    const badVector: Vector = {
      env: "preview",
      mode: "non-streaming",
      risk: "high",
      decision: "model",
      auth: "protected",
    };

    const badResponse: AllocatorResponse = {
      headers: { "Content-Type": "application/json" },
      autoApproved: true,
      apiCalls: 1,
      latency: 150,
      stream: false,
      deferred: false,
    };

    expect(() =>
      assertInvariants(badVector, badResponse, () => {
        called = true;
      }),
    ).toThrow("High-risk auto-approved");
    expect(called).toBe(true);
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
