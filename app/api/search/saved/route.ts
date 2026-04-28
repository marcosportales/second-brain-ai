import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { savedSearches } from "@/lib/db/schema";

const bodySchema = z.object({
  query: z.string().trim().min(1).max(120),
  tags: z.array(z.string().trim().min(1).max(30)).default([]),
  sourceType: z.string().trim().optional(),
  fromDate: z.iso.datetime().optional(),
  toDate: z.iso.datetime().optional(),
});

export async function GET() {
  const userId = await requireUser();
  const rows = await db
    .select({
      id: savedSearches.id,
      query: savedSearches.query,
      tags: savedSearches.tags,
      sourceType: savedSearches.sourceType,
      fromDate: savedSearches.fromDate,
      toDate: savedSearches.toDate,
      createdAt: savedSearches.createdAt,
    })
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt))
    .limit(20);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const [saved] = await db
    .insert(savedSearches)
    .values({
      userId,
      query: parsed.data.query,
      tags: parsed.data.tags,
      sourceType: parsed.data.sourceType ?? null,
      fromDate: parsed.data.fromDate ? new Date(parsed.data.fromDate) : null,
      toDate: parsed.data.toDate ? new Date(parsed.data.toDate) : null,
    })
    .returning({
      id: savedSearches.id,
      query: savedSearches.query,
    });
  return NextResponse.json(saved, { status: 201 });
}
