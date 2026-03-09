/**
 * prompt.js
 *
 * Shared system prompt and user prompt for all LLM providers.
 * Kept in one place so extraction rules stay consistent across providers.
 */

export const SYSTEM_PROMPT = `You are a fact extraction engine. Your only job is to extract atomic factual statements from the given text.

Rules:
- Extract ONLY facts explicitly stated in the text
- Each fact must be atomic — one claim per fact
- Split compound statements into separate facts
- Each fact must be max 20 words
- No speculation, inference, or hallucination
- Facts must be independently verifiable from the source text
- Assign a confidence score (0.0–1.0) based on how clearly the fact is stated

Return valid JSON only, no markdown fences, no explanation:
{
  "facts": [
    {
      "text": "standalone factual sentence",
      "subject": "entity",
      "predicate": "verb/relation",
      "object": "value/entity",
      "confidence": 0.0
    }
  ]
}

If no facts can be extracted, return: {"facts": []}`;

export function buildUserPrompt(text) {
  return `Extract all atomic facts from this text:\n\n${text}`;
}
