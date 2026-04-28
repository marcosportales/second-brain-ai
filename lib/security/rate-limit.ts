const buckets = new Map<string, { count: number; resetAt: number }>();

export function assertRateLimit(
  key: string,
  config: { limit: number; windowMs: number },
): void {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return;
  }

  if (current.count >= config.limit) {
    throw new Error("Rate limit exceeded");
  }

  current.count += 1;
  buckets.set(key, current);
}
