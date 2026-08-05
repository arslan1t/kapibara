import "server-only";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Append-only record of sensitive administrator actions.
 *
 * Answers "who changed this, and when" for the operations that move money,
 * change what customers can buy, or remove content — the questions asked after
 * a mistake or a dispute, when memory and chat history are not evidence.
 *
 * Deliberately narrow: identifiers, a short summary, and the actor. Never
 * customer personal data, never photograph keys, never full record contents.
 * An audit log that copies the database is a second thing to leak.
 */

export const ADMIN_AUDIT_ACTIONS = [
  "order.status_changed",
  "order.payment_status_changed",
  "order.note_saved",
  "product.created",
  "product.updated",
  "product.archived",
  "product.image_added",
  "product.image_deleted",
  "product.images_reordered",
  "review.moderated",
  "review.featured_changed",
  "payment.refreshed",
  "generation.started",
  "generation.retried",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type AuditTargetType =
  | "order"
  | "product"
  | "review"
  | "payment"
  | "user"
  | "image";

export interface AuditEntry {
  actorId: string;
  actorEmail: string;
  action: AdminAuditAction;
  targetType: AuditTargetType;
  targetId: string;
  /** Short and non-sensitive, e.g. "new -> in_delivery". */
  summary?: string;
}

/**
 * Records an action.
 *
 * Never throws: an audit failure must not roll back a change an administrator
 * has already made and been told succeeded. A failure is logged loudly instead,
 * because a silently broken audit trail is worse than a noisy one.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        summary: entry.summary?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", {
      action: entry.action,
      targetType: entry.targetType,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}
