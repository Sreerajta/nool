/**
 * rateLimiter.js
 *
 * Token-bucket rate limiter for API calls.
 * Enforces a maximum number of requests per minute.
 *
 * Usage:
 *   const limiter = createRateLimiter(60)
 *   await limiter()  // waits if needed
 */

export function createRateLimiter(maxPerMinute = 60) {
  const interval = 60_000 / maxPerMinute;
  let lastCall = 0;

  return async function limit() {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed < interval) {
      await new Promise(resolve => setTimeout(resolve, interval - elapsed));
    }

    lastCall = Date.now();
  };
}
