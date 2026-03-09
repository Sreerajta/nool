/**
 * splitSentences.js
 *
 * Splits raw text into individual sentences using rule-based heuristics.
 * Handles abbreviations, decimal numbers, and ellipses.
 *
 * Input:  raw text string
 * Output: array of sentence strings
 */

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc',
  'inc', 'ltd', 'co', 'corp', 'dept', 'univ', 'govt',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'st', 'ave', 'blvd', 'approx', 'est', 'vol', 'fig', 'eq',
  'i.e', 'e.g', 'cf', 'al',
]);

const MIN_SENTENCE_LENGTH = 4;

export function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = [];
  let current = '';

  for (let i = 0; i < cleaned.length; i++) {
    current += cleaned[i];

    const char = cleaned[i];
    if (char !== '.' && char !== '!' && char !== '?') continue;

    // Skip abbreviations: "Dr." "etc."
    const wordBefore = current.slice(0, -1).split(/\s/).pop().toLowerCase();
    if (ABBREVIATIONS.has(wordBefore)) continue;

    // Skip decimal numbers: "3.14"
    if (char === '.' && /\d$/.test(current.slice(0, -1)) && /^\d/.test(cleaned[i + 1] || '')) {
      continue;
    }

    // Skip ellipsis: "..."
    if (char === '.' && cleaned[i + 1] === '.') continue;

    const next = cleaned[i + 1];
    const isEndOfText = !next;
    const isFollowedBySpace = next === ' ' || next === '\n' || next === '"' || next === "'";

    if (isEndOfText || isFollowedBySpace) {
      const trimmed = current.trim();
      if (trimmed.length > MIN_SENTENCE_LENGTH) {
        sentences.push(trimmed);
      }
      current = '';
    }
  }

  // Handle trailing text without terminal punctuation
  const remaining = current.trim();
  if (remaining.length > MIN_SENTENCE_LENGTH) {
    sentences.push(remaining);
  }

  return sentences;
}
