/**
 * retry.js
 *
 * Retries an async function on rate limit (429) or transient (5xx) errors.
 * Respects Retry-After headers when present. Uses exponential backoff otherwise.
 *
 * Input:  async function, options { maxRetries }
 * Output: result of the function, or throws after all retries exhausted
 */

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

function getRetryDelay(err, attempt) {
  // Anthropic and OpenAI both set headers on the error object
  const retryAfter = err?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  // Exponential backoff: 2s, 4s, 8s, 16s...
  return Math.min(2000 * Math.pow(2, attempt), 30_000);
}

function isRetryable(err) {
  const status = err?.status || err?.statusCode;
  if (status && RETRYABLE_STATUS.has(status)) return true;

  const msg = (err?.message || '').toLowerCase();
  return msg.includes('rate limit') || msg.includes('overloaded') || msg.includes('529');
}

export async function withRetry(fn, options = {}) {
  const { maxRetries = 3, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries || !isRetryable(err)) throw err;

      const delay = getRetryDelay(err, attempt);
      if (onRetry) onRetry(attempt + 1, delay, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
