import type { AllocateRequest, Item, Node } from "./types";

/**
 * Produce a lexicographically sorted copy of a tag list, or preserve absence when no tags are provided.
 *
 * @param tags - Optional array of tag strings; when provided the input array is not mutated.
 * @returns A new array with the tags sorted lexicographically, or `undefined` if `tags` is `undefined`.
 */
function sortTags(tags?: string[]): string[] | undefined {
  return tags ? [...tags].sort() : undefined;
}

/**
 * Normalize an allocation request by producing cloned, consistently ordered items and nodes and ensuring a default timeout.
 *
 * @param input - The original AllocateRequest to normalize
 * @returns An AllocateRequest where:
 *   - each item and node is a shallow clone;
 *   - each item's `requiredTags` and each node's `tags` are sorted lexicographically (or preserved as `undefined` when absent);
 *   - the `items` and `nodes` arrays are sorted by `id` using locale-aware comparison;
 *   - `timeoutMs` is `input.timeoutMs` if provided, otherwise `2000`.
 */
export function normalizeRequest(input: AllocateRequest): AllocateRequest {
  const items: Item[] = [...input.items]
    .map((i) => ({ ...i, requiredTags: sortTags(i.requiredTags) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const nodes: Node[] = [...input.nodes]
    .map((n) => ({ ...n, tags: sortTags(n.tags) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    items,
    nodes,
    timeoutMs: input.timeoutMs ?? 2000,
  };
}
