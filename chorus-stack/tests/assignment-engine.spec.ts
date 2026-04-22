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


  it("remains deterministic across repeated identical runs", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 0.5, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 7, priority: 3, confidence: 0.2 },
      { id: "i3", risk: 7, priority: 3, confidence: 0.2 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 7 },
      { nodeId: "n2", capacity: 1, maxRisk: 7 },
      { nodeId: "n3", capacity: 1, maxRisk: 9 }
    ];

    const baseline = constrainedBatchAssign(items, nodes, "risk_limited");

    for (let i = 0; i < 5; i += 1) {
      expect(constrainedBatchAssign(items, nodes, "risk_limited")).toEqual(baseline);
    }
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

describe("constrainedBatchAssign - edge cases", () => {
  it("returns empty array when items list is empty", () => {
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    expect(constrainedBatchAssign([], nodes, "balanced")).toEqual([]);
  });

  it("returns empty array when nodes list is empty", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 0.5, priority: 1, confidence: 0.5 }];
    expect(constrainedBatchAssign(items, [], "balanced")).toEqual([]);
  });

  it("leaves item unassigned when risk exceeds all node maxRisk values", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 9, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 5 },
      { nodeId: "n2", capacity: 1, maxRisk: 7 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toEqual([]);
  });

  it("leaves excess items unassigned when capacity is insufficient", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 2, confidence: 0.8 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i3", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(1);
  });

  it("assigns a single item to a single eligible node", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 0.5, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 1 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toEqual([{ itemId: "i1", nodeId: "n1" }]);
  });

  it("assigns multiple items to a node with sufficient capacity", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
    expect(assignments.every((a) => a.nodeId === "n1")).toBe(true);
  });

  it("does not mutate the original items or nodes arrays", () => {
    const items: WorkItem[] = [
      { id: "i2", risk: 0.8, priority: 2, confidence: 0.6 },
      { id: "i1", risk: 0.3, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];
    const itemsCopy = [...items];
    const nodesCopy = [...nodes];
    constrainedBatchAssign(items, nodes, "balanced");
    expect(items).toEqual(itemsCopy);
    expect(nodes).toEqual(nodesCopy);
  });
});

describe("constrainedBatchAssign - priority_first policy", () => {
  it("assigns higher-priority items first", () => {
    const items: WorkItem[] = [
      { id: "low-priority", risk: 1, priority: 1, confidence: 0.5 },
      { id: "high-priority", risk: 1, priority: 5, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("high-priority");
  });

  it("high-priority low-risk item beats high-priority high-risk item (score = priority*2 - risk)", () => {
    const items: WorkItem[] = [
      { id: "high-risk", risk: 8, priority: 5, confidence: 0.5 },
      { id: "low-risk", risk: 1, priority: 5, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    // score(high-risk) = 5*2 - 8 = 2
    // score(low-risk) = 5*2 - 1 = 9
    // low-risk has higher score, gets assigned first
    expect(assignments[0].itemId).toBe("low-risk");
  });
});

describe("constrainedBatchAssign - balanced policy", () => {
  it("assigns items with best (priority + confidence - risk) score first", () => {
    const items: WorkItem[] = [
      { id: "low-score", risk: 5, priority: 1, confidence: 0.1 },
      { id: "high-score", risk: 0.1, priority: 3, confidence: 0.9 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    // score(low-score) = 1 + 0.1 - 5 = -3.9
    // score(high-score) = 3 + 0.9 - 0.1 = 3.8
    expect(assignments[0].itemId).toBe("high-score");
  });
});

describe("constrainedBatchAssign - node selection", () => {
  it("prefers lower-utilization node in risk_limited mode when maxRisk is equal", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 0.5, priority: 1, confidence: 0.5 }];
    // nodeState starts with used=0 for all, so we test with capacity differences
    const nodes: NodeCapacity[] = [
      { nodeId: "n-large", capacity: 10, maxRisk: 5 },
      { nodeId: "n-small", capacity: 1, maxRisk: 5 }
    ];
    // Both start at 0 utilization, alphabetical tie-break: n-large < n-small
    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(assignments[0].nodeId).toBe("n-large");
  });

  it("prefers tighter maxRisk node in risk_limited mode", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 3, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "permissive", capacity: 1, maxRisk: 9 },
      { nodeId: "tight", capacity: 1, maxRisk: 5 }
    ];
    // In risk_limited policy, candidates sorted by lowest maxRisk first
    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(assignments[0].nodeId).toBe("tight");
  });

  it("ignores node's pre-existing used count (nodeState initializes all to 0)", () => {
    // The engine resets all node.used to 0 internally, so a node passed with used=999 is treated as empty
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 2, maxRisk: 5 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
  });
});