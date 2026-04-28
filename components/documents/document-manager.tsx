"use client";

import { useMemo, useRef, useState } from "react";

type DocumentItem = {
  id: string;
  name: string;
  status: string;
  parseError: string | null;
  size: number;
  createdAt: string | Date;
};

export function DocumentManager({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [queue, setQueue] = useState<Array<{ key: string; name: string; status: string; error?: string }>>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<DocumentItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const response = await fetch("/api/documents");
    if (response.ok) {
      setDocuments(await response.json());
    }
  }

  function formatFileSize(size: number) {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.ceil(size / 1024)} KB`;
  }

  function formatDate(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Fecha desconocida";
    }

    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const queueInProgress = useMemo(
    () => queue.some((item) => item.status === "subiendo" || item.status === "indexando"),
    [queue],
  );

  async function processFiles(files: FileList | File[]) {
    const toProcess = Array.from(files);
    if (toProcess.length === 0 || isUploading) {
      return;
    }

    setGlobalError(null);
    setIsUploading(true);
    const queueItems = toProcess.map((file) => ({
      key: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
      name: file.name,
      status: "pendiente",
    }));
    setQueue(queueItems);

    for (const [index, file] of toProcess.entries()) {
      const queueKey = queueItems[index]?.key;
      if (!queueKey) {
        continue;
      }

      setQueue((previous) =>
        previous.map((item) => (item.key === queueKey ? { ...item, status: "subiendo", error: undefined } : item)),
      );

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        let message = "No se pudo subir el archivo";
        try {
          const payload = await uploadResponse.json();
          if (payload?.error && typeof payload.error === "string") {
            message = payload.error;
          }
        } catch {}

        setQueue((previous) =>
          previous.map((item) => (item.key === queueKey ? { ...item, status: "error", error: message } : item)),
        );
        continue;
      }

      const uploaded = await uploadResponse.json();
      setQueue((previous) => previous.map((item) => (item.key === queueKey ? { ...item, status: "indexando" } : item)));

      const indexResponse = await fetch(`/api/documents/${uploaded.id}/index`, { method: "POST" });
      if (!indexResponse.ok) {
        let message = "No se pudo indexar el archivo";
        try {
          const payload = await indexResponse.json();
          if (payload?.error && typeof payload.error === "string") {
            message = payload.error;
          }
        } catch {}

        setQueue((previous) =>
          previous.map((item) => (item.key === queueKey ? { ...item, status: "error", error: message } : item)),
        );
        continue;
      }

      setQueue((previous) => previous.map((item) => (item.key === queueKey ? { ...item, status: "completado" } : item)));
    }

    await refresh();
    setIsUploading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function deleteDocument(document: DocumentItem) {
    setGlobalError(null);
    setDeletingId(document.id);
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!response.ok) {
      let message = "No se pudo eliminar el documento";
      try {
        const payload = await response.json();
        if (payload?.error && typeof payload.error === "string") {
          message = payload.error;
        }
      } catch {}
      setGlobalError(message);
      return;
    }

    setDeleteCandidate(null);
    await refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start xl:gap-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 text-lg font-semibold">Subir documentos</h2>
        <p className="mb-3 text-sm text-zinc-600">Arrastra uno o varios archivos, o selecciónalos manualmente.</p>
        <div
          className={`rounded-xl border-2 border-dashed p-4 text-center transition sm:min-h-52 sm:p-5 ${
            isDragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-zinc-50/40"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void processFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-sm font-medium text-zinc-800">Suelta tus archivos aquí</p>
          <p className="mt-1 text-xs text-zinc-500">PDF, DOCX, TXT, MD</p>
          <button
            type="button"
            className="mt-4 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 sm:w-auto"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            Seleccionar archivos
          </button>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            name="file"
            multiple
            onChange={(event) => {
              if (event.currentTarget.files) {
                void processFiles(event.currentTarget.files);
              }
            }}
          />
        </div>

        {globalError ? <p className="mt-3 text-sm text-red-600">{globalError}</p> : null}
        {isUploading ? <p className="mt-3 text-sm text-zinc-600">Procesando cola de subida...</p> : null}

        {queue.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {queue.map((item) => (
              <li key={item.key} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                  <span className="w-fit rounded bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-700">
                    {item.status}
                  </span>
                </div>
                {item.error ? (
                  <p className="mt-2 overflow-x-hidden rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 break-all">
                    {item.error}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-lg font-semibold">Tus documentos</h2>
          {queueInProgress ? <p className="text-xs text-zinc-500">Hay archivos en proceso</p> : null}
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no has subido documentos.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="rounded-md border border-zinc-200 px-3 py-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{document.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatFileSize(document.size)} - {formatDate(document.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        document.status === "indexed"
                          ? "bg-emerald-100 text-emerald-700"
                          : document.status === "error"
                            ? "bg-red-100 text-red-700"
                            : document.status === "parsing"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {document.status}
                    </span>
                    <button
                      type="button"
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                      onClick={() => setDeleteCandidate(document)}
                      disabled={deletingId === document.id}
                    >
                      {deletingId === document.id ? "Eliminando..." : "Borrar"}
                    </button>
                  </div>
                </div>
                {document.parseError ? (
                  <p className="mt-2 max-h-24 overflow-x-hidden overflow-y-auto rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 break-all">
                    {document.parseError}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl sm:p-5">
            <h3 className="text-lg font-semibold">Confirmar borrado</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Vas a eliminar <span className="font-medium text-zinc-900">{deleteCandidate.name}</span> de forma
              permanente.
            </p>
            <p className="mt-1 text-sm text-zinc-500">Esta acción borrará también su contenido indexado.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 sm:w-auto"
                onClick={() => setDeleteCandidate(null)}
                disabled={deletingId === deleteCandidate.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                onClick={() => void deleteDocument(deleteCandidate)}
                disabled={deletingId === deleteCandidate.id}
              >
                {deletingId === deleteCandidate.id ? "Eliminando..." : "Sí, borrar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
