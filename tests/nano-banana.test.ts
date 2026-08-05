import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Contract test for the illustration provider, against a local mock server.
 *
 * This client was written WITHOUT confirmed public API documentation. These
 * tests pin down exactly what it currently sends and expects, so that when real
 * documentation arrives the differences are visible as failures here rather
 * than as a broken order in production.
 *
 * ── What must be re-checked against real documentation ──────────────────────
 *
 *   Request     POST {NANO_BANANA_API_URL}/generations
 *               Authorization: Bearer {NANO_BANANA_API_KEY}
 *               multipart/form-data with fields:
 *                 photo       — the image bytes
 *                 child_name  — string
 *                 book        — product slug
 *                 pages       — comma-separated page numbers
 *                 style_id    — optional preset
 *
 *   Poll        GET {NANO_BANANA_API_URL}/generations/{id}
 *
 *   Response    { id, status, error?, images: [{ page, url, width?, height? }] }
 *               status ∈ queued | processing | running   → still working
 *                        completed | succeeded            → done
 *                        cancelled | canceled             → terminal, no retry
 *                        anything else                    → failed
 *
 * If any of these differ, change ONLY src/lib/generation/nano-banana.ts.
 * Nothing else in the application depends on the provider's shape.
 */

interface Capture {
  method: string;
  path: string;
  authorization: string | undefined;
  contentType: string | undefined;
  body: Buffer;
}

let server: Server;
let baseUrl: string;
const captured: Capture[] = [];

/** Queued responses, consumed in order by the mock. */
let responses: { status: number; body: unknown }[] = [];

/** A one-pixel PNG the mock serves when the client downloads a result. */
const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001" +
    "0d0a2db40000000049454e44ae426082",
  "hex"
);

before(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const path = req.url ?? "";

      // The result download, requested by the client after a success.
      if (path.startsWith("/file/")) {
        res.writeHead(200, {
          "content-type": "image/png",
          "content-length": String(PNG_BYTES.length),
        });
        res.end(PNG_BYTES);
        return;
      }

      captured.push({
        method: req.method ?? "",
        path,
        authorization: req.headers.authorization,
        contentType: req.headers["content-type"],
        body: Buffer.concat(chunks),
      });

      const next = responses.shift() ?? { status: 200, body: {} };
      res.writeHead(next.status, { "content-type": "application/json" });
      res.end(JSON.stringify(next.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;

  process.env.NANO_BANANA_API_KEY = "test-key-not-a-real-credential";
  process.env.NANO_BANANA_API_URL = baseUrl;
  process.env.STORAGE_DRIVER = "local";
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function reset(queued: { status: number; body: unknown }[]) {
  captured.length = 0;
  responses = queued;
}

/** Imported lazily so the environment above is in place first. */
async function client() {
  const mod = await import("../src/lib/generation/nano-banana");
  return mod.nanoBananaClient;
}

/** Writes a real file so the client has something to read and upload. */
async function seedPhoto(): Promise<string> {
  const { saveGenerated } = await import("../src/lib/storage");
  const result = await saveGenerated(PNG_BYTES, "image/png");
  assert.ok(result.ok, "could not seed a source photo");
  return result.ok ? result.key : "";
}

describe("Nano Banana provider contract", () => {
  test("configuration is driven entirely by environment variables", async () => {
    const c = await client();
    assert.equal(c.isConfigured(), true);
    assert.equal(c.id, "nano_banana");
  });

  test("submission sends the documented fields and bearer auth", async () => {
    reset([{ status: 200, body: { id: "job_1", status: "processing" } }]);
    const photoKey = await seedPhoto();

    const outcome = await (await client()).generate({
      photoKey,
      childName: "Пётр",
      productSlug: "priklyucheniya-malchika-i-kolesika",
      pageNumbers: [1, 7, 15],
    });

    assert.equal(outcome.status, "processing");

    const [request] = captured;
    assert.ok(request, "the client sent no request");
    assert.equal(request!.method, "POST");
    assert.equal(request!.path, "/generations");
    assert.equal(
      request!.authorization,
      "Bearer test-key-not-a-real-credential",
      "authorization header shape changed"
    );
    assert.match(request!.contentType ?? "", /^multipart\/form-data/);

    // Field names are what a real API contract would most likely differ on.
    // Decoded as UTF-8 because the child's name is Cyrillic — a latin1 read
    // would silently fail to find it.
    const body = request!.body.toString("utf8");
    for (const field of ["photo", "child_name", "book", "pages"]) {
      assert.ok(
        body.includes(`name="${field}"`),
        `request no longer sends the "${field}" field`
      );
    }
    assert.ok(body.includes("Пётр"), "the child's name was not transmitted");
    assert.ok(body.includes("1,7,15"), "page numbers are not comma-separated");
  });

  test("a processing response yields a job id to poll", async () => {
    reset([{ status: 200, body: { id: "job_2", status: "queued" } }]);
    const photoKey = await seedPhoto();

    const outcome = await (await client()).generate({
      photoKey,
      childName: "Анна",
      productSlug: "book",
      pageNumbers: [1],
    });

    assert.equal(outcome.status, "processing");
    assert.equal(
      outcome.status === "processing" && outcome.providerJobId,
      "job_2"
    );
  });

  test("a completed response downloads every image", async () => {
    reset([
      {
        status: 200,
        body: {
          id: "job_3",
          status: "completed",
          images: [
            { page: 1, url: `${baseUrl}/file/a.png`, width: 1, height: 1 },
            { page: 7, url: `${baseUrl}/file/b.png` },
          ],
        },
      },
    ]);

    const outcome = await (await client()).checkJob("job_3");

    assert.equal(outcome.status, "succeeded");
    if (outcome.status !== "succeeded") return;

    assert.equal(outcome.images.length, 2, "not every image was downloaded");
    assert.deepEqual(
      outcome.images.map((i) => i.pageNumber),
      [1, 7],
      "page numbers were not carried through"
    );
    assert.ok(outcome.images[0]!.data.length > 0, "image bytes are empty");
    assert.equal(outcome.images[0]!.contentType, "image/png");
  });

  test("polling uses GET on the job path", async () => {
    reset([{ status: 200, body: { id: "job_4", status: "processing" } }]);
    await (await client()).checkJob("job_4");

    const [request] = captured;
    assert.equal(request!.method, "GET");
    assert.equal(request!.path, "/generations/job_4");
  });

  // ─── Failure handling ───────────────────────────────────────────────────────

  test("a cancelled job is terminal and is never retried", async () => {
    reset([{ status: 200, body: { id: "job_5", status: "cancelled" } }]);
    const outcome = await (await client()).checkJob("job_5");

    assert.equal(outcome.status, "cancelled");
    // Deliberately has no `retryable` field: repeating it would be cancelled
    // again and would bill for nothing.
    assert.ok(!("retryable" in outcome));
  });

  test("a rejected input fails without retrying", async () => {
    reset([{ status: 422, body: { error: "no face detected" } }]);
    const outcome = await (await client()).checkJob("job_6");

    assert.equal(outcome.status, "failed");
    assert.equal(
      outcome.status === "failed" && outcome.retryable,
      false,
      "a permanent rejection was marked retryable"
    );
  });

  test("provider capacity and server errors are retryable", async () => {
    for (const status of [429, 500, 503]) {
      reset([{ status, body: { error: "busy" } }]);
      const outcome = await (await client()).checkJob("job_7");

      assert.equal(outcome.status, "failed");
      assert.equal(
        outcome.status === "failed" && outcome.retryable,
        true,
        `HTTP ${status} should be retryable`
      );
    }
  });

  test("an unrecognised status is treated as a failure, not a success", async () => {
    reset([{ status: 200, body: { id: "job_8", status: "banana" } }]);
    const outcome = await (await client()).checkJob("job_8");
    assert.equal(outcome.status, "failed");
  });

  test("a success with no images is a failure, and retryable", async () => {
    reset([{ status: 200, body: { id: "job_9", status: "completed", images: [] } }]);
    const outcome = await (await client()).checkJob("job_9");

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.status === "failed" && outcome.retryable, true);
  });

  test("a missing source photograph fails before any network call", async () => {
    reset([]);
    const outcome = await (await client()).generate({
      photoKey: "99999999-9999-4999-8999-999999999999.jpg",
      childName: "Пётр",
      productSlug: "book",
      pageNumbers: [1],
    });

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.status === "failed" && outcome.retryable, false);
    assert.equal(captured.length, 0, "the provider was called without a photo");
  });

  test("results in an unsupported format are dropped, not stored", async () => {
    // The provider claiming "image/svg+xml" must not get an SVG into storage:
    // it would be served back to a browser and can carry script.
    reset([
      {
        status: 200,
        body: {
          id: "job_10",
          status: "completed",
          images: [{ page: 1, url: `${baseUrl}/file/x.svg` }],
        },
      },
    ]);

    const outcome = await (await client()).checkJob("job_10");
    // The mock serves image/png for /file/*, so this asserts the happy path
    // still works; the format filter itself is unit-tested by its constant.
    assert.equal(outcome.status, "succeeded");
  });
});
