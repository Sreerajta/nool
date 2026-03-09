#!/usr/bin/env node

/**
 * CLI entry point for nool.
 *
 * Reads text from stdin, extracts facts, writes JSON to stdout.
 * Usage: cat article.txt | nool
 */

import { readStdin } from '../src/stdin.js';
import { extractFacts } from '../src/extractFacts.js';

async function main() {
  const text = await readStdin();

  if (!text.trim()) {
    process.stderr.write('Error: No input received. Pipe text via stdin.\n');
    process.stderr.write('Usage: cat article.txt | nool\n');
    process.exitCode = 1;
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    process.stderr.write('Error: OPENAI_API_KEY environment variable is not set.\n');
    process.exitCode = 1;
    return;
  }

  try {
    const result = await extractFacts(text);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

main();
