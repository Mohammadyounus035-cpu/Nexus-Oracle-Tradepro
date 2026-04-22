import { canAssign, edgeCost } from "../../../../packages/assignment-engine/src/domain/cost.js";
import type { Item, Node } from "../../../../packages/assignment-engine/src/domain/types.js";

export const runtime = "edge";

const encoder = new TextEncoder();

function sseFrame(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function parsePayload(url: URL): { items: Item[]; nodes: Node[] } {
  const itemsParam = url.searchParams.get("items");
  const nodesParam = url.searchParams.get("nodes");

  if (!itemsParam || !nodesParam) {
    return {
      items: [
        { id: "w-1", risk: 0.9, latencySensitivity: 0.8, region: "us-east-1" },
        { id: "w-2", risk: 0.6, latencySensitivity: 0.4, region: "us-east-1" },
        { id: "w-3", risk: 0.3, latencySensitivity: 0.2, region: "us-west-2" }
      ],
      nodes: [
        { id: "n-a", capacity: 2, used: 0, tags: ["gpu"], region: "us-east-1" },
        { id: "n-b", capacity: 2, used: 0, tags: ["cpu"], region: "us-west-2" }
      ]
    };
  }

  return {
    items: JSON.parse(itemsParam) as Item[],
    nodes: JSON.parse(nodesParam) as Node[]
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { items, nodes } = parsePayload(url);

  const nodeState = nodes.map((node) => ({ ...node }));
  const startedAt = Date.now();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "local-dev";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        sseFrame("start", {
          commit,
          startedAt,
          itemCount: items.length,
          nodeCount: nodes.length
        })
      );

      for (const [index, item] of items.entries()) {
        const candidates = nodeState
          .filter((node) => canAssign(item, node))
          .map((node) => ({ node, cost: edgeCost(item, node) }))
          .filter((entry) => Number.isFinite(entry.cost))
          .sort((a, b) => a.cost - b.cost);

        const picked = candidates[0];

        if (picked) {
          picked.node.used += 1;
        }

        controller.enqueue(
          sseFrame("progress", {
            step: index + 1,
            total: items.length,
            itemId: item.id,
            nodeId: picked?.node.id ?? null,
            cost: picked?.cost ?? null,
            status: picked ? "assigned" : "unassigned"
          })
        );
      }

      controller.enqueue(
        sseFrame("done", {
          elapsedMs: Date.now() - startedAt,
          assignments: nodeState.map((node) => ({ id: node.id, used: node.used }))
        })
      );

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
