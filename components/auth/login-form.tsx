"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setFieldErrors({});
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          const nextErrors: { email?: string; password?: string } = {};
          for (const issue of parsed.error.issues) {
            const field = issue.path[0];
            if (field === "email") nextErrors.email = issue.message;
            if (field === "password") nextErrors.password = issue.message;
          }
          setFieldErrors(nextErrors);
          return;
        }
        setIsLoading(true);

        const result = await signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: false,
        });
        setIsLoading(false);

        if (result?.error) {
          setError("Credenciales inválidas");
          return;
        }

        router.push("/chat");
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
      {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="********"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {fieldErrors.password ? <p className="text-xs text-red-600">{fieldErrors.password}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Link className="block text-sm text-zinc-600 hover:underline" href="/forgot-password">
        ¿Olvidaste tu contraseña?
      </Link>
      <button
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
