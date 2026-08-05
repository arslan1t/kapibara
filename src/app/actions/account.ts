"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkPassword, isFullNameValid } from "@/lib/validation";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Result = { ok: true } | { ok: false; error: string };

const NOT_SIGNED_IN = "Войдите в аккаунт, чтобы продолжить";

export async function updateProfile(input: {
  fullName: string;
  phone: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const fullName = input.fullName?.trim() ?? "";
  if (!isFullNameValid(fullName)) {
    return { ok: false, error: "Введите имя" };
  }

  const phone = input.phone?.trim() ?? "";
  if (phone && phone.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Введите корректный номер телефона" };
  }

  // Scoped to the session's own id — a user can never edit someone else.
  await db.user.update({
    where: { id: user.id },
    data: { fullName, phone: phone || null },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { ok: false, error: NOT_SIGNED_IN };

  const limited = await rateLimit("login", `pwchange:${user.id}`);
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter) };
  }

  const matches = await bcrypt.compare(
    input.currentPassword ?? "",
    record.passwordHash
  );
  if (!matches) {
    logger.warn("account.password_change_rejected", { userId: user.id });
    return { ok: false, error: "Текущий пароль указан неверно" };
  }

  const strength = checkPassword(input.newPassword ?? "");
  if (!strength.ok) return { ok: false, error: strength.message };

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: "Пароли не совпадают" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(input.newPassword, 12),
      // Signs out every other device. A JWT session cannot be revoked on its
      // own, so the token callback compares its issue time against this — which
      // is the behaviour someone expects when they change a password because
      // they think somebody else has it.
      passwordChangedAt: new Date(),
    },
  });

  logger.info("account.password_changed", { userId: user.id });
  return { ok: true };
}
