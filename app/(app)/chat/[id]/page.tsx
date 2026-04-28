import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats, messages } from "@/lib/db/schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatByIdPage({ params }: PageProps) {
  const userId = await requireUser();
  const { id } = await params;

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, id), eq(chats.userId, userId)),
  });

  if (!chat) {
    notFound();
  }

  const initialMessages = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      status: messages.status,
      errorMessage: messages.errorMessage,
      citations: messages.citations,
    })
    .from(messages)
    .where(and(eq(messages.chatId, id), eq(messages.userId, userId)))
    .orderBy(asc(messages.createdAt));

  const normalizedMessages = initialMessages.map((message) => ({
    ...message,
    citations: Array.isArray(message.citations) ? message.citations : undefined,
    status: message.status ?? "ok",
    errorMessage: message.errorMessage ?? undefined,
  }));

  return (
    <section className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col space-y-4">
      <ChatShell key={id} initialMessages={normalizedMessages} initialChatId={id} />
    </section>
  );
}
