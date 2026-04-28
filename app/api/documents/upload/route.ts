import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { saveFileLocally } from "@/lib/ingestion/storage";
import { env } from "@/lib/env";

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

export async function POST(request: Request) {
  const userId = await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const path = await saveFileLocally(file);
  const [record] = await db
    .insert(documents)
    .values({
      userId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      storagePath: path,
      status: "uploaded",
    })
    .returning({
      id: documents.id,
      name: documents.name,
      status: documents.status,
    });

  return NextResponse.json(record);
}
