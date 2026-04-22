import { describe, expect, it } from "vitest";
import { evaluateMode } from "../packages/control-kernel/src/controlKernel.js";

describe("Control Kernel", () => {
  it("stays in normal mode for healthy snapshots", () => {
    const result = evaluateMode({ queueDepth: 42, contaminationRate: 0.05, confidenceDrift: 0.06 });
    expect(result.mode).toBe("normal");
    expect(result.policy).toBe("balanced");
  });

  it("switches to degraded mode under elevated load", () => {
    const result = evaluateMode({ queueDepth: 180, contaminationRate: 0.1, confidenceDrift: 0.12 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("enters containment when contamination spikes", () => {
    const result = evaluateMode({ queueDepth: 30, contaminationRate: 0.33, confidenceDrift: 0.12 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });
});

describe("evaluateMode - mode boundaries", () => {
  it("enters containment when confidenceDrift exceeds 0.4", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.41 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });

  it("does NOT enter containment when contaminationRate is exactly 0.3 (boundary is >0.3)", () => {
    // 0.3 is not > 0.3, falls through to degraded check (0.3 > 0.15 is true)
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.3, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
  });

  it("does NOT enter containment when confidenceDrift is exactly 0.4 (boundary is >0.4)", () => {
    // 0.4 is not > 0.4, falls through to degraded check (0.4 > 0.2 is true)
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.4 });
    expect(result.mode).toBe("degraded");
  });

  it("enters degraded mode when contaminationRate just above 0.15", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.16, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
  });

  it("stays normal when contaminationRate is exactly 0.15 (boundary is >0.15)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.15, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
  });

  it("enters degraded mode when queueDepth exceeds 120", () => {
    const result = evaluateMode({ queueDepth: 121, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
  });

  it("stays normal when queueDepth is exactly 120 (boundary is >120)", () => {
    const result = evaluateMode({ queueDepth: 120, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
  });

  it("enters degraded mode when confidenceDrift just above 0.2", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.21 });
    expect(result.mode).toBe("degraded");
  });

  it("stays normal when confidenceDrift is exactly 0.2 (boundary is >0.2)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.2 });
    expect(result.mode).toBe("normal");
  });
});

describe("evaluateMode - policy selection", () => {
  it("selects balanced policy in normal mode with low queue", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.policy).toBe("balanced");
  });

  it("selects priority_first in degraded mode when queueDepth exceeds 100", () => {
    const result = evaluateMode({ queueDepth: 101, contaminationRate: 0.16, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("selects balanced in degraded mode when queueDepth is at or below 100", () => {
    const result = evaluateMode({ queueDepth: 100, contaminationRate: 0.16, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("balanced");
  });

  it("always selects risk_limited in containment regardless of queue depth", () => {
    const lowQueue = evaluateMode({ queueDepth: 5, contaminationRate: 0.35, confidenceDrift: 0.05 });
    const highQueue = evaluateMode({ queueDepth: 500, contaminationRate: 0.35, confidenceDrift: 0.05 });
    expect(lowQueue.policy).toBe("risk_limited");
    expect(highQueue.policy).toBe("risk_limited");
  });
});

describe("evaluateMode - reasons array", () => {
  it("includes nominal reason for normal mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("nominal operating envelope");
    expect(result.reasons).toHaveLength(1);
  });

  it("includes degraded reason for degraded mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.2, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("load or evidence quality degraded");
    expect(result.reasons).toHaveLength(1);
  });

  it("includes safety threshold reason for containment mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.35, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("safety threshold exceeded");
    expect(result.reasons).toHaveLength(1);
  });

  it("returns an EvaluationResult with all required fields", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result).toHaveProperty("mode");
    expect(result).toHaveProperty("policy");
    expect(result).toHaveProperty("reasons");
    expect(Array.isArray(result.reasons)).toBe(true);
  });
});