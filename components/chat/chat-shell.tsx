"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Citation = {
  documentId: string;
  chunkId: string;
  pageNumber: number | null;
  snippet: string;
};

type ServerMessage = {
  id: string;
  role: string;
  content: string;
  status?: string;
  errorMessage?: string;
  citations?: Citation[];
};

type ChatListItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMessageRow = {
  role: string;
  citations?: Citation[] | null;
};

export function ChatShell({
  initialMessages,
  initialChatId,
}: {
  initialMessages: ServerMessage[];
  initialChatId?: string;
}) {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(initialChatId);
  const [chatHistory, setChatHistory] = useState<ChatListItem[]>([]);
  const [latestAssistantCitations, setLatestAssistantCitations] = useState<Citation[]>([]);
  const [input, setInput] = useState("");
  const [chatToDelete, setChatToDelete] = useState<ChatListItem | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadChats = async () => {
      try {
        const response = await fetch("/api/chats", { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as ChatListItem[];
        setChatHistory(data);
      } catch {
        // Ignore aborted or transient fetch errors in UI shell.
      }
    };
    void loadChats();
    return () => controller.abort();
  }, [currentChatId]);

  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: currentChatId ? `/api/chat?chatId=${currentChatId}` : "/api/chat",
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const createdChatId = response.headers.get("x-chat-id");
        if (createdChatId && !currentChatId) {
          setCurrentChatId(createdChatId);
          router.replace(`/chat/${createdChatId}`);
          router.refresh();
        }
        return response;
      },
    }),
    messages: initialMessages.map((message) => ({
      id: message.id,
      role: message.role as "assistant" | "user" | "system",
      parts: [{ type: "text", text: message.content }],
    })),
  });

  useEffect(() => {
    if (!currentChatId || status !== "ready") return;
    const controller = new AbortController();
    const loadLatestCitations = async () => {
      try {
        const response = await fetch(`/api/chats/${currentChatId}/messages`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const rows = (await response.json()) as ChatMessageRow[];
        const latestAssistantWithCitations = [...rows]
          .reverse()
          .find((item) => item.role === "assistant" && Array.isArray(item.citations));
        setLatestAssistantCitations(latestAssistantWithCitations?.citations ?? []);
      } catch {
        // Ignore aborted or transient fetch errors in citations sidebar.
      }
    };
    void loadLatestCitations();
    return () => controller.abort();
  }, [currentChatId, status, messages.length]);

  const isThinking = status === "submitted" || status === "streaming";
  const initialMessageMeta = useMemo(
    () =>
      new Map(
        initialMessages.map((message) => [
          message.id,
          { status: message.status ?? "ok", errorMessage: message.errorMessage },
        ]),
      ),
    [initialMessages],
  );
  const latestMessages = useMemo(() => {
    return messages.map((message) => {
      const fromContent =
        "content" in message && typeof message.content === "string" ? message.content : "";
      const fromParts = message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join("");
      const persistedMeta = initialMessageMeta.get(message.id);
      return {
        id: message.id,
        role: message.role,
        content: fromContent || fromParts || "",
        status: persistedMeta?.status ?? "ok",
        errorMessage: persistedMeta?.errorMessage,
      };
    });
  }, [initialMessageMeta, messages]);

  const latestAssistant = useMemo(() => {
    const persisted = [...initialMessages].reverse().find((item) => item.role === "assistant");
    return {
      citations: latestAssistantCitations.length ? latestAssistantCitations : persisted?.citations,
    };
  }, [initialMessages, latestAssistantCitations]);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
      <aside className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Chats</h3>
          <button
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
            type="button"
            onClick={() => {
              setCurrentChatId(undefined);
              router.push("/chat?new=1");
            }}
          >
            Nuevo
          </button>
        </div>
        <ul className="space-y-2">
          {chatHistory.map((chat) => (
            <li key={chat.id}>
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  chat.id === currentChatId
                    ? "border-zinc-900 bg-zinc-100"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    className="min-w-0 flex-1 text-left"
                    type="button"
                    onClick={() => router.push(`/chat/${chat.id}`)}
                  >
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(chat.updatedAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setChatToDelete(chat);
                    }}
                    aria-label={`Eliminar chat ${chat.title}`}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-0 flex-col rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex-1 min-h-0 space-y-3 overflow-y-auto rounded-md border border-zinc-100 p-3">
          {latestMessages.length === 0 ? (
            <p className="text-sm text-zinc-500">Empieza haciendo una pregunta sobre tus documentos.</p>
          ) : null}
          {latestMessages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <article
                  className={`max-w-[85%] px-3 py-2 text-sm ${
                    isUser
                      ? "rounded-md bg-zinc-100"
                      : message.status === "error"
                        ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                        : "rounded-2xl rounded-bl-md bg-blue-50 px-4 py-3 shadow-sm"
                  }`}
                >
                  <p
                    className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${
                      isUser ? "text-zinc-500" : "text-zinc-500"
                    }`}
                  >
                    {isUser ? "Tú" : "Asistente"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.status === "error" && message.errorMessage ? (
                    <p className="mt-2 text-xs text-red-700">{message.errorMessage}</p>
                  ) : null}
                </article>
              </div>
            );
          })}
          {error ? (
            <article className="mr-auto max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase text-red-700">Asistente</p>
              <p className="whitespace-pre-wrap">
                Hubo un problema generando la respuesta. Intenta de nuevo en unos segundos.
              </p>
            </article>
          ) : null}
          {isThinking ? <p className="text-sm text-zinc-500">Thinking...</p> : null}
        </div>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = input.trim();
            if (!trimmed) return;
            sendMessage({ text: trimmed });
            setInput("");
          }}
        >
          <textarea
            className="min-h-24 w-full rounded-md border border-zinc-300 p-3 text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (!event.ctrlKey || event.key !== "Enter") return;
              event.preventDefault();
              const trimmed = input.trim();
              if (!trimmed) return;
              sendMessage({ text: trimmed });
              setInput("");
            }}
            placeholder="Pregunta algo sobre tus documentos..."
          />
          <div className="flex gap-2">
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white" type="submit">
              Enviar
            </button>
            <button
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
              type="button"
              onClick={() => {
                setInput("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>
      <aside className="hidden rounded-xl border border-zinc-200 bg-white p-4 xl:block">
        <h3 className="mb-3 text-sm font-semibold">Últimas citas</h3>
        {latestAssistant?.citations?.length ? (
          <ul className="space-y-2 text-xs">
            {latestAssistant.citations.map((citation) => (
              <li key={citation.chunkId} className="rounded border border-zinc-200 p-2">
                <p className="font-medium">Doc {citation.documentId}</p>
                <p>Página: {citation.pageNumber ?? "N/A"}</p>
                <p className="mt-1 text-zinc-600">{citation.snippet}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">Las citas aparecerán en respuestas guardadas.</p>
        )}
      </aside>
      {chatToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-base font-semibold">Confirmar borrado</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Esta accion eliminara la conversacion <span className="font-medium">{chatToDelete.title}</span>{" "}
              y sus mensajes. Esta accion no se puede deshacer.
            </p>
            {deleteError ? <p className="mt-2 text-sm text-red-700">{deleteError}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                type="button"
                disabled={isDeletingChat}
                onClick={() => {
                  setDeleteError(null);
                  setChatToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                type="button"
                disabled={isDeletingChat}
                onClick={async () => {
                  try {
                    setIsDeletingChat(true);
                    setDeleteError(null);
                    const response = await fetch(`/api/chats/${chatToDelete.id}`, {
                      method: "DELETE",
                    });
                    if (!response.ok) {
                      const payload = (await response.json().catch(() => null)) as
                        | { error?: string }
                        | null;
                      setDeleteError(payload?.error ?? "No se pudo borrar la conversacion.");
                      return;
                    }
                    setChatHistory((current) =>
                      current.filter((item) => item.id !== chatToDelete.id),
                    );
                    const deletedCurrentChat = chatToDelete.id === currentChatId;
                    setChatToDelete(null);
                    if (deletedCurrentChat) {
                      router.push("/chat");
                    }
                  } finally {
                    setIsDeletingChat(false);
                  }
                }}
              >
                {isDeletingChat ? "Borrando..." : "Si, borrar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
