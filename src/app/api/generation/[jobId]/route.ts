import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJobForUser, pollJob } from "@/lib/generation";
import { readJobClaim } from "@/lib/claim";

/**
 * Generation job status.
 *
 * Polling also nudges the job forward, which keeps the page responsive while
 * the background worker is between ticks. The worker remains the authority:
 * closing this page does not stop the job.
 *
 * Scoped to the job's owner. An anonymous caller can only read a job that has
 * no owner (a pre-order preview from their own session).
 */

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { jobId } = await params;
  const [session, presentedClaim] = await Promise.all([auth(), readJobClaim()]);
  const userId = session?.user?.id ?? null;

  // Authorize before doing any work: polling a job hits the provider, so an
  // unentitled caller must not be able to drive that.
  const job = await getJobForUser(jobId, userId, presentedClaim);
  if (job) await pollJob(jobId).catch(() => {});

  const fresh = job ? await getJobForUser(jobId, userId, presentedClaim) : null;

  if (!fresh) {
    // 404 rather than 403: a job id belonging to someone else must be
    // indistinguishable from one that does not exist.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: fresh.id,
      status: fresh.status,
      attempts: fresh.attempts,
      // Keys, not bytes. Each is fetched through /api/uploads/[key], which
      // repeats the authorization check.
      pages: fresh.pages,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
