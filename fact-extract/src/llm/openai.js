/**
 * llm/openai.js
 *
 * OpenAI provider for fact extraction.
 * Uses chat.completions.create with JSON response format.
 *
 * Input:  text string, options { model }
 * Output: array of Fact objects
 */

import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';
import { parseFacts } from './parse.js';

export async function extract(text, options = {}) {
  const { model = 'gpt-4o-mini', requestTimeout = 30_000 } = options;
  const client = new OpenAI();

  const fetchOptions = requestTimeout
    ? { signal: AbortSignal.timeout(requestTimeout) }
    : {};

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(text) },
    ],
  }, fetchOptions);

  const content = response.choices[0]?.message?.content;
  return parseFacts(content);
}
