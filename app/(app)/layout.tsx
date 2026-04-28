import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AppNav } from "@/components/app/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="font-semibold">
              Second Brain AI
            </Link>
            <AppNav />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="w-full px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}
