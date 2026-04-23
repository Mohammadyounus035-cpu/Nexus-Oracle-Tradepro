import { describe, expect, it } from "vitest";
import { isValidVector } from "../src/matrix/constraints";
import { generateAllVectors } from "../src/matrix/generator";
import { assertInvariants } from "../src/matrix/invariants";
import type { AllocatorResponse, Vector } from "../src/matrix/testMatrix";
import { safeRunAllocator } from "../src/runtime/enforce";

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
  });
});
