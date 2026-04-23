import { describe, expect, it } from "vitest";
import { isValidVector } from "../src/matrix/constraints";
import { generateValidVectors } from "../src/matrix/generator";
import { assertInvariants } from "../src/matrix/invariants";
import { runAllocator } from "../src/matrix/runAllocator";
import type { Vector } from "../src/matrix/testMatrix";

const V18_FAST_PATH: Vector = {
  env: "preview",
  mode: "streaming",
  risk: "low",
  decision: "model",
  auth: "protected",
};

const V42_SAFETY_PATH: Vector = {
  env: "production",
  mode: "non-streaming",
  risk: "high",
  decision: "defer",
  auth: "protected",
};

describe("allocator test matrix", () => {
  it("generates every valid vector and excludes invalid vectors", () => {
    const vectors = generateValidVectors();
    expect(vectors.length).toBeGreaterThan(0);
    expect(vectors.every(isValidVector)).toBe(true);

    expect(vectors).not.toContainEqual({
      env: "preview",
      mode: "streaming",
      risk: "low",
      decision: "defer",
      auth: "protected",
    });

    expect(vectors).not.toContainEqual({
      env: "production",
      mode: "non-streaming",
      risk: "high",
      decision: "model",
      auth: "bypass",
    });
  });

  it("enforces invariants for every generated vector", () => {
    for (const vector of generateValidVectors()) {
      const response = runAllocator(vector);
      expect(() => assertInvariants(vector, response)).not.toThrow();
    }
  });

  it("validates V18 fast path", () => {
    const response = runAllocator(V18_FAST_PATH);

    expect(response.streaming).toBe(true);
    expect(response.autoApproved).toBe(true);
    expect(response.latencyMs).toBeLessThan(200);
    expect(() => assertInvariants(V18_FAST_PATH, response)).not.toThrow();
  });

  it("validates V42 safety path", () => {
    const response = runAllocator(V42_SAFETY_PATH);

    expect(response.autoApproved).toBe(false);
    expect(response.externalApiCalls).toBe(0);
    expect(response.deferred).toBe(true);
    expect(() => assertInvariants(V42_SAFETY_PATH, response)).not.toThrow();
  });

  it("guards transitions: low-risk to high-risk and streaming to deferred", () => {
    const lowRiskStreaming: Vector = {
      env: "production",
      mode: "streaming",
      risk: "low",
      decision: "model",
      auth: "protected",
    };
    const highRiskDeferred: Vector = {
      env: "production",
      mode: "non-streaming",
      risk: "high",
      decision: "defer",
      auth: "protected",
    };

    const first = runAllocator(lowRiskStreaming);
    const second = runAllocator(highRiskDeferred);

    expect(first.autoApproved).toBe(true);
    expect(second.autoApproved).toBe(false);
    expect(second.deferred).toBe(true);
    expect(second.externalApiCalls).toBe(0);
    expect(() => assertInvariants(lowRiskStreaming, first)).not.toThrow();
    expect(() => assertInvariants(highRiskDeferred, second)).not.toThrow();
  });

  it("does not leak state across sequential evaluations", () => {
    const highRiskDeferred: Vector = {
      env: "production",
      mode: "non-streaming",
      risk: "high",
      decision: "defer",
      auth: "protected",
    };
    const lowRiskStreaming: Vector = {
      env: "preview",
      mode: "streaming",
      risk: "low",
      decision: "model",
      auth: "protected",
    };

    const first = runAllocator(highRiskDeferred);
    const second = runAllocator(lowRiskStreaming);

    expect(first.autoApproved).toBe(false);
    expect(first.externalApiCalls).toBe(0);
    expect(second.autoApproved).toBe(true);
    expect(second.streaming).toBe(true);
    expect(second.latencyMs).toBeLessThan(200);
  });
});
