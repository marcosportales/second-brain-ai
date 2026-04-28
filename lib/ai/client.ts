import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/lib/env";

export const openaiProvider = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const ollamaProvider = createOpenAI({
  baseURL: `${env.OLLAMA_BASE_URL.replace(/\/$/, "")}/v1`,
  apiKey: "ollama",
});

export function getChatModel() {
  if (env.AI_PROVIDER === "ollama") {
    return ollamaProvider(env.OLLAMA_CHAT_MODEL);
  }
  return openaiProvider(env.OPENAI_CHAT_MODEL);
}

export function getEmbeddingModel() {
  if (env.AI_PROVIDER === "ollama" && env.OLLAMA_EMBEDDING_MODEL) {
    return ollamaProvider.textEmbeddingModel(env.OLLAMA_EMBEDDING_MODEL);
  }
  if (env.AI_PROVIDER === "openai") {
    return openaiProvider.textEmbeddingModel(env.OPENAI_EMBEDDING_MODEL);
  }
  return null;
}
