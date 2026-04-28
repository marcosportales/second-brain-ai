"use client";

import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        setIsLoading(false);
        setMessage(response.ok ? "Cuenta creada. Ya puedes iniciar sesión." : "No se pudo crear la cuenta.");
      }}
    >
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="text"
        placeholder="Nombre"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
      <button
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
