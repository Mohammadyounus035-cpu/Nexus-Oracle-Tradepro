import { describe, expect, test } from "vitest";
import { calculateWorldDrift } from "../../src/core/graph/worldDrift.js";

describe("calculateWorldDrift", () => {
  test("returns 0.0% SYNC for byte-identical payloads", () => {
    const payload = '{"a":1,"b":2}\n';
    const drift = calculateWorldDrift(payload, payload);

    expect(drift.percent).toBe(0);
    expect(drift.status).toBe("SYNC");
    expect(drift.uiHash).toBe(drift.artifactHash);
  });

  test("returns DRIFT with deterministic byte-diff percentage for mismatched payloads", () => {
    const drift = calculateWorldDrift('{"a":1}\n', '{"a":2}\n');

    expect(drift.status).toBe("DRIFT");
    expect(drift.percent).toBeGreaterThan(0);
    expect(drift.percent).toBeLessThanOrEqual(100);
    expect(drift.uiHash).not.toBe(drift.artifactHash);
  });
});
