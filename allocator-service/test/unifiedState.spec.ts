import { describe, expect, it, vi } from "vitest";
import {
  buildUnifiedState,
  safeRender,
  verifyUnifiedState,
  type FrontierCandidate,
} from "../src/matrix/unifiedState";

function buildFrontier(overrides?: Partial<FrontierCandidate>): FrontierCandidate[] {
  return Array.from({ length: 36 }, (_, index) => ({
    id: `c${index + 1}`,
    decision: index % 3 === 0 ? "model" : index % 3 === 1 ? "defer" : "reject",
    metrics: {
      safety: 0.9 - index * 0.01,
      cost: 0.1 + index * 0.005,
      latency: 100 + index,
    },
    ...overrides,
  }));
}

describe("unified visual integrity", () => {
  it("builds deterministic canonical + visual + binding hashes", () => {
    const frontier = buildFrontier();
    const a = buildUnifiedState(frontier);
    const b = buildUnifiedState([...frontier].reverse());

    expect(a.canonical).toEqual(b.canonical);
    expect(a.visual).toEqual(b.visual);
    expect(a.hashes).toEqual(b.hashes);
  });

  it("aborts dead states with no frontier candidates", () => {
    expect(() => buildUnifiedState([])).toThrow("Dead state: no valid decisions");
  });

  it("locks frontier cardinality at 36", () => {
    expect(() => buildUnifiedState(buildFrontier().slice(0, 10))).toThrow(
      "state drift: expected frontier cardinality 36",
    );
  });

  it("aborts verify when visual hash is tampered", () => {
    const unified = buildUnifiedState(buildFrontier());
    const tampered = {
      ...unified,
      hashes: { ...unified.hashes, visual: "bad-hash" },
    };

    expect(() => verifyUnifiedState(tampered)).toThrow("Render aborted: visual integrity failure");
  });

  it("aborts verify when cross-binding hash is tampered", () => {
    const unified = buildUnifiedState(buildFrontier());
    const tampered = {
      ...unified,
      hashes: { ...unified.hashes, binding: "bad-binding" },
    };

    expect(() => verifyUnifiedState(tampered)).toThrow(
      "Render aborted: cross-binding integrity failure",
    );
  });

  it("aborts when selected is not in frontier", () => {
    expect(() => buildUnifiedState(buildFrontier(), "unknown-id")).toThrow(
      "No selected decision — undefined visual state",
    );
  });

  it("normalizes floating metrics to prevent precision drift", () => {
    const input = buildFrontier();
    input[0] = {
      ...input[0],
      metrics: { safety: 0.1 + 0.2, cost: 0.11119, latency: 120.9876 },
    };

    const unified = buildUnifiedState(input);
    const normalized = unified.canonical.frontier.find((candidate) => candidate.id === "c1");

    expect(normalized?.metrics.safety).toBe(0.3);
    expect(normalized?.metrics.cost).toBe(0.111);
    expect(normalized?.metrics.latency).toBe(120.988);
  });

  it("rejects degenerate frontiers where all decisions are reject", () => {
    expect(() => buildUnifiedState(buildFrontier({ decision: "reject" }))).toThrow(
      "Degenerate system: no actionable paths",
    );
  });

  it("freezes unified state to prevent mutation after creation", () => {
    const unified = buildUnifiedState(buildFrontier());

    expect(Object.isFrozen(unified)).toBe(true);
    expect(Object.isFrozen(unified.canonical)).toBe(true);
    expect(Object.isFrozen(unified.visual)).toBe(true);
  });

  it("verifies before draw in safeRender", () => {
    const draw = vi.fn();
    const unified = buildUnifiedState(buildFrontier());
    const tampered = {
      ...unified,
      hashes: { ...unified.hashes, visual: "bad-hash" },
    };

    expect(() => safeRender(tampered, draw)).toThrow("Render aborted: visual integrity failure");
    expect(draw).not.toHaveBeenCalled();

    const visual = safeRender(unified, draw);
    expect(draw).toHaveBeenCalledOnce();
    expect(draw).toHaveBeenCalledWith(visual);
  });
});
