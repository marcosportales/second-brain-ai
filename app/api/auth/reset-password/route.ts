import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/auth/schemas";
import { consumePasswordResetToken } from "@/lib/auth/reset-password";
import { handleRouteError, jsonError } from "@/lib/http/route";
import { trackEvent } from "@/lib/observability/events";

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
  }

  try {
    await consumePasswordResetToken(parsed.data.token, parsed.data.password);
    await trackEvent("password_reset_success", {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    await trackEvent("password_reset_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return handleRouteError(error, "No se pudo restablecer la contraseña");
  }
}
