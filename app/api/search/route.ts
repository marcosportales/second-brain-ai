import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { trackEvent } from "@/lib/observability/events";
import { markOnboardingStep } from "@/lib/onboarding/progress";

const querySchema = z.object({
  q: z.string().trim().default(""),
  tag: z.string().trim().optional(),
  type: z.string().trim().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export async function GET(request: Request) {
  const userId = await requireUser();
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    tag: searchParams.get("tag") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const { q, tag, type, from, to } = parsed.data;
  const searchTerm = q.trim();

  const conditions = [eq(documents.userId, userId)];
  if (searchTerm) {
    conditions.push(or(ilike(documents.name, `%${searchTerm}%`), ilike(documents.parseError, `%${searchTerm}%`))!);
  }
  if (type) {
    conditions.push(eq(documents.sourceType, type));
  }
  if (tag) {
    conditions.push(ilike(documents.tags, `%${tag.toLowerCase()}%`) as never);
  }
  if (from) {
    conditions.push(gte(documents.createdAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(documents.createdAt, new Date(to)));
  }

  const rows = await db
    .select({
      id: documents.id,
      name: documents.name,
      status: documents.status,
      sourceType: documents.sourceType,
      tags: documents.tags,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt))
    .limit(50);

  await markOnboardingStep(userId, "first_search");
  await trackEvent("search_executed", {
    query: searchTerm,
    tag,
    type,
    results: rows.length,
  }, userId);

  return NextResponse.json(rows);
}
