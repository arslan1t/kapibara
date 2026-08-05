/**
 * Promotes an account to administrator, or creates one.
 *
 * This is the only supported way to mint an admin. There is deliberately no
 * "register as admin" path in the application: the role lives in the database
 * and is never settable from the browser.
 *
 *   npm run admin:create -- admin@kapibara.ru "Имя Фамилия" "СильныйПароль1"
 *
 * If the address already exists, the password argument is ignored and the
 * account is simply promoted.
 */
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";

const db = new PrismaClient();

async function main() {
  const [emailArg, nameArg, passwordArg] = process.argv.slice(2);

  if (!emailArg) {
    console.error(
      'Usage: npm run admin:create -- <email> "<Полное имя>" "<пароль>"'
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`• ${email} уже администратор — изменений не требуется.`);
      return;
    }
    await db.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`✔ ${email} повышен до администратора.`);
    return;
  }

  let password = passwordArg;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Пароль для нового администратора: ");
    rl.close();
  }

  if (!password || password.length < 8 || !/\d/.test(password) || !/\p{L}/u.test(password)) {
    console.error(
      "Пароль должен содержать не менее 8 символов, включая букву и цифру."
    );
    process.exit(1);
  }

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
