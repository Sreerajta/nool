/**
 * dedupeFacts.js
 *
 * Removes duplicate facts by comparing normalized text.
 * When duplicates are found, keeps the fact with the highest confidence.
 *
 * Input:  array of Fact objects
 * Output: deduplicated array of Fact objects
 */

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeFacts(facts) {
  const seen = new Map();

  for (const fact of facts) {
    const key = normalize(fact.text);
    const existing = seen.get(key);

    if (!existing || fact.confidence > existing.confidence) {
      seen.set(key, fact);
    }
  }

  return [...seen.values()];
}
