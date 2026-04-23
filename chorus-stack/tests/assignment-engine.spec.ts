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
});

describe("constrainedBatchAssign — balanced policy", () => {
  it("returns empty array for empty items list", () => {
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    const result = constrainedBatchAssign([], nodes, "balanced");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty nodes list", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 2, confidence: 0.8 }];
    const result = constrainedBatchAssign(items, [], "balanced");
    expect(result).toEqual([]);
  });

  it("assigns item to the node with lower utilization", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 2, confidence: 0.8 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "busy", capacity: 4, maxRisk: 10 },
      { nodeId: "empty", capacity: 4, maxRisk: 10 }
    ];
    // Both start at used=0 so utilization is equal; tie-breaks by nodeId alphabetically
    const result = constrainedBatchAssign(items, nodes, "balanced");
    expect(result).toHaveLength(1);
    // "busy" < "empty" alphabetically
    expect(result[0].nodeId).toBe("busy");
  });

  it("prefers higher priority + confidence items in balanced mode", () => {
    const items: WorkItem[] = [
      { id: "low-priority", risk: 1, priority: 1, confidence: 0.5 },
      { id: "high-priority", risk: 1, priority: 5, confidence: 0.9 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "only-node", capacity: 1, maxRisk: 10 }];

    const result = constrainedBatchAssign(items, nodes, "balanced");

    // Only 1 slot; high-priority item should be assigned
    expect(result).toHaveLength(1);
    expect(result[0].itemId).toBe("high-priority");
  });

  it("skips items whose risk exceeds all node maxRisk values", () => {
    const items: WorkItem[] = [
      { id: "risky", risk: 9, priority: 5, confidence: 0.9 },
      { id: "safe", risk: 1, priority: 3, confidence: 0.7 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];

    const result = constrainedBatchAssign(items, nodes, "balanced");
    expect(result).toHaveLength(1);
    expect(result[0].itemId).toBe("safe");
  });

  it("respects node capacity — does not exceed it", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 2, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 2, confidence: 0.5 },
      { id: "i3", risk: 1, priority: 2, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];

    const result = constrainedBatchAssign(items, nodes, "balanced");
    // Node capacity is 2, so only 2 items assigned
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.nodeId === "n1")).toBe(true);
  });

  it("spreads items across multiple nodes when available", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 2, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 2, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 10 },
      { nodeId: "n2", capacity: 1, maxRisk: 10 }
    ];

    const result = constrainedBatchAssign(items, nodes, "balanced");
    expect(result).toHaveLength(2);
    const nodeIds = result.map((a) => a.nodeId);
    expect(nodeIds).toContain("n1");
    expect(nodeIds).toContain("n2");
  });
});

describe("constrainedBatchAssign — priority_first policy", () => {
  it("assigns highest priority item first regardless of confidence", () => {
    const items: WorkItem[] = [
      { id: "low-conf-high-pri", risk: 1, priority: 10, confidence: 0.1 },
      { id: "high-conf-low-pri", risk: 1, priority: 1, confidence: 0.9 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];

    // priority_first score = priority*2 - risk; higher priority wins
    const result = constrainedBatchAssign(items, nodes, "priority_first");
    expect(result).toHaveLength(1);
    expect(result[0].itemId).toBe("low-conf-high-pri");
  });

  it("returns all items assigned when capacity allows under priority_first", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 2, priority: 5, confidence: 0.8 },
      { id: "i2", risk: 3, priority: 3, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];

    const result = constrainedBatchAssign(items, nodes, "priority_first");
    expect(result).toHaveLength(2);
  });
});

describe("constrainedBatchAssign — risk_limited policy", () => {
  it("excludes item from node whose maxRisk is below item risk", () => {
    const items: WorkItem[] = [{ id: "risky", risk: 9, priority: 5, confidence: 0.9 }];
    const nodes: NodeCapacity[] = [{ nodeId: "low-risk-node", capacity: 1, maxRisk: 5 }];

    const result = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(result).toHaveLength(0);
  });

  it("assigns to node whose maxRisk >= item risk", () => {
    const items: WorkItem[] = [{ id: "risky", risk: 7, priority: 5, confidence: 0.9 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "low-cap", capacity: 1, maxRisk: 5 },
      { nodeId: "high-cap", capacity: 1, maxRisk: 8 }
    ];

    const result = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("high-cap");
  });

  it("prefers node with lowest maxRisk that still qualifies", () => {
    // In risk_limited mode, candidate sort puts lower maxRisk first
    const items: WorkItem[] = [{ id: "i1", risk: 3, priority: 5, confidence: 0.9 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "permissive", capacity: 1, maxRisk: 10 },
      { nodeId: "tight", capacity: 1, maxRisk: 4 }
    ];

    const result = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("tight");
  });

  it("handles item risk exactly equal to node maxRisk (boundary)", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 5, priority: 3, confidence: 0.7 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];

    // risk <= maxRisk is the condition (5 <= 5 is true)
    const result = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(result).toHaveLength(1);
    expect(result[0].itemId).toBe("i1");
  });

  it("leaves all items unassigned when no node can handle any risk", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 8, priority: 5, confidence: 0.9 },
      { id: "i2", risk: 6, priority: 3, confidence: 0.7 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 2 }];

    const result = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(result).toHaveLength(0);
  });

  it("does not mutate the original nodes array", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 3, confidence: 0.7 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    const nodesBefore = JSON.parse(JSON.stringify(nodes)) as NodeCapacity[];

    constrainedBatchAssign(items, nodes, "risk_limited");

    expect(nodes).toEqual(nodesBefore);
  });
});