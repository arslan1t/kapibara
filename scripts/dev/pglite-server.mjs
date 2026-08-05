/**
 * Local PostgreSQL for development and tests, with no server to install.
 *
 * PGlite is a real PostgreSQL build compiled to WebAssembly; this exposes it
 * over the normal wire protocol so Prisma, psql and the test suite connect to
 * it exactly as they would to a hosted database. Production uses a managed
 * PostgreSQL — see README §5.
 *
 *   npm run db:local
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dataDir = process.env.PGLITE_DIR ?? "./.pglite";
const port = Number(process.env.PGLITE_PORT ?? 55432);

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({
  db,
  port,
  host: "127.0.0.1",
  // Prisma opens a small pool and the test runner adds more; the default of 1
  // would drop every connection after the first.
  maxConnections: 20,
});

await server.start();
console.log(
  `PGlite (PostgreSQL) listening on 127.0.0.1:${port} — data in ${dataDir}`
);

// A query error must not take the whole server down: the test suite
// deliberately provokes constraint violations, and those surface here as socket
// errors once the client connection resets.
process.on("uncaughtException", (error) => {
  console.warn(`[pglite] recovered from: ${error.message}`);
});
process.on("unhandledRejection", (reason) => {
  console.warn(`[pglite] unhandled rejection: ${String(reason)}`);
});

async function shutdown() {
  await server.stop().catch(() => {});
  await db.close().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
