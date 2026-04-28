import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export async function GET() {
  const userId = await requireUser();
  const rows = await db
    .select({
      id: documents.id,
      name: documents.name,
      status: documents.status,
      sourceType: documents.sourceType,
      tags: documents.tags,
      parseError: documents.parseError,
      size: documents.size,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json(rows);
}
