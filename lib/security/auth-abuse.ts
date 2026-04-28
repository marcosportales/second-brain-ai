import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { authAttempts } from "@/lib/db/schema";
import { AppError } from "@/lib/errors/app-error";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_AFTER_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

export async function assertAuthAttemptAllowed(email: string, ip: string) {
  const now = Date.now();
  const windowStart = new Date(now - WINDOW_MS);

  const attempts = await db
    .select({
      succeeded: authAttempts.succeeded,
      createdAt: authAttempts.createdAt,
    })
    .from(authAttempts)
    .where(and(eq(authAttempts.email, email), eq(authAttempts.ip, ip), gte(authAttempts.createdAt, windowStart)))
    .orderBy(desc(authAttempts.createdAt))
    .limit(LOCK_AFTER_FAILED_ATTEMPTS);

  const failedAttempts = attempts.filter((attempt) => !attempt.succeeded);
  if (failedAttempts.length < LOCK_AFTER_FAILED_ATTEMPTS) {
    return;
  }

  const latest = failedAttempts[0]?.createdAt?.getTime() ?? 0;
  if (now - latest < LOCK_DURATION_MS) {
    throw new AppError("Demasiados intentos fallidos. Intenta nuevamente en unos minutos.", 429, "AUTH_TEMPORARILY_LOCKED");
  }
}

export async function logAuthAttempt(email: string, ip: string, succeeded: boolean) {
  await db.insert(authAttempts).values({
    email,
    ip,
    succeeded,
  });
}
