import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { getClientIp } from "@/lib/security/ip";
import { assertAuthAttemptAllowed, logAuthAttempt } from "@/lib/security/auth-abuse";
import { trackEvent } from "@/lib/observability/events";
import { logger } from "@/lib/observability/logger";

export const authConfig = {
  adapter: DrizzleAdapter(db),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          await trackEvent("login_failed", { reason: "invalid_payload" });
          return null;
        }
        const ip = getClientIp(request);
        await assertAuthAttemptAllowed(parsed.data.email, ip);

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        });
        if (!user?.passwordHash) {
          await logAuthAttempt(parsed.data.email, ip, false);
          await trackEvent("login_failed", { reason: "user_not_found" });
          return null;
        }

        if (!verifyPassword(parsed.data.password, user.passwordHash)) {
          await logAuthAttempt(parsed.data.email, ip, false);
          await trackEvent("login_failed", { reason: "invalid_credentials" }, user.id);
          return null;
        }
        if (!user.emailVerified) {
          await logAuthAttempt(parsed.data.email, ip, false);
          await trackEvent("login_failed", { reason: "email_not_verified" }, user.id);
          return null;
        }
        await logAuthAttempt(parsed.data.email, ip, true);
        await trackEvent("login_success", { provider: "credentials" }, user.id);
        logger.info("login_success", {
          route: "next-auth/authorize",
          userId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
