import { desc, eq } from "drizzle-orm";
import { DocumentManager } from "@/components/documents/document-manager";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export default async function DocumentsPage() {
  const userId = await requireUser();
  const rows = await db
    .select({
      id: documents.id,
      name: documents.name,
      status: documents.status,
      parseError: documents.parseError,
      size: documents.size,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Documentos</h1>
      <DocumentManager initialDocuments={rows} />
    </section>
  );
}
