import type { Assignment, AssignmentPolicy, NodeCapacity, WorkItem } from "../../shared-types/src/index.js";

function score(item: WorkItem, policy: AssignmentPolicy): number {
  if (policy === "priority_first") {
    return item.priority * 2 - item.risk;
  }
  if (policy === "risk_limited") {
    return item.confidence - item.risk;
  }
  return item.priority + item.confidence - item.risk;
}

export function constrainedBatchAssign(
  items: WorkItem[],
  nodes: NodeCapacity[],
  policy: AssignmentPolicy
): Assignment[] {
  const sortedItems = [...items].sort((a, b) => score(b, policy) - score(a, policy));
  const nodeState = nodes.map((n) => ({ ...n, used: 0 }));
  const assignments: Assignment[] = [];

  for (const item of sortedItems) {
    const candidate = nodeState
      .filter((node) => node.used < node.capacity && item.risk <= node.maxRisk)
      .sort((a, b) => (a.used / a.capacity) - (b.used / b.capacity))[0];

    if (!candidate) {
      continue;
    }

    candidate.used += 1;
    assignments.push({ itemId: item.id, nodeId: candidate.nodeId });
  }

  return assignments;
}
