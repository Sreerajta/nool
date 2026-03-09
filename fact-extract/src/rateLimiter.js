/**
 * rateLimiter.js
 *
 * Queue-based rate limiter for API calls.
 * Enforces a maximum number of requests per minute.
 *
 * Each call reserves a time slot synchronously before awaiting,
 * so concurrent workers get sequential slots — no race conditions.
 *
 * Usage:
 *   const limiter = createRateLimiter(60)
 *   await limiter()  // waits if needed
 */

export function createRateLimiter(maxPerMinute = 60) {
  const interval = 60_000 / maxPerMinute;
  let nextSlot = 0;

  return async function limit() {
    const now = Date.now();

    // Reserve the next slot synchronously (before any await).
    // This is what prevents the race condition with concurrent workers.
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + interval;

    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  };
}
