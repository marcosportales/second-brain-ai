import { z } from "zod";
import { NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/auth/email-verification";
import { handleRouteError, jsonError } from "@/lib/http/route";

const schema = z.object({
  email: z.email(),
  token: z.string().min(20),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Parámetros inválidos", 400, "INVALID_PAYLOAD");
  }

  try {
    await consumeEmailVerificationToken(parsed.data.email, parsed.data.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "No se pudo verificar el email");
  }
}
