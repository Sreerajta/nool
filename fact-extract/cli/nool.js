#!/usr/bin/env node

/**
 * CLI entry point for nool.
 *
 * Reads text from stdin, extracts facts, writes JSON to stdout.
 * Progress and logs are written to stderr.
 *
 * Usage:
 *   cat article.txt | nool
 *   cat article.txt | nool --provider anthropic
 *   cat article.txt | nool --verbose
 *   cat article.txt | nool --quiet
 *   cat article.txt | nool --max-chars 50000
 */

import { readStdin } from '../src/stdin.js';
import { extractFacts } from '../src/extractFacts.js';

function parseArgs(argv) {
  const args = {
    provider: 'openai',
    model: undefined,
    verbose: false,
    quiet: false,
    maxChars: undefined,
  };

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--provider' && argv[i + 1]) {
      args.provider = argv[++i];
    } else if (argv[i] === '--model' && argv[i + 1]) {
      args.model = argv[++i];
    } else if (argv[i] === '--verbose') {
      args.verbose = true;
    } else if (argv[i] === '--quiet') {
      args.quiet = true;
    } else if (argv[i] === '--max-chars' && argv[i + 1]) {
      args.maxChars = parseInt(argv[++i], 10);
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

function createLogger(args) {
  const log = (msg) => {
    if (!args.quiet) process.stderr.write(`${msg}\n`);
  };
  const verbose = (msg) => {
    if (args.verbose && !args.quiet) process.stderr.write(`  ${msg}\n`);
  };
  const progress = (completed, total) => {
    if (!args.quiet && total > 1) {
      process.stderr.write(`Processing batch ${completed}/${total}...\n`);
    }
  };
  return { log, verbose, progress };
}

async function main() {
  const args = parseArgs(process.argv);
  const { log, verbose, progress } = createLogger(args);

  if (!process.stdin.isTTY) {
    log('Reading input...');
  }

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

  // Truncate if --max-chars is set
  let input = text.trim();
  if (args.maxChars && input.length > args.maxChars) {
    log(`Input truncated: ${input.length} → ${args.maxChars} characters`);
    input = input.slice(0, args.maxChars);
  }

  log(`Input: ${input.length} characters. Extracting facts (${args.provider})...`);

  // Graceful shutdown: Ctrl+C outputs partial results
  const ac = new AbortController();
  let result = null;

  process.on('SIGINT', () => {
    if (ac.signal.aborted) {
      // Second Ctrl+C — force exit
      process.exit(1);
    }
    log('\nInterrupted — finishing current batches and outputting partial results...');
    ac.abort();
  });

  try {
    const options = {
      provider: args.provider,
      onProgress: progress,
      onLog: args.verbose ? verbose : null,
      signal: ac.signal,
    };
    if (args.model) options.model = args.model;

    result = await extractFacts(input, options);
    log(`Done. ${result.facts.length} facts extracted.`);
  } catch (err) {
    process.stderr.write(`\nError: ${err.message}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
