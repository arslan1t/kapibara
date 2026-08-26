import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Contract test for the illustration provider (Nano Banana Pro via kie.ai).
 *
 * Unlike its predecessor, this is pinned against shapes observed from the live
 * API rather than guessed at:
 *
 *   POST /jobs/createTask   -> {code:200, msg, data:{taskId, recordId}}
 *   GET  /jobs/recordInfo   -> {code:200, msg, data:{state, resultJson,
 *                                failCode, failMsg}}
 *
 *   state       waiting | queuing | generating   → still working
 *               success                          → done
 *               fail (or anything else)          → failed
 *   resultJson  a JSON *string* holding {resultUrls: [...]}
 *
 * The API answers HTTP 200 with a non-200 `code` for its own errors, which is
 * why every test here checks the envelope rather than the status line.
 */

interface Capture {
  method: string;
  path: string;
  authorization: string | undefined;
  contentType: string | undefined;
  body: string;
}

let server: Server;
let baseUrl: string;
const captured: Capture[] = [];
let responses: { status: number; body: unknown }[] = [];
/** Makes the mocked signing endpoint refuse, as it does for a missing object. */
let signingFails = false;

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

      // Supabase's signing endpoint. Exercised for real because the local
      // driver cannot mint a URL at all, and a URL is the only way the
      // provider can reach the photograph.
      if (path.startsWith("/storage/v1/object/sign/")) {
        if (signingFails) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "Object not found" }));
          return;
        }
        const key = path.split("/").pop();
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ signedURL: `/object/sign/kapibara-private/${key}?token=stub` })
        );
        return;
      }

      // Result download, requested after a success.
      if (path.startsWith("/file/")) {
        const svg = path.endsWith(".svg");
        res.writeHead(200, {
          "content-type": svg ? "image/svg+xml" : "image/png",
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
        body: Buffer.concat(chunks).toString("utf8"),
      });

      const next = responses.shift() ?? { status: 200, body: { code: 200, data: {} } };
      res.writeHead(next.status, { "content-type": "application/json" });
      res.end(JSON.stringify(next.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  process.env.NANO_BANANA_API_KEY = "test-key-not-a-real-credential";
  process.env.NANO_BANANA_API_URL = baseUrl;
  process.env.NANO_BANANA_MODEL = "nano-banana-pro";
  // Supabase rather than local: only a driver that can sign is usable here.
  process.env.STORAGE_DRIVER = "supabase";
  process.env.SUPABASE_URL = baseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-not-a-real-credential";
  process.env.SUPABASE_PRIVATE_BUCKET = "kapibara-private";
  process.env.SUPABASE_PUBLIC_BUCKET = "kapibara-public";
  process.env.NEXT_PUBLIC_SITE_URL = "https://capibara.su";
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function reset(queued: { status: number; body: unknown }[]) {
  captured.length = 0;
  responses = queued;
}

async function client() {
  return (await import("../src/lib/generation/nano-banana")).nanoBananaClient;
}

/**
 * A syntactically valid storage key.
 *
 * Not a real upload: the signing endpoint is mocked above, and `signedUrlFor`
 * validates the key shape before it signs — which is the behaviour under test.
 */
function seedPhoto(): string {
  return "11111111-2222-4333-8444-555555555555.png";
}

const ok = (data: unknown) => ({ status: 200, body: { code: 200, msg: "success", data } });

describe("Nano Banana provider contract", () => {
  test("configuration comes entirely from the environment", async () => {
    const c = await client();
    assert.equal(c.isConfigured(), true);
    assert.equal(c.id, "nano_banana");
  });

  test("submission sends both images, cover first, with bearer auth", async () => {
    reset([ok({ taskId: "task_1", recordId: "task_1" })]);
    const photoKey = seedPhoto();

    const outcome = await (await client()).generate({
      photoKey,
      childName: "Пётр",
      productSlug: "priklyucheniya-malchika-i-kolesika",
      pageNumbers: [1],
      childGender: "boy",
    });

    assert.equal(outcome.status, "processing");

    const [request] = captured;
    assert.ok(request, "no request was sent");
    assert.equal(request!.method, "POST");
    assert.equal(request!.path, "/jobs/createTask");
    assert.equal(request!.authorization, "Bearer test-key-not-a-real-credential");
    assert.match(request!.contentType ?? "", /application\/json/);

    const body = JSON.parse(request!.body);
    assert.equal(body.model, "nano-banana-pro");

    // The whole feature rests on this: two images, and the prompt refers to
    // them positionally as Img 1 and Img 2.
    assert.equal(body.input.image_input.length, 2, "expected exactly two images");
    assert.match(
      body.input.image_input[0],
      /\/images\/books\/kolesik-cover\.png$/,
      "Img 1 must be the cover of the book being previewed"
    );
    assert.ok(
      body.input.image_input[1].includes(photoKey),
      "Img 2 must be a link to the child's photograph"
    );

    // The prompt is the feature. These two clauses are what stop the model
    // returning a photograph pasted onto cartoon artwork.
    assert.match(body.input.prompt, /Redraw ONLY the child character/);
    assert.match(body.input.prompt, /Do NOT make the character photorealistic/);
    assert.match(body.input.prompt, /Do NOT paste or blend the photograph/);
  });

  test("the child's photograph is passed as a signed link, never a public one", async () => {
    reset([ok({ taskId: "task_2" })]);
    const photoKey = seedPhoto();

    await (await client()).generate({
      photoKey,
      childName: "Анна",
      productSlug: "book",
      pageNumbers: [1],
      childGender: "girl",
    });

    const body = JSON.parse(captured[0]!.body);
    const photoUrl: string = body.input.image_input[1];

    // The local driver signs with a token; the supabase driver signs with a
    // JWT. Either way the link must not be a bare public object path.
    assert.ok(
      !photoUrl.includes("/object/public/"),
      "the photograph was handed over as a public URL"
    );
  });

  test("an unknown gender falls back to the boy cover rather than failing", async () => {
    reset([ok({ taskId: "task_3" })]);
    const photoKey = seedPhoto();

    const outcome = await (await client()).generate({
      photoKey,
      childName: "Ева",
      productSlug: "book",
      pageNumbers: [1],
      childGender: "unknown-value",
    });

    assert.equal(outcome.status, "processing");
    const body = JSON.parse(captured[0]!.body);
    assert.match(body.input.image_input[0], /kolesik-cover\.png$/);
  });

  test("the girl edition is given its own cover", async () => {
    reset([ok({ taskId: "task_g" })]);

    await (await client()).generate({
      photoKey: seedPhoto(),
      childName: "Ева",
      productSlug: "priklyucheniya-devochki-i-kolesika",
      pageNumbers: [1],
      childGender: "girl",
    });

    const body = JSON.parse(captured[0]!.body);
    assert.match(body.input.image_input[0], /girl-kolesik-cover\.png$/);
  });

  test("a task id is returned to poll", async () => {
    reset([ok({ taskId: "task_4", recordId: "task_4" })]);
    const photoKey = seedPhoto();

    const outcome = await (await client()).generate({
      photoKey,
      childName: "Лев",
      productSlug: "book",
      pageNumbers: [1],
    });

    assert.equal(outcome.status === "processing" && outcome.providerJobId, "task_4");
  });

  // ─── Polling ────────────────────────────────────────────────────────────────

  test("polling uses GET on recordInfo with the task id", async () => {
    reset([ok({ taskId: "task_5", state: "waiting" })]);
    const outcome = await (await client()).checkJob("task_5");

    assert.equal(outcome.status, "processing");
    assert.equal(captured[0]!.method, "GET");
    assert.equal(captured[0]!.path, "/jobs/recordInfo?taskId=task_5");
  });

  test("every in-progress state keeps the job processing", async () => {
    for (const state of ["waiting", "queuing", "generating"]) {
      reset([ok({ state })]);
      const outcome = await (await client()).checkJob("task_6");
      assert.equal(outcome.status, "processing", `state "${state}" should keep polling`);
    }
  });

  test("a success downloads the images named in resultJson", async () => {
    reset([
      ok({
        state: "success",
        // A JSON string, not an object — this is what the API actually returns.
        resultJson: JSON.stringify({
          resultUrls: [`${baseUrl}/file/a.png`, `${baseUrl}/file/b.png`],
        }),
      }),
    ]);

    const outcome = await (await client()).checkJob("task_7");
    assert.equal(outcome.status, "succeeded");
    if (outcome.status !== "succeeded") return;

    assert.equal(outcome.images.length, 2);
    assert.ok(outcome.images[0]!.data.length > 0);
    assert.equal(outcome.images[0]!.contentType, "image/png");
  });

  test("a failed state is terminal and is not retried", async () => {
    reset([ok({ state: "fail", failCode: "400", failMsg: "content rejected" })]);
    const outcome = await (await client()).checkJob("task_8");

    assert.equal(outcome.status, "failed");
    assert.equal(
      outcome.status === "failed" && outcome.retryable,
      false,
      "a rejected input would be rejected identically on a retry"
    );
    assert.equal(outcome.status === "failed" && outcome.error, "content rejected");
  });

  test("an unrecognised state is a failure, not a success", async () => {
    reset([ok({ state: "banana" })]);
    const outcome = await (await client()).checkJob("task_9");
    assert.equal(outcome.status, "failed");
  });

  test("an envelope code other than 200 is a failure even on HTTP 200", async () => {
    reset([{ status: 200, body: { code: 402, msg: "insufficient credits" } }]);
    const outcome = await (await client()).checkJob("task_10");

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.status === "failed" && outcome.error, "insufficient credits");
  });

  test("a rejected submission is not retried, but a busy provider is", async () => {
    const photoKey = seedPhoto();

    reset([{ status: 200, body: { code: 422, msg: "bad image" } }]);
    let outcome = await (await client()).generate({
      photoKey, childName: "Пётр", productSlug: "book", pageNumbers: [1],
    });
    assert.equal(outcome.status === "failed" && outcome.retryable, false);

    for (const status of [429, 500, 503]) {
      reset([{ status, body: { code: status, msg: "busy" } }]);
      outcome = await (await client()).generate({
        photoKey, childName: "Пётр", productSlug: "book", pageNumbers: [1],
      });
      assert.equal(
        outcome.status === "failed" && outcome.retryable,
        true,
        `HTTP ${status} should be retryable`
      );
    }
  });

  test("a success with no urls is a failure, and retryable", async () => {
    reset([ok({ state: "success", resultJson: JSON.stringify({ resultUrls: [] }) })]);
    const outcome = await (await client()).checkJob("task_11");

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.status === "failed" && outcome.retryable, true);
  });

  test("malformed resultJson does not throw", async () => {
    reset([ok({ state: "success", resultJson: "{not json" })]);
    const outcome = await (await client()).checkJob("task_12");
    assert.equal(outcome.status, "failed");
  });

  test("a result served as SVG is dropped, not stored", async () => {
    // An SVG reaching private storage would later be served back to a browser,
    // where it can carry script.
    reset([
      ok({
        state: "success",
        resultJson: JSON.stringify({ resultUrls: [`${baseUrl}/file/x.svg`] }),
      }),
    ]);

    const outcome = await (await client()).checkJob("task_13");
    assert.equal(outcome.status, "failed", "an SVG result was accepted");
  });

  test("a malformed storage key never reaches the network", async () => {
    reset([]);
    const outcome = await (await client()).generate({
      photoKey: "../../etc/passwd",
      childName: "Пётр",
      productSlug: "book",
      pageNumbers: [1],
    });

    assert.equal(outcome.status, "failed");
    assert.equal(outcome.status === "failed" && outcome.retryable, false);
    assert.equal(captured.length, 0, "a crafted key reached the provider");
  });

  test("an unsignable photograph stops the job before the provider is billed", async () => {
    // What Supabase does for an object that is not there. Submitting anyway
    // would spend credits on a job that cannot possibly succeed.
    signingFails = true;
    reset([]);

    const outcome = await (await client()).generate({
      photoKey: seedPhoto(),
      childName: "Пётр",
      productSlug: "book",
      pageNumbers: [1],
    });
    signingFails = false;

    assert.equal(outcome.status, "failed");
    assert.equal(captured.length, 0, "the provider was called without a usable photo");
  });
});
