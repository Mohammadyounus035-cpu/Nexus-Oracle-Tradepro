import { describe, expect, it } from "vitest";
import { runMirror } from "../src/core/mirror.js";
import type { CoherenceState } from "../src/core/types.js";

describe("runMirror", () => {
  it("seals a grounded stable clean state", () => {
    const state: CoherenceState = {
      id: "t2",
      phase: 0,
      coherence: 0.4,
      alignment: 0.5,
      shellIntegrity: 0.8,
      grounded: true,
      stable: true,
      temporalOffset: 0,
      symbolicLoad: 0.2,
      operatorIntent: 0.5,
      energy: { fast: 1, mid: 1, deep: 1 },
      faultFlags: []
    };

    const report = runMirror(state);
    expect(report.sealed).toBe(true);
  });
});
