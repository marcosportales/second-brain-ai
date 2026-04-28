import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Recuperar contraseña</h1>
      <p className="mb-4 text-sm text-zinc-600">
        Te enviaremos un enlace para restablecer el acceso a tu cuenta.
      </p>
      <ForgotPasswordForm />
      <Link href="/login" className="mt-4 text-sm text-zinc-600 hover:underline">
        Volver al login
      </Link>
    </main>
  );
}
