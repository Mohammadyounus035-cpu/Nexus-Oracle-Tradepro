import { describe, expect, it } from "vitest";
import { constrainedBatchAssign } from "../packages/assignment-engine/src/index.js";
import type { NodeCapacity, WorkItem } from "../packages/shared-types/src/index.js";

describe("assignment engine", () => {
  it("prioritizes constrained high-risk items in risk_limited mode", () => {
    const items: WorkItem[] = [
      { id: "low-1", risk: 2, priority: 1, confidence: 0.9 },
      { id: "high-1", risk: 8, priority: 1, confidence: 0.2 },
      { id: "high-2", risk: 8, priority: 1, confidence: 0.1 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "restricted-a", capacity: 1, maxRisk: 8 },
      { nodeId: "restricted-b", capacity: 1, maxRisk: 8 },
      { nodeId: "permissive", capacity: 1, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");

    expect(assignments).toHaveLength(3);
    expect(assignments).toEqual([
      { itemId: "high-1", nodeId: "restricted-a" },
      { itemId: "high-2", nodeId: "restricted-b" },
      { itemId: "low-1", nodeId: "permissive" }
    ]);
  });

  it("produces identical output regardless of item and node order", () => {
    const inputA = {
      items: [
        { id: "i2", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i1", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i3", risk: 0.5, priority: 1, confidence: 0.5 }
      ] satisfies WorkItem[],
      nodes: [
        { nodeId: "n2", capacity: 1, maxRisk: 7 },
        { nodeId: "n3", capacity: 1, maxRisk: 9 },
        { nodeId: "n1", capacity: 1, maxRisk: 7 }
      ] satisfies NodeCapacity[]
    };

    const inputB = {
      items: [
        { id: "i3", risk: 0.5, priority: 1, confidence: 0.5 },
        { id: "i1", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i2", risk: 7, priority: 3, confidence: 0.2 }
      ] satisfies WorkItem[],
      nodes: [
        { nodeId: "n1", capacity: 1, maxRisk: 7 },
        { nodeId: "n2", capacity: 1, maxRisk: 7 },
        { nodeId: "n3", capacity: 1, maxRisk: 9 }
      ] satisfies NodeCapacity[]
    };

    const a = constrainedBatchAssign(inputA.items, inputA.nodes, "risk_limited");
    const b = constrainedBatchAssign(inputB.items, inputB.nodes, "risk_limited");

    expect(a).toEqual(b);
  });

  it("is deterministic when scored values tie", () => {
    const items: WorkItem[] = [
      { id: "b-item", risk: 3, priority: 2, confidence: 0.6 },
      { id: "a-item", risk: 3, priority: 2, confidence: 0.6 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "node-b", capacity: 1, maxRisk: 9 },
      { nodeId: "node-a", capacity: 1, maxRisk: 9 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");

    expect(assignments).toEqual([
      { itemId: "a-item", nodeId: "node-a" },
      { itemId: "b-item", nodeId: "node-b" }
    ]);
  });

  describe("edge cases", () => {
    it("returns empty array when items list is empty", () => {
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
      const result = constrainedBatchAssign([], nodes, "balanced");
      expect(result).toEqual([]);
    });

    it("returns empty array when nodes list is empty", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 2, priority: 1, confidence: 0.5 }];
      const result = constrainedBatchAssign(items, [], "balanced");
      expect(result).toEqual([]);
    });

    it("leaves item unassigned when its risk exceeds all node maxRisk values", () => {
      const items: WorkItem[] = [{ id: "too-risky", risk: 9, priority: 5, confidence: 0.9 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "safe-node", capacity: 2, maxRisk: 5 }
      ];
      const result = constrainedBatchAssign(items, nodes, "balanced");
      expect(result).toHaveLength(0);
    });

    it("leaves items unassigned when all nodes are at capacity", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
      const result = constrainedBatchAssign(items, nodes, "balanced");
      // Only one item can be assigned
      expect(result).toHaveLength(1);
    });

    it("does not mutate the original items or nodes arrays", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 2, priority: 3, confidence: 0.8 }
      ];
      const nodes: NodeCapacity[] = [
        { nodeId: "n1", capacity: 2, maxRisk: 5 }
      ];
      const originalItems = JSON.parse(JSON.stringify(items)) as WorkItem[];
      const originalNodes = JSON.parse(JSON.stringify(nodes)) as NodeCapacity[];

      constrainedBatchAssign(items, nodes, "balanced");

      expect(items).toEqual(originalItems);
      expect(nodes).toEqual(originalNodes);
    });
  });

  describe("balanced policy", () => {
    it("ranks items by priority + confidence - risk", () => {
      // item-a: score = 5 + 0.9 - 1 = 4.9
      // item-b: score = 3 + 0.5 - 0.5 = 3.0
      // item-a should be assigned first (higher score = first pick)
      const items: WorkItem[] = [
        { id: "item-b", risk: 0.5, priority: 3, confidence: 0.5 },
        { id: "item-a", risk: 1, priority: 5, confidence: 0.9 }
      ];
      const nodes: NodeCapacity[] = [
        { nodeId: "only-node", capacity: 1, maxRisk: 10 }
      ];
      const result = constrainedBatchAssign(items, nodes, "balanced");
      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe("item-a");
    });

    it("assigns items to least-utilized nodes first", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
      ];
      // node-a has more remaining capacity relative to used (lower utilization starts at 0)
      const nodes: NodeCapacity[] = [
        { nodeId: "node-a", capacity: 3, maxRisk: 10 },
        { nodeId: "node-b", capacity: 3, maxRisk: 10 }
      ];
      const result = constrainedBatchAssign(items, nodes, "balanced");
      expect(result).toHaveLength(2);
      // Both should be assigned (to different nodes when possible due to utilization balancing)
      const assignedNodes = result.map((a) => a.nodeId);
      expect(new Set(assignedNodes).size).toBe(2);
    });
  });

  describe("priority_first policy", () => {
    it("ranks items by priority * 2 - risk", () => {
      // item-a: score = 10*2 - 9 = 11
      // item-b: score = 5*2 - 1 = 9
      // item-a should be assigned first (higher score)
      const items: WorkItem[] = [
        { id: "item-b", risk: 1, priority: 5, confidence: 0.5 },
        { id: "item-a", risk: 9, priority: 10, confidence: 0.1 }
      ];
      const nodes: NodeCapacity[] = [
        { nodeId: "only-node", capacity: 1, maxRisk: 10 }
      ];
      const result = constrainedBatchAssign(items, nodes, "priority_first");
      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe("item-a");
    });

    it("ignores confidence in priority_first scoring", () => {
      // item-high-conf: score = 3*2 - 2 = 4 (priority_first ignores confidence)
      // item-low-conf: score = 4*2 - 3 = 5 (higher priority dominates)
      const items: WorkItem[] = [
        { id: "item-high-conf", risk: 2, priority: 3, confidence: 0.99 },
        { id: "item-low-conf", risk: 3, priority: 4, confidence: 0.01 }
      ];
      const nodes: NodeCapacity[] = [
        { nodeId: "only-node", capacity: 1, maxRisk: 10 }
      ];
      const result = constrainedBatchAssign(items, nodes, "priority_first");
      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe("item-low-conf");
    });
  });

  describe("risk_limited policy node selection", () => {
    it("prefers lower maxRisk nodes when risk_limited (tight-fitting policy)", () => {
      // item risk=5 can go to maxRisk=5 or maxRisk=9; risk_limited prefers lower maxRisk first
      const items: WorkItem[] = [{ id: "i1", risk: 5, priority: 1, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "permissive", capacity: 2, maxRisk: 9 },
        { nodeId: "tight", capacity: 2, maxRisk: 5 }
      ];
      const result = constrainedBatchAssign(items, nodes, "risk_limited");
      expect(result).toHaveLength(1);
      expect(result[0].nodeId).toBe("tight");
    });

    it("skips nodes whose maxRisk is below item risk", () => {
      const items: WorkItem[] = [{ id: "risky", risk: 7, priority: 1, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "too-safe", capacity: 2, maxRisk: 5 },
        { nodeId: "acceptable", capacity: 2, maxRisk: 8 }
      ];
      const result = constrainedBatchAssign(items, nodes, "risk_limited");
      expect(result).toHaveLength(1);
      expect(result[0].nodeId).toBe("acceptable");
    });
  });
});