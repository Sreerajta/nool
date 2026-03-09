#!/usr/bin/env node

/**
 * CLI entry point for nool.
 *
 * Reads text from stdin, extracts facts, writes JSON to stdout.
 * Progress is written to stderr so it doesn't break piped JSON output.
 *
 * Usage:
 *   cat article.txt | nool
 *   cat article.txt | nool --provider anthropic
 *   cat article.txt | nool --provider openai --model gpt-4o
 */

import { readStdin } from '../src/stdin.js';
import { extractFacts } from '../src/extractFacts.js';

function parseArgs(argv) {
  const args = { provider: 'openai', model: undefined };

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--provider' && argv[i + 1]) {
      args.provider = argv[++i];
    } else if (argv[i] === '--model' && argv[i + 1]) {
      args.model = argv[++i];
    }
  }

  return args;
}

function checkApiKey(provider) {
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('Error: ANTHROPIC_API_KEY environment variable is not set.\n');
    return false;
  }
  if (provider !== 'anthropic' && !process.env.OPENAI_API_KEY) {
    process.stderr.write('Error: OPENAI_API_KEY environment variable is not set.\n');
    return false;
  }
  return true;
}

function onProgress(completed, total) {
  if (total <= 1) return;
  process.stderr.write(`\rProcessing batch ${completed}/${total}...`);
  if (completed === total) process.stderr.write('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const text = await readStdin();

  if (!text.trim()) {
    process.stderr.write('Error: No input received. Pipe text via stdin.\n');
    process.stderr.write('Usage: cat article.txt | nool [--provider openai|anthropic] [--model name]\n');
    process.exitCode = 1;
    return;
  }

  if (!checkApiKey(args.provider)) {
    process.exitCode = 1;
    return;
  }

  try {
    const options = { provider: args.provider, onProgress };
    if (args.model) options.model = args.model;

    const result = await extractFacts(text, options);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`\nError: ${err.message}\n`);
    process.exitCode = 1;
  }
}

main();
