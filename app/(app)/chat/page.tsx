import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { chats } from "@/lib/db/schema";

type PageProps = {
  searchParams: Promise<{ new?: string }>;
};

export default async function ChatPage({ searchParams }: PageProps) {
  const userId = await requireUser();
  const { new: createNewChat } = await searchParams;
  const shouldOpenDraftChat = createNewChat === "1";
  const latestChat = await db.query.chats.findFirst({
    where: eq(chats.userId, userId),
    orderBy: [desc(chats.updatedAt)],
  });

  if (latestChat && !shouldOpenDraftChat) {
    redirect(`/chat/${latestChat.id}`);
  }

  return (
    <section className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col space-y-4">
      <ChatShell key="draft-chat" initialMessages={[]} />
    </section>
  );
}
