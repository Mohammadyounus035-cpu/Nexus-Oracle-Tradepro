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

  describe("mode thresholds", () => {
    it("enters containment when contaminationRate is exactly at 0.3 boundary (> 0.3)", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.301, confidenceDrift: 0.0 });
      expect(result.mode).toBe("containment");
      expect(result.policy).toBe("risk_limited");
    });

    it("enters degraded (not containment) when contaminationRate is exactly 0.3", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.3, confidenceDrift: 0.0 });
      expect(result.mode).toBe("degraded");
    });

    it("enters containment when confidenceDrift is above 0.4", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.0, confidenceDrift: 0.41 });
      expect(result.mode).toBe("containment");
      expect(result.policy).toBe("risk_limited");
    });

    it("enters degraded (not containment) when confidenceDrift is exactly 0.4", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.0, confidenceDrift: 0.4 });
      expect(result.mode).toBe("degraded");
    });

    it("enters degraded when contaminationRate exceeds 0.15 but not 0.3", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.2, confidenceDrift: 0.0 });
      expect(result.mode).toBe("degraded");
    });

    it("enters degraded when confidenceDrift exceeds 0.2 but not 0.4", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.0, confidenceDrift: 0.25 });
      expect(result.mode).toBe("degraded");
    });

    it("enters degraded when queueDepth exceeds 120 with nominal contamination", () => {
      const result = evaluateMode({ queueDepth: 121, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result.mode).toBe("degraded");
    });

    it("stays normal when queueDepth is exactly 120", () => {
      const result = evaluateMode({ queueDepth: 120, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result.mode).toBe("normal");
    });
  });

  describe("policy selection", () => {
    it("selects balanced policy for normal mode with low queue", () => {
      const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result.policy).toBe("balanced");
    });

    it("selects priority_first for degraded mode when queueDepth exceeds 100", () => {
      const result = evaluateMode({ queueDepth: 180, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result.mode).toBe("degraded");
      expect(result.policy).toBe("priority_first");
    });

    it("selects balanced for degraded mode when queueDepth is 100 or below", () => {
      // contaminationRate=0.2 triggers degraded; queueDepth=100 is not > 100
      const result = evaluateMode({ queueDepth: 100, contaminationRate: 0.2, confidenceDrift: 0.0 });
      expect(result.mode).toBe("degraded");
      expect(result.policy).toBe("balanced");
    });

    it("always selects risk_limited in containment mode regardless of queue depth", () => {
      const highQueueResult = evaluateMode({ queueDepth: 500, contaminationRate: 0.35, confidenceDrift: 0.0 });
      expect(highQueueResult.mode).toBe("containment");
      expect(highQueueResult.policy).toBe("risk_limited");
    });
  });

  describe("reasons", () => {
    it("includes 'nominal operating envelope' reason in normal mode", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.01, confidenceDrift: 0.01 });
      expect(result.reasons).toContain("nominal operating envelope");
    });

    it("includes 'load or evidence quality degraded' reason in degraded mode", () => {
      const result = evaluateMode({ queueDepth: 200, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result.reasons).toContain("load or evidence quality degraded");
    });

    it("includes 'safety threshold exceeded' reason in containment mode", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.5, confidenceDrift: 0.0 });
      expect(result.reasons).toContain("safety threshold exceeded");
    });

    it("always returns a non-empty reasons array", () => {
      const normal = evaluateMode({ queueDepth: 10, contaminationRate: 0.0, confidenceDrift: 0.0 });
      const degraded = evaluateMode({ queueDepth: 200, contaminationRate: 0.0, confidenceDrift: 0.0 });
      const containment = evaluateMode({ queueDepth: 10, contaminationRate: 0.5, confidenceDrift: 0.0 });
      expect(normal.reasons.length).toBeGreaterThan(0);
      expect(degraded.reasons.length).toBeGreaterThan(0);
      expect(containment.reasons.length).toBeGreaterThan(0);
    });
  });
});