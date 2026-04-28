import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { indexDocumentForUser } from "@/lib/ingestion/indexer";
import { handleRouteError, parseUuidParam } from "@/lib/http/route";

export async function POST(
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

    await indexDocumentForUser(documentId, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Failed to index document");
  }
}
