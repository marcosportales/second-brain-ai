import { SearchPanel } from "@/components/search/search-panel";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { savedSearches } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function SearchPage() {
  const userId = await requireUser();
  const initialSaved = await db
    .select({
      id: savedSearches.id,
      query: savedSearches.query,
      tags: savedSearches.tags,
      sourceType: savedSearches.sourceType,
    })
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt))
    .limit(20);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Búsqueda</h1>
      <p className="text-sm text-zinc-600">
        Busca por nombre, filtra por tags y guarda tus consultas frecuentes.
      </p>
      <SearchPanel initialSaved={initialSaved} />
    </section>
  );
}
