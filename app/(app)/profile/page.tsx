"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) return;
      const profile = (await response.json()) as { name?: string; image?: string };
      setName(profile.name ?? "");
      setImage(profile.image ?? "");
    };
    void loadProfile();
  }, []);

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-zinc-200 bg-white p-5">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <p className="mb-4 text-sm text-zinc-600">Actualiza tu identidad visible en el workspace.</p>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage(null);
          const response = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, image: image || undefined }),
          });
          setMessage(response.ok ? "Perfil actualizado" : "No se pudo actualizar");
        }}
      >
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
        />
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={image}
          onChange={(event) => setImage(event.target.value)}
          placeholder="URL de avatar (opcional)"
        />
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white" type="submit">
          Guardar cambios
        </button>
      </form>
    </section>
  );
}
