/**
 * extractFacts.js
 *
 * Main pipeline orchestrator. Coordinates all stages of fact extraction:
 *
 *   Raw Text
 *     → Sentence Splitting
 *     → Claim Filtering
 *     → LLM Fact Extraction (parallel, rate-limited)
 *     → Source Grounding (attach source sentence)
 *     → Deduplication
 *     → JSON Output
 *
 * This is the primary public API of the library.
 */

import { splitSentences } from './splitSentences.js';
import { filterClaims } from './claimFilter.js';
import { dedupeFacts } from './dedupeFacts.js';
import { createRateLimiter } from './rateLimiter.js';
import { extract as extractWithOpenAI } from './llm/openai.js';
import { extract as extractWithAnthropic } from './llm/anthropic.js';

const DEFAULTS = {
  provider: 'openai',
  model: undefined, // each provider has its own default
  maxFacts: Infinity,
  concurrency: 3,
  rateLimit: 60,
};

// -- Helpers ----------------------------------------------------------

/**
 * Return the extract function for the given provider name.
 */
function getExtractor(provider) {
  if (provider === 'anthropic') return extractWithAnthropic;
  return extractWithOpenAI;
}

/**
 * Group sentences into batches of roughly maxLength characters.
 * Reduces the number of API calls for many short sentences.
 */
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

/**
 * Run async tasks with bounded concurrency.
 */
async function runParallel(items, fn, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

// -- Main Pipeline ----------------------------------------------------

/**
 * Extract atomic facts from raw text.
 *
 * @param {string} text - Raw input text
 * @param {object} [options]
 * @param {string} [options.provider]    - LLM provider: "openai" or "anthropic" (default: "openai")
 * @param {string} [options.model]       - Model name (default: provider-specific)
 * @param {number} [options.maxFacts]    - Max facts to return (default: Infinity)
 * @param {number} [options.concurrency] - Parallel API calls (default: 3)
 * @param {number} [options.rateLimit]   - Max requests per minute (default: 60)
 * @returns {Promise<{facts: Array, errors?: Array}>}
 */
export async function extractFacts(text, options = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { facts: [] };
  }

  const opts = { ...DEFAULTS, ...options };
  const llmExtract = getExtractor(opts.provider);

  // Step 1: Split text into sentences
  const sentences = splitSentences(text);
  if (sentences.length === 0) return { facts: [] };

  // Step 2: Filter to sentences likely containing factual claims
  const claims = filterClaims(sentences);

  // Fallback: if the claim filter rejects everything, try the full text
  if (claims.length === 0) {
    const facts = await llmExtract(text.trim(), opts);
    const grounded = facts.map(f => ({ ...f, source_sentence: text.trim() }));
    return { facts: grounded.slice(0, opts.maxFacts) };
  }

  // Step 3: Batch claims for efficient API usage
  const batches = batchSentences(claims);

  // Step 4: Extract facts from each batch (parallel, rate-limited)
  const limiter = createRateLimiter(opts.rateLimit);
  const errors = [];

  const results = await runParallel(
    batches,
    async (batch) => {
      await limiter();
      try {
        const facts = await llmExtract(batch, opts);
        // Step 5: Attach source sentence (grounding)
        return facts.map(f => ({ ...f, source_sentence: batch }));
      } catch (err) {
        errors.push({ batch: batch.slice(0, 80), error: err.message });
        return [];
      }
    },
    opts.concurrency,
  );

  // Step 6: Flatten and deduplicate
  const allFacts = results.flat();
  const unique = dedupeFacts(allFacts);
  const limited = unique.slice(0, opts.maxFacts);

  const output = { facts: limited };
  if (errors.length > 0) output.errors = errors;
  return output;
}
