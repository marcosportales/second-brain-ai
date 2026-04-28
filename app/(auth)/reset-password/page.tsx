import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const safeToken = token ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Restablecer contraseña</h1>
      <p className="mb-4 text-sm text-zinc-600">Ingresa una nueva contraseña para tu cuenta.</p>
      {safeToken ? (
        <ResetPasswordForm token={safeToken} />
      ) : (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          El enlace no es válido. Solicita uno nuevo desde recuperación de contraseña.
        </p>
      )}
      <Link href="/forgot-password" className="mt-4 text-sm text-zinc-600 hover:underline">
        Solicitar un nuevo enlace
      </Link>
    </main>
  );
}
