import { and, count, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { analyticsEvents, authAttempts } from "@/lib/db/schema";

export async function GET() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const [registerSuccess] = await db
    .select({ total: count() })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.eventName, "register_success"), gte(analyticsEvents.createdAt, since)));
  const [registerFailed] = await db
    .select({ total: count() })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.eventName, "register_failed"), gte(analyticsEvents.createdAt, since)));
  const [loginSuccess] = await db
    .select({ total: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.succeeded, true), gte(authAttempts.createdAt, since)));
  const [loginFailed] = await db
    .select({ total: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.succeeded, false), gte(authAttempts.createdAt, since)));

  const registerTotal = (registerSuccess?.total ?? 0) + (registerFailed?.total ?? 0);
  const loginTotal = (loginSuccess?.total ?? 0) + (loginFailed?.total ?? 0);

  return NextResponse.json({
    window: "24h",
    registerSuccessRate: registerTotal ? Number(((registerSuccess?.total ?? 0) / registerTotal).toFixed(4)) : 0,
    loginSuccessRate: loginTotal ? Number(((loginSuccess?.total ?? 0) / loginTotal).toFixed(4)) : 0,
    totals: {
      registerSuccess: registerSuccess?.total ?? 0,
      registerFailed: registerFailed?.total ?? 0,
      loginSuccess: loginSuccess?.total ?? 0,
      loginFailed: loginFailed?.total ?? 0,
    },
  });
}
