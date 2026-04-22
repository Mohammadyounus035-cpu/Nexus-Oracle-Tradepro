import { describe, expect, it } from "vitest";
import { canAssign, edgeCost, finiteEdgeCost } from "../packages/assignment-engine/src/domain/cost.js";
import type { Item, Node } from "../packages/assignment-engine/src/domain/types.js";

describe("assignment domain cost", () => {
  it("keeps region mismatch out of canAssign so mismatch remains a penalized fallback", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "us" };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(canAssign(item, sameRegionNode)).toBe(true);
    expect(canAssign(item, otherRegionNode)).toBe(true);

    expect(edgeCost(item, sameRegionNode)).toBeLessThan(edgeCost(item, otherRegionNode));
  });

  it("still allows cross-region assignment when same-region capacity is unavailable", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNodeUnavailable: Node = {
      id: "n2",
      capacity: 1,
      used: 1,
      region: "us"
    };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(canAssign(item, sameRegionNodeUnavailable)).toBe(false);
    expect(canAssign(item, otherRegionNode)).toBe(true);
    expect(Number.isFinite(edgeCost(item, otherRegionNode))).toBe(true);
  });
});

describe("canAssign", () => {
  it("returns false when node is at capacity (used === capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 2 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node is over capacity (used > capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 3 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when node has remaining capacity and item has no requiredTags", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 1 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when item has empty requiredTags array", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when all requiredTags are present in node.tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu", "secure", "extra"] };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns false when only some requiredTags match", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu"] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node has no tags but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node has empty tags array but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: [] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when item has no requiredTags regardless of node tags", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["restricted"] };
    expect(canAssign(item, node)).toBe(true);
  });
});

describe("edgeCost", () => {
  it("returns Infinity when node is at capacity", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity when required tags are not met", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["public"] };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("computes riskPriority as negative of rounded risk*1000", () => {
    const item: Item = { id: "i1", risk: 0.9 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    // riskPriority = -Math.round(0.9 * 1000) = -900
    // loadPenalty = Math.round(0/1 * 100) = 0
    // latencyPenalty = 0 (no latencySensitivity)
    // regionPenalty = 0 (no regions)
    expect(edgeCost(item, node)).toBe(-900);
  });

  it("higher risk produces lower (more negative) cost making it preferred", () => {
    const highRisk: Item = { id: "i1", risk: 0.9 };
    const lowRisk: Item = { id: "i2", risk: 0.1 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(edgeCost(highRisk, node)).toBeLessThan(edgeCost(lowRisk, node));
  });

  it("adds load penalty based on node utilization", () => {
    const item: Item = { id: "i1", risk: 0.0 };
    const emptyNode: Node = { id: "n1", capacity: 4, used: 0 };
    const halfFullNode: Node = { id: "n2", capacity: 4, used: 2 };
    // emptyNode: loadPenalty = 0, cost = 0
    // halfFullNode: loadPenalty = Math.round(0.5 * 100) = 50, cost = 50
    expect(edgeCost(item, emptyNode)).toBe(0);
    expect(edgeCost(item, halfFullNode)).toBe(50);
  });

  it("adds latency penalty scaled by load and latencySensitivity", () => {
    const item: Item = { id: "i1", risk: 0.0, latencySensitivity: 1.0 };
    const halfFullNode: Node = { id: "n1", capacity: 4, used: 2 };
    // riskPriority = 0, loadPenalty = 50, latencyPenalty = Math.round(1.0 * 0.5 * 100) = 50
    expect(edgeCost(item, halfFullNode)).toBe(100);
  });

  it("adds 10000 region penalty for mismatched regions", () => {
    const item: Item = { id: "i1", risk: 0.0, region: "us" };
    const sameRegion: Node = { id: "n1", capacity: 1, used: 0, region: "us" };
    const diffRegion: Node = { id: "n2", capacity: 1, used: 0, region: "eu" };
    expect(edgeCost(item, diffRegion) - edgeCost(item, sameRegion)).toBe(10_000);
  });

  it("does not add region penalty when only item has region set", () => {
    const item: Item = { id: "i1", risk: 0.0, region: "us" };
    const nodeNoRegion: Node = { id: "n1", capacity: 1, used: 0 };
    expect(edgeCost(item, nodeNoRegion)).toBe(0);
  });

  it("does not add region penalty when only node has region set", () => {
    const item: Item = { id: "i1", risk: 0.0 };
    const nodeWithRegion: Node = { id: "n1", capacity: 1, used: 0, region: "us" };
    expect(edgeCost(item, nodeWithRegion)).toBe(0);
  });

  it("treats zero-capacity node as fully loaded (load=1)", () => {
    const item: Item = { id: "i1", risk: 0.0 };
    // zero capacity but used=0 still can't assign (used >= capacity: 0 >= 0 is true)
    const zeroCapNode: Node = { id: "n1", capacity: 0, used: 0 };
    expect(edgeCost(item, zeroCapNode)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("finiteEdgeCost", () => {
  it("returns null for an ineligible node (at capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns null for an ineligible node (missing required tags)", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: [] };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns a finite number for an eligible node", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    const result = finiteEdgeCost(item, node);
    expect(result).not.toBeNull();
    expect(Number.isFinite(result as number)).toBe(true);
  });

  it("returns the same value as edgeCost for eligible nodes", () => {
    const item: Item = { id: "i1", risk: 0.8, latencySensitivity: 0.5, region: "eu" };
    const node: Node = { id: "n1", capacity: 4, used: 2, region: "eu" };
    expect(finiteEdgeCost(item, node)).toBe(edgeCost(item, node));
  });

  it("returns 0 or negative cost for high-risk item on empty node", () => {
    const item: Item = { id: "i1", risk: 1.0 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    const result = finiteEdgeCost(item, node);
    // riskPriority = -1000, loadPenalty = 0
    expect(result).toBe(-1000);
  });
});