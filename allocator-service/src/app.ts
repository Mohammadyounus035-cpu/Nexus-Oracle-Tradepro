import Fastify from "fastify";
import { registerAllocateRoute } from "./routes/allocate";

/**
 * Constructs and configures a Fastify application with allocation routes registered.
 *
 * The created app has request logging enabled and includes the allocation route(s)
 * registered by registerAllocateRoute.
 *
 * @returns A configured Fastify application instance with logging enabled and allocation routes registered
 */
export async function buildApp() {
  const app = Fastify({ logger: true });
  await registerAllocateRoute(app);
  return app;
}
