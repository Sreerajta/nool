/**
 * curiosity-cards.js
 *
 * Extracts facts from text and formats them as "curiosity cards" —
 * small standalone fact cards suitable for flashcards or social sharing.
 *
 * Usage: node examples/curiosity-cards.js "Octopuses have three hearts and blue blood."
 */

import { extractFacts } from '../src/extractFacts.js';

const text = process.argv[2];

if (!text) {
  console.error('Usage: node examples/curiosity-cards.js "<text>"');
  process.exit(1);
}

const result = await extractFacts(text);

for (const fact of result.facts) {
  console.log('┌─────────────────────────────────────────┐');
  console.log(`│  ${fact.text.padEnd(38)}│`);
  console.log(`│  Subject: ${fact.subject.padEnd(29)}│`);
  console.log(`│  Confidence: ${String(fact.confidence).padEnd(26)}│`);
  console.log('└─────────────────────────────────────────┘');
  console.log();
}
