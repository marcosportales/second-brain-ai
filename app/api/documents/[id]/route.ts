import { eq, and } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
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
