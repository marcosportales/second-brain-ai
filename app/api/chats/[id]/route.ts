import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats } from "@/lib/db/schema";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await requireUser();
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(chats)
    .where(and(eq(chats.id, parsed.data.id), eq(chats.userId, userId)))
    .returning({ id: chats.id });

  if (!deleted) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
