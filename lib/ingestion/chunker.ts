export type ChunkResult = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
};

export function chunkText(
  text: string,
  options: { chunkSize?: number; overlap?: number } = {},
): ChunkResult[] {
  const chunkSize = options.chunkSize ?? 1200;
  const overlap = options.overlap ?? 150;
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) return [];

  const chunks: ChunkResult[] = [];
  let cursor = 0;
  let idx = 0;

  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + chunkSize);
    const slice = normalized.slice(cursor, end).trim();
    if (slice.length) {
      chunks.push({
        chunkIndex: idx,
        content: slice,
        tokenCount: Math.ceil(slice.length / 4),
      });
      idx += 1;
    }
    cursor += Math.max(1, chunkSize - overlap);
  }

  return chunks;
}
