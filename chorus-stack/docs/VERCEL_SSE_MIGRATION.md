# Vercel-compatible real-time updates for allocator-service (SSE)

This guide gives a drop-in migration path from WebSockets to **Server-Sent Events (SSE)** so you can stay on Vercel while streaming allocator progress to the UI.

## When this is the right path

Use SSE when:
- clients only need **server → client** progress/status updates;
- solver requests are still modeled as jobs (`submit -> run -> result`);
- 1-way, near-real-time streaming is enough.

If clients must send interactive commands while a run is in progress (pause/resume/override over a single live channel), use a container host (Cloud Run/Fly.io) or a managed realtime broker.

## Architecture

1. Client `POST /api/jobs` with solver input.
2. API persists a job and returns `{ jobId }`.
3. Client opens `EventSource('/api/stream?jobId=...')`.
4. Server streams progress events (`progress`, `heartbeat`, `complete`, `error`).
5. Client optionally calls `GET /api/jobs/:id` for resumability.

---

## 1) Vercel Edge Function: `/api/stream`

Create `api/stream.ts` in the Vercel project:

```ts
export const config = {
  runtime: "edge"
};

type StreamEvent = {
  type: "progress" | "heartbeat" | "complete" | "error";
  jobId: string;
  message?: string;
  percent?: number;
  result?: unknown;
};

const encoder = new TextEncoder();

function toSSE(event: StreamEvent): Uint8Array {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

// Replace with your own storage / queue lookup.
async function* runAllocator(jobId: string): AsyncGenerator<StreamEvent> {
  const total = 20;
  for (let i = 1; i <= total; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
    yield {
      type: "progress",
      jobId,
      percent: Math.round((i / total) * 100),
      message: `Processed iteration ${i}/${total}`
    };

    if (i % 5 === 0) {
      yield { type: "heartbeat", jobId, message: "still-running" };
    }
  }

  yield {
    type: "complete",
    jobId,
    result: { assignments: [] }
  };
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(toSSE({ type: "heartbeat", jobId, message: "connected" }));

      try {
        for await (const event of runAllocator(jobId)) {
          controller.enqueue(toSSE(event));
        }
      } catch (err) {
        controller.enqueue(
          toSSE({
            type: "error",
            jobId,
            message: err instanceof Error ? err.message : "unknown-error"
          })
        );
      } finally {
        controller.close();
      }
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
```

---

## 2) Fastify solver bridge (job runner)

If your solver currently lives in Fastify, keep it as the computation layer and expose progress through an async generator or callback.

```ts
// solver-progress.ts
export type SolverProgress = {
  phase: string;
  iteration: number;
  total: number;
  bestCost?: number;
};

export type SolverResult = {
  assignments: Array<{ itemId: string; nodeId: string }>;
  totalCost: number;
};

export async function runMcmfWithProgress(
  input: unknown,
  onProgress: (p: SolverProgress) => void
): Promise<SolverResult> {
  const total = 100;

  for (let iteration = 1; iteration <= total; iteration += 1) {
    // Replace with actual MCMF relax/augment logic.
    onProgress({
      phase: "augment",
      iteration,
      total,
      bestCost: 1000 - iteration
    });

    await new Promise((r) => setTimeout(r, 20));
  }

  return {
    assignments: [],
    totalCost: 900
  };
}
```

In the Edge stream handler, call this with a progress callback and `enqueue` each update as SSE.

---

## 3) Browser client: `EventSource` instead of `WebSocket`

```ts
const source = new EventSource(`/api/stream?jobId=${encodeURIComponent(jobId)}`);

source.addEventListener("progress", (e) => {
  const payload = JSON.parse((e as MessageEvent).data);
  renderProgress(payload.percent, payload.message);
});

source.addEventListener("complete", (e) => {
  const payload = JSON.parse((e as MessageEvent).data);
  renderResult(payload.result);
  source.close();
});

source.addEventListener("error", (e) => {
  console.error("stream-error", e);
  source.close();
});
```

---

## Production notes

- Keep runs idempotent: reconnects can happen; stream from durable job state.
- Emit heartbeats every ~15-30s to keep proxies from idling out.
- Persist final result separately so client can recover after refresh.
- If you later require bidirectional realtime controls, add Ably/Pusher/PubNub and keep Vercel for the core APIs.
