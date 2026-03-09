/**
 * llm/parse.js
 *
 * Shared JSON parsing logic for all providers.
 * Handles cases where the LLM wraps JSON in text or markdown fences.
 *
 * Input:  raw string from LLM response
 * Output: array of Fact objects
 */

export function parseFacts(content) {
  if (!content) return [];

  // Try direct parse first
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch {
    // Fall through to extraction
  }

  // Extract JSON from markdown fences or surrounding text
  const match = content.match(/\{[\s\S]*"facts"[\s\S]*\}/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch {
    return [];
  }
}
