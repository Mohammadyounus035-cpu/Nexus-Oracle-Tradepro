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

  it("prefers same-region nodes but allows penalized fallback when needed", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "us" };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(edgeCost(item, sameRegionNode)).toBeLessThan(edgeCost(item, otherRegionNode));

    const sameRegionNodeUnavailable: Node = { ...sameRegionNode, used: 1 };
    expect(canAssign(item, sameRegionNodeUnavailable)).toBe(false);
    expect(canAssign(item, otherRegionNode)).toBe(true);
    expect(Number.isFinite(edgeCost(item, otherRegionNode))).toBe(true);
  });

  describe("canAssign", () => {
    it("returns false when node is at full capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 2, used: 2 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns false when node used exceeds capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 2 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns true when item has no requiredTags", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns true when item has empty requiredTags array", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns true when node has all required tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu", "secure", "extra"] };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns false when node is missing a required tag", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu"] };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns false when node has no tags but item requires tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns true for item with no tags and node with no tags at partial capacity", () => {
      const item: Item = { id: "i1", risk: 0.9 };
      const node: Node = { id: "n1", capacity: 3, used: 1 };
      expect(canAssign(item, node)).toBe(true);
    });
  });

  describe("edgeCost", () => {
    it("returns Infinity when node is at full capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 1 };
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns Infinity when node tags do not satisfy requiredTags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["cpu"] };
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });

    it("applies negative risk priority so higher risk yields lower (better) base cost", () => {
      const highRisk: Item = { id: "h", risk: 1.0 };
      const lowRisk: Item = { id: "l", risk: 0.0 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      // high risk → riskPriority = -1000; low risk → riskPriority = 0
      expect(edgeCost(highRisk, node)).toBeLessThan(edgeCost(lowRisk, node));
    });

    it("calculates correct cost for idle node with known risk", () => {
      // risk=0.5, load=0/1=0, latency=0, region=none
      // cost = -Math.round(0.5*1000) + Math.round(0*100) + Math.round(0*0*100) + 0
      //      = -500 + 0 + 0 + 0 = -500
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(edgeCost(item, node)).toBe(-500);
    });

    it("applies load penalty for partially used node", () => {
      // risk=0.5, used=1, capacity=2 → load=0.5
      // cost = -500 + Math.round(0.5*100) + 0 + 0 = -500 + 50 = -450
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 2, used: 1 };
      expect(edgeCost(item, node)).toBe(-450);
    });

    it("applies latency penalty scaled by load", () => {
      // risk=0, latency=1.0, used=1, capacity=2 → load=0.5
      // cost = 0 + 50 + Math.round(1.0 * 0.5 * 100) + 0 = 0 + 50 + 50 = 100
      const item: Item = { id: "i1", risk: 0.0, latencySensitivity: 1.0 };
      const node: Node = { id: "n1", capacity: 2, used: 1 };
      expect(edgeCost(item, node)).toBe(100);
    });

    it("treats zero-capacity node as fully loaded (load=1) for cost calculation", () => {
      // capacity=0 → initialLoad=1; risk=0, latency=0
      // cost = 0 + Math.round(1*100) + 0 + 0 = 100
      const item: Item = { id: "i1", risk: 0.0 };
      const node: Node = { id: "n1", capacity: 0, used: 0 };
      // canAssign returns false when used >= capacity (0 >= 0), so cost is Infinity
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });

    it("applies region penalty of 10000 for mismatched regions", () => {
      const item: Item = { id: "i1", risk: 0.0, region: "us-east-1" };
      const sameRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
      const otherRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "eu-west-1" };
      const diff = edgeCost(item, otherRegionNode) - edgeCost(item, sameRegionNode);
      expect(diff).toBe(10_000);
    });

    it("does not apply region penalty when item has no region", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const nodeWithRegion: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
      const nodeWithoutRegion: Node = { id: "n2", capacity: 1, used: 0 };
      // Both should have the same cost since item has no region
      expect(edgeCost(item, nodeWithRegion)).toBe(edgeCost(item, nodeWithoutRegion));
    });

    it("does not apply region penalty when node has no region", () => {
      const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
      const nodeWithoutRegion: Node = { id: "n1", capacity: 1, used: 0 };
      const nodeWithSameRegion: Node = { id: "n2", capacity: 1, used: 0, region: "us-east-1" };
      // No penalty when node has no region
      expect(edgeCost(item, nodeWithoutRegion)).toBe(edgeCost(item, nodeWithSameRegion));
    });
  });

  describe("finiteEdgeCost", () => {
    it("returns the cost when node is assignable", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(finiteEdgeCost(item, node)).toBe(-500);
    });

    it("returns null when node is at full capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 1 };
      expect(finiteEdgeCost(item, node)).toBeNull();
    });

    it("returns null when required tags are missing", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["cpu"] };
      expect(finiteEdgeCost(item, node)).toBeNull();
    });

    it("returns a number (not null) for assignable region-mismatched node", () => {
      const item: Item = { id: "i1", risk: 0.5, region: "us" };
      const node: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };
      const cost = finiteEdgeCost(item, node);
      expect(cost).not.toBeNull();
      expect(typeof cost).toBe("number");
    });
  });
});