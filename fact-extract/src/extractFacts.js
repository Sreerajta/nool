/**
 * extractFacts.js
 *
 * Main pipeline orchestrator. Coordinates all stages of fact extraction:
 *
 *   Raw Text
 *     → Sentence Splitting
 *     → Claim Filtering
 *     → LLM Fact Extraction (parallel, rate-limited, with retry)
 *     → Source Grounding (attach source sentence)
 *     → Deduplication
 *     → JSON Output
 *
 * Supports graceful shutdown via AbortSignal — stops dispatching new batches
 * and returns partial results collected so far.
 *
 * This is the primary public API of the library.
 */

import { splitSentences } from './splitSentences.js';
import { filterClaims } from './claimFilter.js';
import { dedupeFacts } from './dedupeFacts.js';
import { createRateLimiter } from './rateLimiter.js';
import { withRetry } from './retry.js';
import { extract as extractWithOpenAI } from './llm/openai.js';
import { extract as extractWithAnthropic } from './llm/anthropic.js';

const DEFAULTS = {
  provider: 'openai',
  model: undefined,
  maxFacts: Infinity,
  concurrency: 3,
  rateLimit: 60,
  requestTimeout: 30_000,
  onProgress: null,
  onLog: null,
  signal: null,
};

// -- Helpers ----------------------------------------------------------

function getExtractor(provider) {
  if (provider === 'anthropic') return extractWithAnthropic;
  return extractWithOpenAI;
}

function batchSentences(sentences, maxLength = 500) {
  const batches = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current) {
      batches.push(current.trim());
      current = '';
    }
    current += sentence + ' ';
  }

  if (current.trim()) batches.push(current.trim());
  return batches;
}

async function runParallel(items, fn, concurrency, signal, circuitBreaker) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      if (signal?.aborted) break;
      if (circuitBreaker?.tripped) break;
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results.filter(Boolean);
}

// -- Main Pipeline ----------------------------------------------------

/**
 * Extract atomic facts from raw text.
 *
 * @param {string} text - Raw input text
 * @param {object} [options]
 * @param {string} [options.provider]    - "openai" or "anthropic" (default: "openai")
 * @param {string} [options.model]       - Model name (default: provider-specific)
 * @param {number} [options.maxFacts]    - Max facts to return (default: Infinity)
 * @param {number} [options.concurrency] - Parallel API calls (default: 3)
 * @param {number} [options.rateLimit]      - Max requests per minute (default: 60)
 * @param {number} [options.requestTimeout] - Per-request timeout in ms (default: 30000)
 * @param {function} [options.onProgress]   - (completed, total) => void
 * @param {function} [options.onLog]        - (message) => void — verbose logging
 * @param {AbortSignal} [options.signal]    - Abort signal for graceful shutdown
 * @returns {Promise<{facts: Array, errors?: Array}>}
 */
export async function extractFacts(text, options = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { facts: [] };
  }

  const opts = { ...DEFAULTS, ...options };
  const log = opts.onLog || (() => {});
  const llmExtract = getExtractor(opts.provider);

  // Step 1: Split text into sentences
  const sentences = splitSentences(text);
  log(`Sentences: ${sentences.length}`);
  if (sentences.length === 0) return { facts: [] };

  // Step 2: Filter to sentences likely containing factual claims
  const claims = filterClaims(sentences);
  log(`Claims after filtering: ${claims.length} (filtered out ${sentences.length - claims.length})`);

  // Fallback: if the claim filter rejects everything, try the full text
  if (claims.length === 0) {
    if (opts.onProgress) opts.onProgress(0, 1);
    const facts = await withRetry(() => llmExtract(text.trim(), opts));
    const grounded = facts.map(f => ({ ...f, source_sentence: text.trim() }));
    if (opts.onProgress) opts.onProgress(1, 1);
    return { facts: grounded.slice(0, opts.maxFacts) };
  }

  // Step 3: Batch claims for efficient API usage
  const batches = batchSentences(claims);
  const total = batches.length;
  log(`Batches: ${total} (concurrency: ${opts.concurrency}, rate limit: ${opts.rateLimit}/min)`);

  // Step 4: Extract facts from each batch (parallel, rate-limited, with retry)
  const limiter = createRateLimiter(opts.rateLimit);
  const errors = [];
  let completed = 0;
  const circuitBreaker = { tripped: false, consecutiveFailures: 0, maxFailures: 5 };

  if (opts.onProgress) opts.onProgress(0, total);

  const results = await runParallel(
    batches,
    async (batch) => {
      await limiter();
      const start = Date.now();
      try {
        const facts = await withRetry(
          () => llmExtract(batch, { ...opts, requestTimeout: opts.requestTimeout }),
          {
            onRetry: (attempt, delay) => {
              const delaySec = (delay / 1000).toFixed(1);
              log(`Batch rate limited, retry ${attempt} in ${delaySec}s`);
            },
          },
        );
        circuitBreaker.consecutiveFailures = 0;
        log(`Batch done in ${((Date.now() - start) / 1000).toFixed(1)}s — ${facts.length} facts`);
        // Step 5: Attach source sentence (grounding)
        return facts.map(f => ({ ...f, source_sentence: batch }));
      } catch (err) {
        circuitBreaker.consecutiveFailures++;
        if (circuitBreaker.consecutiveFailures >= circuitBreaker.maxFailures) {
          circuitBreaker.tripped = true;
          log(`Circuit breaker tripped after ${circuitBreaker.maxFailures} consecutive failures — skipping remaining batches`);
        }
        errors.push({ batch: batch.slice(0, 80), error: err.message });
        log(`Batch failed: ${err.message}`);
        return [];
      } finally {
        completed++;
        if (opts.onProgress) opts.onProgress(completed, total);
      }
    },
    opts.concurrency,
    opts.signal,
    circuitBreaker,
  );

  // Step 6: Flatten and deduplicate
  const allFacts = results.flat();
  const unique = dedupeFacts(allFacts);
  const limited = unique.slice(0, opts.maxFacts);

  log(`Total: ${allFacts.length} raw → ${unique.length} unique → ${limited.length} returned`);

  const output = { facts: limited };
  if (errors.length > 0) output.errors = errors;
  return output;
}
