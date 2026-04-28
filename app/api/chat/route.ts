import { streamText } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateChatTitle } from "@/lib/ai/title";
import { AppError } from "@/lib/errors/app-error";
import { db } from "@/lib/db/client";
import { chats, messages } from "@/lib/db/schema";
import { getRequestId, handleRouteError, jsonError } from "@/lib/http/route";
import { requireUser } from "@/lib/auth/session";
import { getChatModel } from "@/lib/ai/client";
import { retrieveRelevantChunks } from "@/lib/rag/retrieval";
import { buildContextBlock, buildRagSystemPrompt, toCitations } from "@/lib/rag/prompt";
import { logger } from "@/lib/observability/logger";
import { assertRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  chatId: z.string().uuid().optional(),
  message: z
    .union([
      z.string().min(1),
      z.object({
        text: z.string().min(1),
      }),
    ])
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string().optional(),
        parts: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

function extractUserMessage(payload: z.infer<typeof bodySchema>): string | null {
  if (typeof payload.message === "string") return payload.message.trim();
  if (payload.message?.text) return payload.message.text.trim();

  const lastUserMessage = [...(payload.messages ?? [])]
    .reverse()
    .find((message) => message.role === "user");
  if (!lastUserMessage) return null;

  const fromContent = lastUserMessage.content?.trim();
  if (fromContent) return fromContent;

  const fromParts = lastUserMessage.parts
    ?.filter((part) => part.type === "text" && part.text)
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return fromParts || null;
}

function getFriendlyChatErrorMessage(): string {
  return "Hubo un problema generando la respuesta. Intenta de nuevo en unos segundos.";
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let userIdForError: string | null = null;
  let chatIdForError: string | null = null;
  const startedAt = Date.now();
  try {
    const userId = await requireUser();
    userIdForError = userId;
    assertRateLimit(`chat:${userId}`, { limit: 30, windowMs: 60_000 });
    const url = new URL(request.url);
    const chatIdFromQuery = url.searchParams.get("chatId");

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid payload", 400, "INVALID_PAYLOAD", requestId);
    }
    const userMessage = extractUserMessage(parsed.data);
    if (!userMessage) {
      return jsonError("Message is required", 400, "MESSAGE_REQUIRED", requestId);
    }

    let chatId = chatIdFromQuery ?? parsed.data.chatId;
    if (!chatId) {
      const [newChat] = await db
        .insert(chats)
        .values({ userId, title: userMessage.slice(0, 60) })
        .returning({ id: chats.id });
      chatId = newChat.id;
    }
    chatIdForError = chatId;

    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    });

    if (!chat) {
      return jsonError("Chat not found", 404, "CHAT_NOT_FOUND", requestId);
    }

    const hasPreviousMessages = await db.query.messages.findFirst({
      where: and(eq(messages.chatId, chatId), eq(messages.userId, userId)),
      columns: { id: true },
    });

    await db.insert(messages).values({
      chatId,
      userId,
      role: "user",
      content: userMessage,
      status: "ok",
    });
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

    const chunks = await retrieveRelevantChunks(userId, userMessage);
    const contextBlock = buildContextBlock(chunks);
    const citations = toCitations(chunks);
    const shouldGenerateTitle = chat.title === "New chat" && !hasPreviousMessages;

    const result = streamText({
      model: getChatModel(),
      system: buildRagSystemPrompt(),
      prompt: `Contexto recuperado:\n${contextBlock}\n\nPregunta del usuario:\n${userMessage}`,
      onFinish: async ({ text, usage }) => {
        await db.insert(messages).values({
          chatId,
          userId,
          role: "assistant",
          content: text,
          status: "ok",
          citations,
          tokenUsage: {
            promptTokens: usage.inputTokens,
            completionTokens: usage.outputTokens,
          },
        });
        await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

        if (shouldGenerateTitle) {
          try {
            const title = await generateChatTitle({
              userMessage,
              assistantMessage: text,
            });
            await db.update(chats).set({ title }).where(eq(chats.id, chatId));
          } catch (titleError) {
            logger.warn("chat_title_generation_failed", {
              chatId,
              userId,
              error: titleError instanceof Error ? titleError.message : "Unknown error",
            });
          }
        }
      },
    });

    logger.info("chat_response_streamed", {
      requestId,
      route: "/api/chat",
      chatId,
      userId,
      chunks: chunks.length,
      latencyMs: Date.now() - startedAt,
    });
    return result.toUIMessageStreamResponse({
      headers: {
        "x-chat-id": chatId,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    if (
      userIdForError &&
      chatIdForError &&
      !(error instanceof AppError)
    ) {
      try {
        await db.insert(messages).values({
          chatId: chatIdForError,
          userId: userIdForError,
          role: "assistant",
          content: getFriendlyChatErrorMessage(),
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Unexpected error",
        });
        await db
          .update(chats)
          .set({ updatedAt: new Date() })
          .where(eq(chats.id, chatIdForError));
      } catch (persistError) {
        logger.warn("chat_error_persist_failed", {
          chatId: chatIdForError,
          userId: userIdForError,
          error: persistError instanceof Error ? persistError.message : "Unknown error",
        });
      }
    }

    logger.error("chat_route_failed", {
      requestId,
      route: "/api/chat",
      userId: userIdForError,
      chatId: chatIdForError,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return handleRouteError(error, getFriendlyChatErrorMessage());
  }
}
