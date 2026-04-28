import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats, messages } from "@/lib/db/schema";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await requireUser();
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, parsed.data.id), eq(chats.userId, userId)),
    columns: { id: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      status: messages.status,
      errorMessage: messages.errorMessage,
      citations: messages.citations,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.chatId, parsed.data.id), eq(messages.userId, userId)))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(rows);
}
