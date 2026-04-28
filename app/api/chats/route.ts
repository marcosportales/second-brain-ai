import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats } from "@/lib/db/schema";

export async function GET() {
  const userId = await requireUser();

  const rows = await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));

  return NextResponse.json(rows);
}

export async function POST() {
  const userId = await requireUser();

  const [row] = await db
    .insert(chats)
    .values({
      userId,
      title: "New chat",
    })
    .returning({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    });

  return NextResponse.json(row, { status: 201 });
}
