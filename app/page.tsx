import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Second Brain AI</h1>
      <p className="max-w-2xl text-zinc-600">
        Tu asistente para conversar con PDFs, docs y notas con RAG, streaming y citas.
      </p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white" href={session?.user ? "/chat" : "/login"}>
          {session?.user ? "Ir al chat" : "Empezar"}
        </Link>
        <Link className="rounded-md border border-zinc-300 px-4 py-2 text-sm" href="/documents">
          Ver documentos
        </Link>
      </div>
    </main>
  );
}
