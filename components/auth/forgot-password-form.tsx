"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; error?: { message?: string } }
            | null;
          if (!response.ok) {
            setError(payload?.error?.message ?? "No se pudo procesar la solicitud");
            return;
          }

          setMessage(
            payload?.message ??
              "Si el email existe, enviaremos instrucciones para recuperar la cuenta.",
          );
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}
