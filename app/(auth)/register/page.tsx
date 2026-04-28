import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-8 text-zinc-100 sm:p-10">
          <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="inline-flex w-fit rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-300">
                Plataforma de conocimiento con IA
              </p>
              <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Crea tu cuenta en Second Brain AI
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Empieza a organizar conocimiento, consultar documentos con IA
                  y compartir respuestas confiables con tu equipo.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                Onboarding simple en pocos pasos.
              </div>
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                Privacidad y control de acceso por equipo.
              </div>
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                Respuestas con fuentes para validar rápido.
              </div>
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                Experiencia optimizada para trabajo diario.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Crear cuenta
            </h2>
            <p className="text-sm text-zinc-600">
              Completa tus datos para empezar a usar la plataforma.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-6 space-y-4 border-t border-zinc-200 pt-4">
            <p className="text-sm text-zinc-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 underline-offset-2 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
