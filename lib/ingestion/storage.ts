import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadsRoot = path.join(process.cwd(), "uploads");

export async function saveFileLocally(file: File): Promise<string> {
  await mkdir(uploadsRoot, { recursive: true });
  const extension = file.name.split(".").pop() ?? "txt";
  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsRoot, filename);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  return filePath;
}
