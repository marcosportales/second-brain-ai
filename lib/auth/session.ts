import { auth } from "@/auth";
import { AuthError } from "@/lib/errors/app-error";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError();
  }

  return session.user.id;
}
