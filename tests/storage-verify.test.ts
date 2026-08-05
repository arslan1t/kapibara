import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Storage credential verification.
 *
 * `isConfigured()` only proves a value is present. That is not enough, and the
 * gap is not hypothetical: during setup a publishable key was pasted into
 * SUPABASE_SERVICE_ROLE_KEY. Configuration looked complete, the health check
 * went green, and every upload would have failed with a row-level-security
 * error the first time a customer submitted a child's photograph.
 *
 * These tests pin the two failures worth catching before deploy:
 *   • a key that is not service-role (bucket reads as absent)
 *   • a "private" bucket that is actually public
 */

let server: Server;
let baseUrl: string;

/** Response the mock returns for GET /storage/v1/bucket/{name}. */
let bucketResponse: { status: number; body: unknown } = {
  status: 200,
  body: { name: "kapibara-private", public: false },
};

let lastAuthorization: string | undefined;

before(async () => {
  server = createServer((req, res) => {
    lastAuthorization = req.headers.authorization;
    res.writeHead(bucketResponse.status, { "content-type": "application/json" });
    res.end(JSON.stringify(bucketResponse.body));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  process.env.STORAGE_DRIVER = "supabase";
  process.env.SUPABASE_URL = baseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-not-a-real-credential";
  process.env.SUPABASE_PRIVATE_BUCKET = "kapibara-private";
  process.env.SUPABASE_PUBLIC_BUCKET = "kapibara-public";
});

async function verify() {
  const { verifyStorage } = await import("../src/lib/storage");
  return verifyStorage();
}

describe("storage credential verification", () => {
  test("a working service-role key passes", async () => {
    bucketResponse = { status: 200, body: { name: "kapibara-private", public: false } };

    const result = await verify();
    assert.equal(result.ok, true);
    assert.equal(
      lastAuthorization,
      "Bearer service-role-key-not-a-real-credential",
      "the service-role key was not sent as a bearer token"
    );
  });

  test("a non-service-role key fails, and the message says why", async () => {
    // What Supabase actually returns for a publishable key: row-level security
    // hides the bucket, so it reads as missing rather than forbidden.
    bucketResponse = {
      status: 400,
      body: { statusCode: "404", error: "Bucket not found", code: "NoSuchBucket" },
    };

    const result = await verify();
    assert.equal(result.ok, false, "a publishable key was accepted as service_role");
    if (result.ok) return;

    // The whole value of this check is that an operator can act on it.
    assert.match(
      result.error,
      /service_role/,
      "the error does not name the likely cause"
    );
  });

  test("a private bucket that is actually public fails", async () => {
    bucketResponse = { status: 200, body: { name: "kapibara-private", public: true } };

    const result = await verify();
    assert.equal(
      result.ok,
      false,
      "a world-readable bucket for children's photographs was accepted"
    );
    if (!result.ok) assert.match(result.error, /публичн/i);
  });

  test("an unreachable provider fails rather than throwing", async () => {
    // A health check that throws is worse than one that reports a fault.
    process.env.SUPABASE_URL = "http://127.0.0.1:1";

    const result = await verify();
    assert.equal(result.ok, false);
  });

  test("missing configuration fails without a network call", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await verify();
    assert.equal(result.ok, false);
  });

  test("the local driver verifies by actually writing", async () => {
    process.env.STORAGE_DRIVER = "local";

    const result = await verify();
    assert.equal(result.ok, true, "the local storage directory is not writable");
  });
});
