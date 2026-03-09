/**
 * llmExtract.js
 *
 * Sends a text chunk to the OpenAI API and returns extracted facts.
 * Contains the system prompt and response parsing logic.
 *
 * Input:  text string, options { model }
 * Output: array of Fact objects
 *
 * Fact schema:
 *   { text, subject, predicate, object, confidence }
 */

import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a fact extraction engine. Your only job is to extract atomic factual statements from the given text.

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

export async function llmExtract(text, options = {}) {
  const { model = 'gpt-4o-mini' } = options;
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Extract all atomic facts from this text:\n\n${text}` },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch {
    return [];
  }
}
