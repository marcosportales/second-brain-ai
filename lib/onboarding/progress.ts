import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userOnboarding, users } from "@/lib/db/schema";

export type OnboardingStep = "create_document" | "tag_document" | "first_search";

export async function getOnboardingProgress(userId: string) {
  const [progress] = await db
    .insert(userOnboarding)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  const row =
    progress ??
    (await db.query.userOnboarding.findFirst({
      where: eq(userOnboarding.userId, userId),
    }));

  return {
    createDocumentDone: Boolean(row?.createdFirstDocumentAt),
    tagDocumentDone: Boolean(row?.taggedFirstDocumentAt),
    firstSearchDone: Boolean(row?.firstSearchAt),
    completedAt: row?.completedAt ?? null,
  };
}

export async function markOnboardingStep(userId: string, step: OnboardingStep) {
  await db.insert(userOnboarding).values({ userId }).onConflictDoNothing();
  const now = new Date();
  const values =
    step === "create_document"
      ? { createdFirstDocumentAt: now, updatedAt: now }
      : step === "tag_document"
        ? { taggedFirstDocumentAt: now, updatedAt: now }
        : { firstSearchAt: now, updatedAt: now };

  await db.update(userOnboarding).set(values).where(eq(userOnboarding.userId, userId));

  const updated = await db.query.userOnboarding.findFirst({
    where: eq(userOnboarding.userId, userId),
  });

  if (
    updated?.createdFirstDocumentAt &&
    updated.taggedFirstDocumentAt &&
    updated.firstSearchAt &&
    !updated.completedAt
  ) {
    await db
      .update(userOnboarding)
      .set({ completedAt: now, updatedAt: now })
      .where(eq(userOnboarding.userId, userId));
    await db
      .update(users)
      .set({ onboardingCompletedAt: now })
      .where(eq(users.id, userId));
  }
}
