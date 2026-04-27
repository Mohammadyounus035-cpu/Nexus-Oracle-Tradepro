import { describe, expect, it } from "vitest";
import { enforceInvariants } from "../src/core/invariants.js";
import type { CoherenceState } from "../src/core/types.js";

describe("enforceInvariants", () => {
  it("clamps coherence to alignment", () => {
    const state: CoherenceState = {
      id: "t1",
      phase: 0,
      coherence: 0.9,
      alignment: 0.5,
      shellIntegrity: 0.8,
      grounded: true,
      stable: true,
      temporalOffset: 0,
      symbolicLoad: 0.2,
      operatorIntent: 0.1,
      energy: { fast: 1, mid: 1, deep: 1 },
      faultFlags: []
    };

    const next = enforceInvariants(state);
    expect(next.coherence).toBe(0.5);
  });
});
