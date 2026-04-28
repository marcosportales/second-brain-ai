import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { createPasswordResetToken } from "@/lib/auth/reset-password";
import { getRequestId, jsonError } from "@/lib/http/route";
import { getClientIp } from "@/lib/security/ip";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { logger } from "@/lib/observability/logger";
import { trackEvent } from "@/lib/observability/events";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  assertRateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 60_000 });
  const parsed = forgotPasswordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD", requestId);
  }

  const reset = await createPasswordResetToken(parsed.data.email);
  await trackEvent("forgot_password_requested", {
    requestId,
  });

  if (reset) {
    logger.info("password_reset_created", {
      requestId,
      userEmail: reset.userEmail,
      expiresAt: reset.expiresAt.toISOString(),
      // Placeholder while email delivery is not configured.
      resetUrl: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/reset-password?token=${reset.token}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Si el email existe, enviaremos instrucciones para recuperar la cuenta.",
    requestId,
  });
}
