"use client";

import Link from "next/link";
import { useMemo } from "react";

type Progress = {
  createDocumentDone: boolean;
  tagDocumentDone: boolean;
  firstSearchDone: boolean;
};

export function OnboardingChecklist({ progress }: { progress: Progress }) {
  const completed = useMemo(
    () => [progress.createDocumentDone, progress.tagDocumentDone, progress.firstSearchDone].filter(Boolean).length,
    [progress],
  );

  const items = [
    {
      id: "create_document",
      done: progress.createDocumentDone,
      label: "Sube tu primer documento",
      href: "/documents",
    },
    {
      id: "tag_document",
      done: progress.tagDocumentDone,
      label: "Agrega al menos una etiqueta",
      href: "/documents",
    },
    {
      id: "first_search",
      done: progress.firstSearchDone,
      label: "Haz tu primera búsqueda",
      href: "/search",
    },
  ];

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-xl font-semibold">Checklist de onboarding</h2>
        <p className="text-sm text-zinc-600">
          Completa {completed}/3 pasos para desbloquear tu flujo inicial.
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
            <p className="text-sm">
              <span className={`mr-2 inline-block size-2 rounded-full ${item.done ? "bg-emerald-500" : "bg-zinc-300"}`} />
              {item.label}
            </p>
            <Link href={item.href} className="text-sm text-zinc-700 hover:underline">
              {item.done ? "Ver" : "Completar"}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
