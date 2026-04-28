import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, verificationTokens } from "@/lib/db/schema";
import { AppError } from "@/lib/errors/app-error";

export async function createEmailVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });
  return { token, expires };
}

export async function consumeEmailVerificationToken(email: string, token: string) {
  const now = new Date();
  const verification = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, now),
    ),
  });

  if (!verification) {
    throw new AppError("Enlace de verificación inválido o expirado", 400, "VERIFICATION_TOKEN_INVALID");
  }

  await db.update(users).set({ emailVerified: now }).where(eq(users.email, email));
  await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)));
}
