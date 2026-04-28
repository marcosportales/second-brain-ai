import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { registerSchema } from "@/lib/auth/schemas";
import { getClientIp } from "@/lib/security/ip";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestId, jsonError } from "@/lib/http/route";
import { trackEvent } from "@/lib/observability/events";
import { logger } from "@/lib/observability/logger";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  assertRateLimit(`register:${ip}`, { limit: 10, windowMs: 60_000 });
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 400, "INVALID_PAYLOAD", requestId);
  }
  const startedAt = Date.now();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });
  if (existing) {
    await trackEvent("register_failed", {
      reason: "email_already_exists",
      requestId,
    });
    return jsonError("Ya existe una cuenta con este email", 409, "EMAIL_EXISTS", requestId);
  }

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: hashPassword(parsed.data.password),
  });

  await trackEvent("register_success", {
    requestId,
    latencyMs: Date.now() - startedAt,
  }, userId);
  logger.info("register_success", {
    requestId,
    userId,
    route: "/api/auth/register",
    latencyMs: Date.now() - startedAt,
  });
  const verification = await createEmailVerificationToken(parsed.data.email);
  logger.info("email_verification_created", {
    requestId,
    userId,
    verificationUrl: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/verify-email?email=${encodeURIComponent(parsed.data.email)}&token=${verification.token}`,
    expiresAt: verification.expires.toISOString(),
  });

  return NextResponse.json({ ok: true, requestId });
}
