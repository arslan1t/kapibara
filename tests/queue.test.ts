import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db, resetDatabase, createUser, createProduct } from "./helpers";
import {
  claimNextJob,
  requeueJob,
  failJob,
  queueDepth,
  runMaintenance,
  LEASE_TIMEOUT_MS,
} from "../src/lib/generation/queue";
import { GENERATION_MAX_ATTEMPTS } from "../src/lib/constants";

/**
 * The background queue.
 *
 * The guarantee under test: a job is processed by exactly one worker, work
 * survives a crashed worker, and a permanently broken job stops retrying
 * instead of burning provider quota forever.
 */
describe("generation queue", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  async function seedJob(overrides: Record<string, unknown> = {}) {
    const user = await createUser();
    const product = await createProduct();
    return db.generationJob.create({
      data: {
        productId: product.id,
        userId: user.id,
        childName: "Пётр",
        photoKey: "44444444-4444-4444-8444-444444444444.jpg",
        provider: "nano_banana",
        status: "queued",
        ...overrides,
      },
    });
  }

  test("a queued job is claimed exactly once", async () => {
    const job = await seedJob();

    const first = await claimNextJob();
    assert.ok(first, "the queued job was not claimed");
    assert.equal(first!.id, job.id);

    // A second worker polling immediately afterwards must find nothing.
    const second = await claimNextJob();
    assert.equal(second, null, "the same job was claimed twice");
  });

  test("claiming marks the job processing and records the lease", async () => {
    const job = await seedJob();
    await claimNextJob();

    const after = await db.generationJob.findUnique({ where: { id: job.id } });
    assert.equal(after!.status, "processing");
    assert.equal(after!.attempts, 1);
    assert.ok(after!.lockedAt, "no lease timestamp");
    assert.ok(after!.lockedBy, "no worker identity on the lease");
  });

  test("a crashed worker's job is reclaimed once its lease expires", async () => {
    const job = await seedJob();
    await claimNextJob();

    // Nothing to claim while the lease is fresh.
    assert.equal(await claimNextJob(), null, "claimed a job under a live lease");

    // Simulate the worker dying: the lease ages past the timeout.
    await db.generationJob.update({
      where: { id: job.id },
      data: { lockedAt: new Date(Date.now() - LEASE_TIMEOUT_MS - 1000) },
    });

    const reclaimed = await claimNextJob();
    assert.ok(reclaimed, "an abandoned job was never reclaimed");
    assert.equal(reclaimed!.id, job.id);
    assert.equal(reclaimed!.attempts, 2, "the retry was not counted");
  });

  test("a requeued job waits for its backoff before being claimed again", async () => {
    const job = await seedJob();
    const claimed = await claimNextJob();
    await requeueJob(job.id, claimed!.attempts, "provider timeout");

    const tooSoon = await claimNextJob();
    assert.equal(tooSoon, null, "backoff was ignored");

    await db.generationJob.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });

    const later = await claimNextJob();
    assert.ok(later, "the job was never retried after its backoff");
  });

  test("retries stop at the cap so a broken job cannot loop forever", async () => {
    const job = await seedJob({ attempts: GENERATION_MAX_ATTEMPTS });

    const claimed = await claimNextJob();
    assert.equal(claimed, null, "a job past its retry cap was claimed again");

    // Confirm the cap is what blocked it, not something else.
    await db.generationJob.update({
      where: { id: job.id },
      data: { attempts: GENERATION_MAX_ATTEMPTS - 1 },
    });
    assert.ok(await claimNextJob(), "a job below the cap was not claimable");
  });

  test("a failed job releases its lease and is terminal", async () => {
    const job = await seedJob();
    await claimNextJob();
    await failJob(job.id, "provider rejected the photograph");

    const after = await db.generationJob.findUnique({ where: { id: job.id } });
    assert.equal(after!.status, "failed");
    assert.equal(after!.lockedAt, null, "lease was not released");
    assert.ok(after!.completedAt, "completion was not recorded");

    assert.equal(await claimNextJob(), null, "a failed job was claimed again");
  });

  test("a cancelled job is never picked up", async () => {
    await seedJob({ status: "cancelled" });
    assert.equal(await claimNextJob(), null, "a cancelled job was claimed");
  });

  test("queue depth reports stalled jobs separately", async () => {
    await seedJob();
    const stalledJob = await seedJob();
    await db.generationJob.update({
      where: { id: stalledJob.id },
      data: {
        status: "processing",
        lockedAt: new Date(Date.now() - LEASE_TIMEOUT_MS - 1000),
      },
    });

    const depth = await queueDepth();
    assert.equal(depth.queued, 1);
    assert.equal(depth.processing, 1);
    assert.equal(depth.stalled, 1, "a stalled job was not reported");
  });

  test("maintenance prunes expired rate limits and old tokens", async () => {
    const user = await createUser();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token: "a".repeat(64),
        type: "email_verify",
        expiresAt: new Date(Date.now() - 48 * 60 * 60_000),
      },
    });
    await db.rateLimitCounter.create({
      data: {
        key: "login:stale",
        count: 5,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const result = await runMaintenance();
    assert.equal(result.tokensPruned, 1);
    assert.equal(result.rateLimitsPruned, 1);
    assert.equal(await db.verificationToken.count(), 0);
    assert.equal(await db.rateLimitCounter.count(), 0);
  });
});
