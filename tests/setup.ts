/**
 * Loads .env for tests. Node's --env-file does not understand the quoted
 * values Prisma writes, so this parses them the same way dotenv does.
 */
import { readFileSync } from "node:fs";

try {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key!] !== undefined) continue;
    process.env[key!] = rawValue!.replace(/^["']|["']$/g, "");
  }
} catch {
  // No .env — rely on the ambient environment (CI).
}
