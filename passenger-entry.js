/**
 * Passenger entry point.
 *
 * Beget's shared hosting runs Node applications under Apache's mod_passenger,
 * which starts the process itself — there is no shell, so nothing sources
 * `.env` the way the deploy script does when it runs the server by hand.
 *
 * Next's standalone `server.js` deliberately does not read `.env` either: in
 * standalone mode it expects the environment to be populated already. Without
 * this file the application boots with no DATABASE_URL and no AUTH_SECRET.
 *
 * Passenger can inject variables with `PassengerEnvVar`, but those live in
 * `.htaccess` — a file inside the web tree, served as plain text the moment a
 * rewrite rule is wrong. The database password and the Supabase service-role
 * key are not going there. They stay in `.env`, mode 600, outside the document
 * root, and are read here.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * Minimal .env reader.
 *
 * Deliberately not `dotenv`: this file runs before anything is resolved from
 * node_modules, and the format we actually write is simple. Existing variables
 * win, so anything Passenger or the panel sets is never clobbered.
 */
function loadEnv(file) {
  let contents;
  try {
    contents = fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`[passenger-entry] no .env at ${file}`);
      return;
    }
    throw error;
  }

  for (const raw of contents.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key || key in process.env) continue;

    let value = line.slice(eq + 1).trim();
    // Strip one layer of matching quotes, which is how the file is written.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv(path.join(__dirname, ".env"));

process.env.NODE_ENV = "production";

// This account may not bind 0.0.0.0 — a plain `listen` on it fails with EPERM.
// Passenger replaces the listening socket anyway, but the default has to be
// something the host permits for the times this file is run directly.
if (!process.env.HOSTNAME) process.env.HOSTNAME = "127.0.0.1";

// `server.js` chdir()s to its own directory, so relative paths inside the
// standalone bundle resolve regardless of where Passenger started us.
require("./.next/standalone/server.js");
