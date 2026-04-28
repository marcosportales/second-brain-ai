"use client";

import { useState } from "react";
import { registerSchema } from "@/lib/auth/schemas";

function getPasswordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  return score;
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const passwordScore = getPasswordScore(password);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = registerSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          const nextErrors: { name?: string; email?: string; password?: string } = {};
          for (const issue of parsed.error.issues) {
            const field = issue.path[0];
            if (field === "name") nextErrors.name = issue.message;
            if (field === "email") nextErrors.email = issue.message;
            if (field === "password") nextErrors.password = issue.message;
          }
          setFieldErrors(nextErrors);
          return;
        }

        setFieldErrors({});
        setMessage(null);
        setIsLoading(true);
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        setIsLoading(false);
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setMessage(response.ok ? "Cuenta creada. Ya puedes iniciar sesión." : payload?.error?.message ?? "No se pudo crear la cuenta.");
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
      {fieldErrors.name ? <p className="text-xs text-red-600">{fieldErrors.name}</p> : null}
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded bg-zinc-200">
          <div
            className="h-full rounded bg-zinc-900 transition-all"
            style={{ width: `${(passwordScore / 4) * 100}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">
          Fortaleza de contraseña: {passwordScore <= 1 ? "baja" : passwordScore <= 3 ? "media" : "alta"}
        </p>
      </div>
      {fieldErrors.password ? <p className="text-xs text-red-600">{fieldErrors.password}</p> : null}
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
