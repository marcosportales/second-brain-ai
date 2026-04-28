import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingProgress, markOnboardingStep } from "@/lib/onboarding/progress";
import { jsonError } from "@/lib/http/route";
import { trackEvent } from "@/lib/observability/events";

const payloadSchema = z.object({
  step: z.enum(["create_document", "tag_document", "first_search"]),
});

export async function GET() {
  const userId = await requireUser();
  const progress = await getOnboardingProgress(userId);
  return NextResponse.json(progress);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Paso de onboarding inválido", 400, "INVALID_STEP");
  }

  await markOnboardingStep(userId, parsed.data.step);
  await trackEvent("onboarding_step_complete", { step: parsed.data.step }, userId);
  return NextResponse.json({ ok: true });
}
