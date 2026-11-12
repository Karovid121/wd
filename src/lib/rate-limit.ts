type Bucket = { count: number; resetAt: number };

const globalForLimits = globalThis as unknown as { rateLimitBuckets?: Map<string, Bucket> };
const buckets = (globalForLimits.rateLimitBuckets ??= new Map<string, Bucket>());

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * Fixed-window limiter kept in process memory. Good for a single server process;
 * a multi-instance deployment needs a shared store instead.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function resetRateLimits() {
  buckets.clear();
}
