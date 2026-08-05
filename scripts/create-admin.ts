/**
 * Promotes an account to administrator, creates one, or resets its password.
 *
 * This is the only supported way to mint an admin. There is deliberately no
 * "register as admin" path in the application: the role lives in the database
 * and is never settable from the browser.
 *
 *   npm run admin:create -- admin@kapibara.ru "Имя Фамилия" "СильныйПароль1"
 *
 * If the address already exists it is promoted, and the password argument is
 * ignored — changing a password is a separate, explicit act:
 *
 *   npm run admin:create -- admin@kapibara.ru --reset-password "НовыйПароль1"
 *
 * A reset also stamps `passwordChangedAt`, which invalidates every session
 * already issued to that account. That is the point: the reason to reset an
 * administrator's password is usually that someone else may hold the old one.
 *
 * Omit the password on any path and it is read from the terminal instead, so it
 * never enters the shell history.
 */
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";

const db = new PrismaClient();

/** Matches the rule enforced on the registration form. */
function rejectWeakPassword(password: string | undefined): asserts password is string {
  if (
    !password ||
    password.length < 8 ||
    !/\d/.test(password) ||
    !/\p{L}/u.test(password)
  ) {
    console.error(
      "Пароль должен содержать не менее 8 символов, включая букву и цифру."
    );
    process.exit(1);
  }
}

async function promptPassword(label: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(label);
  rl.close();
  return answer;
}

async function main() {
  const args = process.argv.slice(2);

  const resetIndex = args.indexOf("--reset-password");
  const resetting = resetIndex !== -1;
  if (resetting) args.splice(resetIndex, 1);

  const [emailArg, ...rest] = args;

  if (!emailArg) {
    console.error(
      'Usage: npm run admin:create -- <email> "<Полное имя>" "<пароль>"\n' +
        "       npm run admin:create -- <email> --reset-password [пароль]"
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });

  // ── Password reset ─────────────────────────────────────────────────────────
  if (resetting) {
    if (!existing) {
      console.error(`Учётная запись ${email} не найдена.`);
      process.exit(1);
    }

    const password = rest[0] ?? (await promptPassword("Новый пароль: "));
    rejectWeakPassword(password);

    await db.user.update({
      where: { email },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        // Cuts every session issued before this moment.
        passwordChangedAt: new Date(),
      },
    });

    console.log(`✔ Пароль изменён: ${email}`);
    console.log("  Все активные сессии этой учётной записи завершены.");
    return;
  }

  // ── Promotion ──────────────────────────────────────────────────────────────
  if (existing) {
    if (existing.role === "admin") {
      console.log(`• ${email} уже администратор — изменений не требуется.`);
      console.log("  Чтобы сменить пароль: npm run admin:create -- " + email + " --reset-password");
      return;
    }
    await db.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`✔ ${email} повышен до администратора.`);
    return;
  }

  // ── Creation ───────────────────────────────────────────────────────────────
  const [nameArg, passwordArg] = rest;
  const password =
    passwordArg ?? (await promptPassword("Пароль для нового администратора: "));
  rejectWeakPassword(password);

  await db.user.create({
    data: {
      email,
      fullName: nameArg?.trim() || "Администратор",
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
      // Bootstrap accounts skip the email round-trip.
      emailVerified: new Date(),
    },
  });

  console.log(`✔ Администратор создан: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
