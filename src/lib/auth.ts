import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/validation";
import type { Role } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 * Authentication for Капибара.
 *
 * Sessions are JWTs in an httpOnly cookie (the strategy Credentials requires).
 * The user's role is copied into the token at sign-in and re-read from the
 * database on every request that calls `requireAdmin`, so a revoked admin can
 * never keep elevated access just by holding an old cookie.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,

  // Routes Auth.js's own output through the application logger, which redacts
  // tokens and personal data. Without this, provider errors print raw to the
  // console and can carry the contents of a session cookie.
  logger: {
    error(error) {
      // A cookie signed with a previous AUTH_SECRET cannot be decrypted. That
      // is the expected outcome of rotating the secret: the visitor is treated
      // as signed out and simply signs in again. Logging it at error level
      // would flood the logs for days after every rotation.
      if (
        error.name === "JWTSessionError" ||
        /no matching decryption secret/i.test(error.message)
      ) {
        logger.debug("auth.stale_session_cookie");
        return;
      }
      logger.error("auth.error", { name: error.name, reason: error.message });
    },
    warn(code) {
      logger.warn("auth.warning", { code });
    },
    debug(message) {
      logger.debug("auth.debug", { message });
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Электронная почта", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? normalizeEmail(raw.email) : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });

        // Compare against a dummy hash when the account is unknown so the
        // response takes the same time either way and cannot be used to probe
        // which addresses are registered.
        const hash =
          user?.passwordHash ??
          "$2b$12$0000000000000000000000000000000000000000000000000000";
        const ok = await bcrypt.compare(password, hash);

        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? "customer";
        // Issue time, used below to retire this token when the password moves.
        token.iat = Math.floor(Date.now() / 1000);
        return token;
      }

      // On every subsequent request, check the token against the account. A
      // JWT cannot be revoked server-side, so this comparison is what actually
      // ends a stolen session: change the password, and every token issued
      // before that moment stops being accepted.
      const uid = token.uid as string | undefined;
      if (!uid) return token;

      const account = await db.user.findUnique({
        where: { id: uid },
        select: { passwordChangedAt: true, role: true },
      });

      // Account deleted since the token was issued.
      if (!account) return { ...token, uid: undefined, role: undefined };

      if (
        account.passwordChangedAt &&
        typeof token.iat === "number" &&
        account.passwordChangedAt.getTime() > token.iat * 1000
      ) {
        return { ...token, uid: undefined, role: undefined };
      }

      // Role is refreshed here too, so a revoked administrator loses the
      // navigation immediately rather than at next sign-in. Every mutation
      // still re-reads the role from the database independently.
      token.role = account.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = ((token.role as string) ?? "customer") as Role;
      }
      return session;
    },
  },
});

// ─── Server-side guards ───────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/** The signed-in user, or null. Safe to call from server components. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  return {
    id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: (session.user.role ?? "customer") as Role,
  };
}

/**
 * Confirms the caller is an administrator by re-reading the role from the
 * database rather than trusting the session token alone.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return fresh?.role === "admin";
}
