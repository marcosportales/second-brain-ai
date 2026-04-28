"use client";

import { useState } from "react";

type SearchRow = {
  id: string;
  name: string;
  status: string;
  sourceType: string;
  tags: string[];
  createdAt: string;
};

type SavedSearch = {
  id: string;
  query: string;
  tags: string[];
  sourceType: string | null;
};

export function SearchPanel({ initialSaved }: { initialSaved: SavedSearch[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [saved, setSaved] = useState<SavedSearch[]>(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  async function runSearch() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tag) params.set("tag", tag);
    if (type) params.set("type", type);
    const response = await fetch(`/api/search?${params.toString()}`);
    setIsLoading(false);
    if (!response.ok) return;
    const payload = (await response.json()) as SearchRow[];
    setResults(payload);
  }

  async function loadSavedSearches() {
    const response = await fetch("/api/search/saved");
    if (!response.ok) return;
    setSaved((await response.json()) as SavedSearch[]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre"
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            placeholder="Tag"
          />
          <select
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="document">Documentos</option>
            <option value="note">Notas</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={() => void runSearch()}
            disabled={isLoading}
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            onClick={async () => {
              if (!query.trim()) return;
              await fetch("/api/search/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query,
                  tags: tag ? [tag] : [],
                  sourceType: type || undefined,
                }),
              });
              void loadSavedSearches();
            }}
          >
            Guardar búsqueda
          </button>
        </div>
        <ul className="space-y-2">
          {results.length === 0 ? (
            <li className="rounded border border-dashed border-zinc-200 p-3 text-sm text-zinc-500">
              Sin resultados. Prueba con otro término o elimina filtros.
            </li>
          ) : (
            results.map((item) => (
              <li key={item.id} className="rounded border border-zinc-200 p-3">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500">
                  {item.sourceType} · {new Date(item.createdAt).toLocaleString()}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.tags.map((currentTag) => (
                    <span key={currentTag} className="rounded bg-zinc-100 px-2 py-0.5 text-xs">
                      #{currentTag}
                    </span>
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      <aside className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold">Búsquedas guardadas</h3>
        <ul className="space-y-2">
          {saved.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded border border-zinc-200 px-2 py-2 text-left text-xs hover:bg-zinc-50"
                onClick={() => {
                  setQuery(item.query);
                  setTag(item.tags[0] ?? "");
                  setType(item.sourceType ?? "");
                }}
              >
                <p className="font-medium">{item.query}</p>
                <p className="text-zinc-500">{item.sourceType ?? "todos"}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
