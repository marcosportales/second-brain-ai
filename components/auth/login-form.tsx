"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await signIn("credentials", {
          email,
          password,
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
      <h2 className="text-xl font-semibold">Iniciar sesión</h2>
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
        placeholder="********"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
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
