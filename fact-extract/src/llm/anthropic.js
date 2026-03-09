/**
 * llm/anthropic.js
 *
 * Anthropic (Claude) provider for fact extraction.
 * Uses messages.create. Since Anthropic has no response_format option,
 * JSON output is enforced via the prompt and parsed from the response.
 *
 * Input:  text string, options { model }
 * Output: array of Fact objects
 */

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';
import { parseFacts } from './parse.js';

export async function extract(text, options = {}) {
  const { model = 'claude-sonnet-4-20250514' } = options;
  const client = new Anthropic();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(text) },
    ],
  });

  const content = response.content[0]?.text;
  return parseFacts(content);
}
