import { PrismaClient } from "@/generated/prisma";

/**
 * A single PrismaClient per process.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * connection pool on every edit until the database refuses more clients.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
