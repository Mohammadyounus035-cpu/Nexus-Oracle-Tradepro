import { buildApp } from "./app";

/**
 * Start the application server by building the app, reading PORT and HOST from the environment (defaults: `3000` and `"0.0.0.0"`), and listening on that address.
 */
async function main() {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen({ port, host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
