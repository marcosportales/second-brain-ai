import { eq, and } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { handleRouteError, parseUuidParam } from "@/lib/http/route";

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const params = await context.params;
    const documentId = parseUuidParam(params, "id", "Invalid document id");
    if (documentId instanceof NextResponse) {
      return documentId;
    }

    const [document] = await db
      .select({
        id: documents.id,
        storagePath: documents.storagePath,
      })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    try {
      await unlink(document.storagePath);
    } catch (error: unknown) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        return NextResponse.json(
          { error: "Failed to delete file from storage" },
          { status: 500 },
        );
      }
    }

    await db
      .delete(documents)
      .where(and(eq(documents.id, document.id), eq(documents.userId, userId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete document");
  }
}

const patchBodySchema = z.object({
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const params = await context.params;
    const documentId = parseUuidParam(params, "id", "Invalid document id");
    if (documentId instanceof NextResponse) {
      return documentId;
    }
    const parsed = patchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const [updated] = await db
      .update(documents)
      .set({
        tags: parsed.data.tags,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
      .returning({
        id: documents.id,
        tags: documents.tags,
      });

    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error, "Failed to update document");
  }
}
