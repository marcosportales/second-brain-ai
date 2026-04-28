import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats } from "@/lib/db/schema";
import { handleRouteError, parseUuidParam } from "@/lib/http/route";

export async function DELETE(
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

    const [deleted] = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .returning({ id: chats.id });

    if (!deleted) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete chat");
  }
}
