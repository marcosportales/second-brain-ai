import { embed, embedMany } from "ai";
import { getEmbeddingModel } from "@/lib/ai/client";

const VECTOR_SIZE = 1536;

function fallbackEmbedding(text: string): number[] {
  const vector = new Array<number>(VECTOR_SIZE).fill(0);
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    const index = code % VECTOR_SIZE;
    vector[index] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export async function createEmbedding(value: string): Promise<number[]> {
  const model = getEmbeddingModel();
  if (!model) {
    return fallbackEmbedding(value);
  }

  const { embedding } = await embed({
    model,
    value,
  });
  return embedding;
}

export async function createEmbeddings(values: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  if (!model) {
    return values.map(fallbackEmbedding);
  }

  const { embeddings } = await embedMany({
    model,
    values,
  });
  return embeddings;
}
