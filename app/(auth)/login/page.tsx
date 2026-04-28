import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
      <section className="flex flex-col justify-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Second Brain AI</h1>
        <p className="text-zinc-600">
          Sube documentos, haz preguntas y obtén respuestas con citas y streaming.
        </p>
        <Link href="/" className="text-sm text-zinc-500 underline">
          Volver al inicio
        </Link>
      </section>
      <section className="space-y-4">
        <LoginForm />
        <RegisterForm />
      </section>
    </main>
  );
}
