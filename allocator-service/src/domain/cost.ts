import type { Item, Node } from "./types";

/**
 * Determines whether an item may be placed on a node based on capacity, region, and required tags.
 *
 * @param item - Item to assign; its `region` and `requiredTags` are used for compatibility checks
 * @param node - Candidate node; its `capacity`, `used`, `region`, and `tags` determine assignability
 * @returns `true` if the node has available capacity, regions are compatible when both are specified, and the node contains every tag in `item.requiredTags`; `false` otherwise.
 */
export function canAssign(item: Item, node: Node): boolean {
  if (node.used >= node.capacity) return false;
  if (item.region && node.region && item.region !== node.region) return false;
  if (!item.requiredTags?.length) return true;
  const tags = new Set(node.tags ?? []);
  return item.requiredTags.every((t) => tags.has(t));
}

/**
 * Compute a placement cost score for assigning an item to a node.
 *
 * The score combines node utilization (or reported load), a large penalty for region mismatch,
 * a latency-sensitivity–weighted penalty, and a negative adjustment for item risk.
 *
 * @param item - The item being placed; relevant properties: `region`, `latencySensitivity`, and `risk`
 * @param node - The candidate node; relevant properties: `capacity`, `used`, `load`, and `region`
 * @returns A numeric cost where lower values indicate preferred placements; higher values indicate worse placements.
export function edgeCost(item: Item, node: Node): number {
  const initialUtilization = node.capacity === 0 ? 1 : node.used / node.capacity;

  const load = node.load ?? initialUtilization;
  const regionPenalty = item.region && node.region && item.region !== node.region ? 10_000 : 0;
  const latencyPenalty = Math.round((item.latencySensitivity ?? 0) * load * 100);
  const riskPriority = -Math.round(item.risk * 1000);

  return riskPriority + Math.round(load * 100) + latencyPenalty + regionPenalty;
}
