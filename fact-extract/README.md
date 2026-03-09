# nool (fact-extract)

Core package for nool — the fact extraction engine. See the [project README](../README.md) for full documentation.

## Quick Reference

```bash
# CLI
cat article.txt | nool

# Library
import { extractFacts } from 'nool'
const result = await extractFacts('Octopuses have three hearts.')
```

## Module Map

```
src/
  extractFacts.js     Pipeline orchestrator (public API)
  splitSentences.js   Text → sentence array
  claimFilter.js      Sentence array → likely claims
  llmExtract.js       Text chunk → facts via OpenAI
  dedupeFacts.js      Remove duplicate facts
  rateLimiter.js      API rate control
  stdin.js            Read piped input
```

## Tests

```bash
npm test
```

## Architecture

See [docs/architecture.md](docs/architecture.md).
