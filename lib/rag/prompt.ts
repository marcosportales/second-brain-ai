import type { RetrievedChunk } from "@/lib/rag/retrieval";

export type Citation = {
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  pageNumber: number | null;
  snippet: string;
};

export function buildRagSystemPrompt(): string {
  return [
    "Eres un asistente de Second Brain AI.",
    "Responde usando solo el contexto recuperado cuando exista evidencia.",
    "Si no hay evidencia suficiente, dilo explícitamente y sugiere qué documento falta.",
    "No inventes fuentes, páginas o datos.",
    "Mantén respuestas claras y concisas.",
  ].join("\n");
}

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "No hay contexto disponible.";
  return chunks
    .map(
      (chunk) =>
        `[[source:${chunk.id} doc:${chunk.documentId} page:${chunk.pageNumber ?? "unknown"}]]\n${chunk.content}`,
    )
    .join("\n\n");
}

export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    chunkId: chunk.id,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.pageNumber,
    snippet: chunk.content.slice(0, 220),
  }));
}
