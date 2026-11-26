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
 * never enters the shell history — and it is not echoed, so it does not stay in
 * the terminal's scrollback either.
 *
 * The address is checked before anything is written. An administrator whose
 * address cannot receive mail cannot reset their own password, and the way
 * that happens in practice is the example line above being pasted in with its
 * placeholder still in place.
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

/**
 * An address a person can actually receive mail at.
 *
 * Narrow on purpose — ASCII, a dotted domain, a letters-only suffix. The one
 * thing this script must never do is mint an administrator whose password can
 * never be reset, and the way that happens in practice is the placeholder
 * from the usage line above being pasted in unchanged.
 */
const EMAIL_SHAPE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function rejectUnusableEmail(email: string): void {
  if (EMAIL_SHAPE.test(email)) return;
  console.error(
    `«${email}» не похоже на почтовый адрес.\n` +
      "Нужен настоящий: на него восстанавливают пароль, а другого входа в админку нет."
  );
  process.exit(1);
}

/**
 * Reads a password without putting it on the screen.
 *
 * readline echoes every keystroke, so a password answered at its prompt stays
 * visible and sits in the terminal's scrollback long after the command exits
 * — which is exactly where a password must never be. There is no "silent"
 * option, and the usual trick of overriding readline's internal writer stopped
 * working somewhere before Node 26, silently: the prompt looks the same and
 * the password is echoed anyway. So the keys are read directly instead, with
 * the terminal in raw mode, where nothing is echoed unless we echo it.
 *
 * With input piped in there is no terminal, no echo and nothing to hide, so
 * that path keeps using readline.
 */
async function promptPassword(label: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(label);
    rl.close();
    return answer;
  }

  // Raw mode first, prompt second. The terminal driver echoes what it
  // receives, and anything typed — or pasted — between printing the prompt
  // and switching modes would be echoed by the kernel before this process
  // ever sees it.
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdout.write(label);

  let value = "";
  try {
    outer: for await (const chunk of process.stdin) {
      for (const ch of chunk as string) {
        // Raw mode means the signal keys arrive as plain bytes: answer them
        // ourselves or the prompt cannot be escaped.
        if (ch === "\u0003" || ch === "\u0004") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\r" || ch === "\n") break outer;
        if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += ch;
      }
    }
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  process.stdout.write("\n");
  return value;
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
  rejectUnusableEmail(email);
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
