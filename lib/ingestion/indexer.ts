import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documentChunks, documents } from "@/lib/db/schema";
import { chunkText } from "@/lib/ingestion/chunker";
import { parseDocument } from "@/lib/ingestion/parsers";
import { logger } from "@/lib/observability/logger";
import { readFile } from "node:fs/promises";
import { createEmbeddings } from "@/lib/ai/embeddings";

export async function indexDocumentForUser(documentId: string, userId: string) {
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await db
    .update(documents)
    .set({ status: "parsing", updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  try {
    const buffer = await readFile(document.storagePath);
    const parsed = await parseDocument(Buffer.from(buffer), document.mimeType);
    const chunks = chunkText(parsed.text, { chunkSize: 1200, overlap: 180 });

    if (chunks.length === 0) {
      throw new Error("No text extracted from document");
    }

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));

    await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

    await db.insert(documentChunks).values(
      chunks.map((chunk, index) => ({
        documentId,
        userId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: 1,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[index],
      })),
    );

    await db
      .update(documents)
      .set({ status: "indexed", parseError: null, updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    logger.info("document_indexed", {
      documentId,
      userId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    await db
      .update(documents)
      .set({
        status: "error",
        parseError: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    logger.error("document_indexing_failed", {
      documentId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
