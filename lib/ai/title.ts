import { generateText } from "ai";
import { getChatModel } from "@/lib/ai/client";

function normalizeTitle(text: string): string {
  return text
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 160)
    .trim();
}

export async function generateChatTitle(input: {
  userMessage: string;
  assistantMessage: string;
}): Promise<string> {
  const { text } = await generateText({
    model: getChatModel(),
    system:
      "Genera un titulo muy breve para una conversacion. Reglas: 3 a 8 palabras, sin comillas, sin punto final, en espanol neutro y descriptivo.",
    prompt: [
      `Mensaje del usuario: ${input.userMessage}`,
      `Respuesta del asistente: ${input.assistantMessage}`,
      "Devuelve solo el titulo.",
    ].join("\n"),
  });

  const normalized = normalizeTitle(text);
  return normalized || "New chat";
}
