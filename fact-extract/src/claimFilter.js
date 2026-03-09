/**
 * claimFilter.js
 *
 * Lightweight rule-based filter that identifies sentences likely containing
 * factual claims. Runs before the LLM to reduce unnecessary API calls.
 *
 * Input:  array of sentence strings
 * Output: filtered array of likely-claim sentences
 */

const SCIENTIFIC_VERBS = /\b(is|are|was|were|has|have|had|contains?|produces?|consists?|lives?|discovered|invented|founded|measures?|weighs?|reaches?|grows?|makes?|causes?|requires?|includes?|comprises?|equals?|generates?|creates?|occurs?|exists?|belongs?|provides?|supports?|converts?|enables?|operates?|functions?|serves?|represents?|forms?|develops?|maintains?|involves?)\b/i;

const NUMBERS = /\b\d[\d,.]*\b/;

const MEASUREMENTS = /\b(percent|percentage|km|miles?|meters?|feet|inches|pounds?|kilograms?|grams?|liters?|gallons?|celsius|fahrenheit|kelvin|watts?|volts?|hertz|mph|kph|tons?|degrees?|years?|months?|days?|hours?|minutes?|seconds?|million|billion|trillion|thousand|hundred)\b/i;

const ENTITIES = /\b(the\s+[A-Z]|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/;

const DEFINITIONS = /\b(defined as|known as|referred to as|called|named|classified as|considered|regarded as)\b/i;

const WEAK_OPENERS = /^(however|moreover|furthermore|additionally|meanwhile|nevertheless|nonetheless|for example|for instance|in fact|indeed|thus|therefore|consequently|accordingly|hence|so|but|and|or|yet|also|then)\b/i;

const IMPERATIVES = /^(please|note|see|refer|click|visit|check|try|consider)\b/i;

export function isLikelyClaim(sentence) {
  if (!sentence || sentence.length < 10) return false;
  if (sentence.trim().endsWith('?')) return false;
  if (IMPERATIVES.test(sentence.trim())) return false;

  let score = 0;

  if (SCIENTIFIC_VERBS.test(sentence)) score += 1;
  if (NUMBERS.test(sentence)) score += 1;
  if (MEASUREMENTS.test(sentence)) score += 1;
  if (ENTITIES.test(sentence)) score += 1;
  if (DEFINITIONS.test(sentence)) score += 1;
  if (WEAK_OPENERS.test(sentence.trim())) score -= 0.5;

  return score >= 1;
}

export function filterClaims(sentences) {
  return sentences.filter(isLikelyClaim);
}
