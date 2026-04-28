"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
          });
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          if (!response.ok) {
            setError(payload?.error?.message ?? "No se pudo restablecer la contraseña.");
            return;
          }
          setMessage("Contraseña actualizada. Redirigiendo al login...");
          setTimeout(() => router.push("/login"), 1000);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="Nueva contraseña"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="Repite tu contraseña"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
