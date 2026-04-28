import { db } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import { logger } from "@/lib/observability/logger";

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown>,
  userId?: string | null,
) {
  try {
    await db.insert(analyticsEvents).values({
      userId: userId ?? null,
      eventName,
      properties,
    });
  } catch (error) {
    logger.warn("event_tracking_failed", {
      eventName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
