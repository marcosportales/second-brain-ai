import { eq, and } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await requireUser();
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const [document] = await db
    .select({
      id: documents.id,
      storagePath: documents.storagePath,
    })
    .from(documents)
    .where(and(eq(documents.id, parsed.data.id), eq(documents.userId, userId)))
    .limit(1);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    await unlink(document.storagePath);
  } catch (error: unknown) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      return NextResponse.json({ error: "Failed to delete file from storage" }, { status: 500 });
    }
  }

  await db.delete(documents).where(and(eq(documents.id, document.id), eq(documents.userId, userId)));

  return NextResponse.json({ ok: true });
}
