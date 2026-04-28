import { requireUser } from "@/lib/auth/session";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";

export default async function OnboardingPage() {
  const userId = await requireUser();
  const progress = await getOnboardingProgress(userId);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Bienvenido a tu espacio</h1>
      <p className="text-sm text-zinc-600">
        Sigue estos pasos para tener resultados útiles en minutos.
      </p>
      <OnboardingChecklist progress={progress} />
    </section>
  );
}
