import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats, messages } from "@/lib/db/schema";
import { handleRouteError, parseUuidParam } from "@/lib/http/route";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const params = await context.params;
    const chatId = parseUuidParam(params, "id", "Invalid chat id");
    if (chatId instanceof NextResponse) {
      return chatId;
    }

    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
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
      .where(and(eq(messages.chatId, chatId), eq(messages.userId, userId)))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch chat messages");
  }
}
