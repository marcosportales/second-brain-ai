import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/errors/app-error";

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, email: true },
  });

  // Keep response shape consistent to avoid user enumeration.
  if (!user?.email) {
    return null;
  }

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return {
    token: rawToken,
    userEmail: user.email,
    expiresAt,
  };
}

export async function consumePasswordResetToken(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.consumedAt),
      gt(passwordResetTokens.expiresAt, now),
    ),
  });

  if (!resetToken) {
    throw new AppError("El token de recuperación es inválido o expiró", 400, "RESET_TOKEN_INVALID");
  }

  await db
    .update(users)
    .set({
      passwordHash: hashPassword(newPassword),
    })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(eq(passwordResetTokens.id, resetToken.id));
}
