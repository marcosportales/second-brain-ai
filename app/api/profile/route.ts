import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  image: z.url().optional(),
});

export async function GET() {
  const userId = await requireUser();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, name: true, image: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const userId = await requireUser();
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.name,
      image: parsed.data.image ?? null,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      image: users.image,
    });
  return NextResponse.json(updated);
}
