# nool (fact-extract)

Core package for nool — the fact extraction engine. See the [project README](../README.md) for full documentation.

## Quick Reference

```bash
# CLI — OpenAI (default)
cat article.txt | nool

# CLI — Anthropic
cat article.txt | nool --provider anthropic

# Library
import { extractFacts } from 'nool'
const result = await extractFacts('Octopuses have three hearts.', { provider: 'anthropic' })
```

## Module Map

```
src/
  extractFacts.js     Pipeline orchestrator (public API)
  splitSentences.js   Text → sentence array
  claimFilter.js      Sentence array → likely claims
  dedupeFacts.js      Remove duplicate facts
  rateLimiter.js      API rate control
  stdin.js            Read piped input

  llm/
    prompt.js         Shared system prompt
    parse.js          Shared JSON response parsing
    openai.js         OpenAI provider
    anthropic.js      Anthropic provider
```

## Tests

```bash
npm test
```

## Architecture

See [docs/architecture.md](docs/architecture.md).
