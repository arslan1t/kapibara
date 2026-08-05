/**
 * Fails the build if a server secret reached the browser bundle.
 *
 * Next.js only inlines NEXT_PUBLIC_* variables by design, but the guarantee is
 * easy to lose: a `"use client"` added to a module that reads process.env, a
 * secret interpolated into a prop, a config object passed from a server
 * component into a client one. This checks the built output rather than
 * trusting the convention.
 *
 *   node scripts/check-client-secrets.mjs
 *
 * Scans .next/static (everything shipped to the browser) for the *values* of
 * sensitive variables, and for tell-tale key formats even when the variable is
 * not set locally.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Loads .env so the scan can compare against the *actual* secret values used
 * for this build, not just recognise credential formats. In CI the variables
 * come from the environment and this is a no-op.
 */
function loadEnvFile() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] === undefined) {
        process.env[key] = rawValue.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env — rely on the ambient environment.
  }
}

loadEnvFile();

const CLIENT_DIR = path.resolve(process.cwd(), ".next/static");

/**
 * Variables whose value must never appear in client code.
 * Checked by value, so it catches a secret that was inlined under any name.
 */
const SECRET_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "SMTP_PASSWORD",
  "SMTP_USER",
  "YOOKASSA_SECRET_KEY",
  "YOOKASSA_SHOP_ID",
  "YOOKASSA_WEBHOOK_SECRET",
  "NANO_BANANA_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "S3_SECRET_ACCESS_KEY",
  "S3_ACCESS_KEY_ID",
];

/**
 * Formats that identify a leaked credential even when the variable is absent
 * from this machine's environment (a CI run, a fresh clone).
 */
const SECRET_PATTERNS = [
  { name: "Resend API key", re: /\bre_[A-Za-z0-9]{20,}\b/ },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Supabase service-role JWT", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "PostgreSQL connection string", re: /\bpostgres(?:ql)?:\/\/[^\s"']*:[^\s"']*@/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
];

/** Values too short or too common to match on without false positives. */
function isMatchable(value) {
  return typeof value === "string" && value.trim().length >= 12;
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(js|mjs|cjs|json|css|map)$/.test(entry.name)) yield full;
  }
}

async function main() {
  try {
    await stat(CLIENT_DIR);
  } catch {
    console.error(
      "No .next/static found. Run `npm run build` before this check."
    );
    process.exit(1);
  }

  const findings = [];
  let filesScanned = 0;
  let bytesScanned = 0;

  const liveSecrets = SECRET_VARS.map((name) => ({
    name,
    value: process.env[name],
  })).filter((entry) => isMatchable(entry.value));

  for await (const file of walk(CLIENT_DIR)) {
    const contents = await readFile(file, "utf8");
    filesScanned += 1;
    bytesScanned += contents.length;

    for (const { name, value } of liveSecrets) {
      if (contents.includes(value)) {
        findings.push({
          file: path.relative(process.cwd(), file),
          reason: `value of ${name} is present in client code`,
        });
      }
    }

    for (const { name, re } of SECRET_PATTERNS) {
      const match = contents.match(re);
      if (match) {
        findings.push({
          file: path.relative(process.cwd(), file),
          reason: `looks like a ${name}`,
        });
      }
    }
  }

  console.log(
    `Scanned ${filesScanned} client files (${Math.round(bytesScanned / 1024)} KB).`
  );
  console.log(
    `Checked values of ${liveSecrets.length}/${SECRET_VARS.length} sensitive variables set in this environment,` +
      ` plus ${SECRET_PATTERNS.length} credential formats.`
  );

  if (findings.length > 0) {
    console.error("\nSECRETS FOUND IN CLIENT BUNDLE:");
    for (const finding of findings) {
      console.error(`  ${finding.file}: ${finding.reason}`);
    }
    process.exit(1);
  }

  console.log("No server secrets found in the client bundle.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
