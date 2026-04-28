import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { indexDocumentForUser } from "@/lib/ingestion/indexer";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await requireUser();
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  await indexDocumentForUser(parsed.data.id, userId);
  return NextResponse.json({ ok: true });
}
