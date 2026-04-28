"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const hasValidParams = Boolean(email && token);
  const [message, setMessage] = useState("Verificando email...");
  const [isError, setIsError] = useState(!hasValidParams);

  useEffect(() => {
    if (!hasValidParams || !email || !token) {
      return;
    }

    const verify = async () => {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      setIsError(!response.ok);
      setMessage(response.ok ? "Email verificado. Ya puedes iniciar sesión." : "No se pudo verificar el email.");
    };
    void verify();
  }, [email, hasValidParams, token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Verificación de email</h1>
      <p className={`mb-4 text-sm ${isError ? "text-red-600" : "text-zinc-600"}`}>
        {hasValidParams ? message : "El enlace de verificación no es válido."}
      </p>
      <Link href="/login" className="text-sm text-zinc-600 hover:underline">
        Ir al login
      </Link>
    </main>
  );
}
