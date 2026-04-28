import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "@/lib/db/client";
import { documentChunks } from "@/lib/db/schema";
import { createEmbedding } from "@/lib/ai/embeddings";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  score: number;
};

export async function retrieveRelevantChunks(
  userId: string,
  query: string,
  topK = env.RAG_TOP_K,
): Promise<RetrievedChunk[]> {
  const embedding = await createEmbedding(query);

  const similarity = sql<number>`1 - (${cosineDistance(documentChunks.embedding, embedding)})`;
  const rows = await db
    .select({
      id: documentChunks.id,
      documentId: documentChunks.documentId,
      content: documentChunks.content,
      pageNumber: documentChunks.pageNumber,
      chunkIndex: documentChunks.chunkIndex,
      score: similarity,
    })
    .from(documentChunks)
    .where(eq(documentChunks.userId, userId))
    .orderBy((t) => desc(t.score))
    .limit(topK);

  return rows;
}
