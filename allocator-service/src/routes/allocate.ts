import type { FastifyInstance } from "fastify";
import { AllocateRequestSchema } from "../domain/validate";
import { allocate } from "../solver/allocate";
import { withTimeout } from "../lib/timeout";

/**
 * Register POST /v1/allocate route on the Fastify instance to handle allocation requests.
 *
 * The route validates the request body, applies `timeoutMs` from the input (default 2000 ms) to the allocation call, and maps outcomes to HTTP responses:
 * - 400 — `{ error: "INVALID_INPUT", details }` when validation fails
 * - 422 — `{ error: "INFEASIBLE", ...result }` when allocation result has `flow === 0`
 * - 200 — allocation `result` on success
 * - 504 — `{ error: "TIMEOUT" }` when the allocation times out
 * - 500 — `{ error: "INTERNAL_ERROR" }` for other errors (the error is logged)
 */
export async function registerAllocateRoute(app: FastifyInstance): Promise<void> {
  app.post("/v1/allocate", async (request, reply) => {
    const parsed = AllocateRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "INVALID_INPUT",
        details: parsed.error.flatten(),
      });
    }

    const timeoutMs = parsed.data.timeoutMs ?? 2000;

    try {
      const result = await withTimeout(Promise.resolve(allocate(parsed.data)), timeoutMs);

      if (result.flow === 0) {
        return reply.status(422).send({
          error: "INFEASIBLE",
          ...result,
        });
      }

      return reply.status(200).send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
      if (message === "REQUEST_TIMEOUT") {
        return reply.status(504).send({ error: "TIMEOUT" });
      }
      request.log.error({ err }, "allocation_failed");
      return reply.status(500).send({ error: "INTERNAL_ERROR" });
    }
  });
}
