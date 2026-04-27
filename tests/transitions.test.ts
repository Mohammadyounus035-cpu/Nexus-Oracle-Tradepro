import { describe, expect, it } from "vitest";
import { applyInstruction } from "../src/core/transitions.js";
import type { CoherenceState } from "../src/core/types.js";

describe("applyInstruction", () => {
  it("does not advance an ungrounded unstable state", () => {
    const state: CoherenceState = {
      id: "t3",
      phase: 1,
      coherence: 0.2,
      alignment: 0.5,
      shellIntegrity: 0.6,
      grounded: false,
      stable: false,
      temporalOffset: 0,
      symbolicLoad: 0.1,
      operatorIntent: 0.2,
      energy: { fast: 1, mid: 1, deep: 1 },
      faultFlags: []
    };

    const next = applyInstruction(state, "ADVANCE");
    expect(next.phase).toBe(1);
  });
});
