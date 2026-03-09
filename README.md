# nool

**നൂല്‍** — *thread* in Malayalam.

Pull threads of knowledge from raw text.

```
cat article.txt | nool | jq '.facts[] | .text'
```

> This project was built with LLMs. It is maintained with LLMs. The code is structured so that AI coding assistants (Claude, GPT, Copilot) can read, extend, and refactor it easily. There is a [CLAUDE.md](fact-extract/CLAUDE.md) that tells them how. If that bothers you, this isn't for you.

## What It Does

Nool extracts individual factual statements from unstructured text. One input paragraph becomes many standalone facts, each with a subject, predicate, object, and confidence score.

**Input:**

> Octopuses have three hearts and blue blood due to hemocyanin.

**Output:**

```json
{
  "facts": [
    {
      "text": "Octopuses have three hearts",
      "subject": "Octopuses",
      "predicate": "have",
      "object": "three hearts",
      "confidence": 0.92,
      "source_sentence": "Octopuses have three hearts and blue blood due to hemocyanin."
    },
    {
      "text": "Octopus blood is blue",
      "subject": "Octopus blood",
      "predicate": "is",
      "object": "blue",
      "confidence": 0.90,
      "source_sentence": "Octopuses have three hearts and blue blood due to hemocyanin."
    },
    {
      "text": "Octopus blood contains hemocyanin",
      "subject": "Octopus blood",
      "predicate": "contains",
      "object": "hemocyanin",
      "confidence": 0.88,
      "source_sentence": "Octopuses have three hearts and blue blood due to hemocyanin."
    }
  ]
}
```

## How It Works

```
Raw Text
  │
  ▼
Sentence Splitting     Break text into sentences
  │
  ▼
Claim Filtering        Keep only sentences likely containing facts
  │
  ▼
LLM Extraction         Extract structured facts via OpenAI or Anthropic
  │
  ▼
Source Grounding        Attach source sentence to each fact
  │
  ▼
Deduplication          Remove duplicate facts, keep highest confidence
  │
  ▼
JSON Output            { facts: [...] }
```

Claim filtering runs *before* the LLM, using lightweight heuristics (numbers, scientific verbs, entity names, measurements). This significantly reduces API calls and cost.

## Supported Providers

| Provider   | Models                         | API Key              |
|------------|--------------------------------|----------------------|
| OpenAI     | gpt-4o-mini, gpt-4o, etc.     | `OPENAI_API_KEY`     |
| Anthropic  | claude-sonnet-4-20250514, etc.   | `ANTHROPIC_API_KEY`  |

## Installation

```bash
npm install nool
```

## Setup

```bash
# For OpenAI (default)
export OPENAI_API_KEY=sk-...

# For Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

## CLI

```bash
# OpenAI (default)
cat article.txt | nool

# Anthropic
cat article.txt | nool --provider anthropic

# Specific model
cat article.txt | nool --provider openai --model gpt-4o
cat article.txt | nool --provider anthropic --model claude-sonnet-4-20250514

# Pipe with jq
cat paper.txt | nool | jq '.facts[] | .text'

# Top 5 by confidence
cat paper.txt | nool | jq '[.facts | sort_by(-.confidence) | .[:5]]'

# Verbose — see pipeline stats, batch timing, token counts
cat article.txt | nool --verbose

# Quiet — no stderr output, just JSON
cat article.txt | nool --quiet | jq

# Limit input size (characters)
curl -s example.com | html2text | nool --max-chars 50000
```

Ctrl+C during extraction outputs partial results — facts already extracted are not lost.

## Scope and Boundaries

Nool does **one thing**: extract facts from text. It does not scrape, clean, filter, or preprocess input. Feed it clean text and you get clean facts.

If your input is a web page, clean it upstream:

```bash
# Bad — dumps navigation, footers, metadata into nool
curl -s https://en.wikipedia.org/wiki/Octopus | html2text | nool

# Better — limit to first 200 lines of article body
curl -s https://en.wikipedia.org/wiki/Octopus | html2text | head -200 | nool

# Best — use a proper content extractor upstream
your-scraper --body-only https://example.com/article | nool
```

Nool will faithfully extract facts from whatever you send it — including "This page was last edited on 26 January 2026" if that's in the input. Garbage in, garbage out. Clean input is your responsibility; fact extraction is nool's.

## Library

```js
import { extractFacts } from 'nool'

// OpenAI (default)
const result = await extractFacts('Octopuses have three hearts.')

// Anthropic
const result = await extractFacts('Octopuses have three hearts.', {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514'
})

console.log(result.facts)
```

### Options

```js
const result = await extractFacts(text, {
  provider: 'openai',     // "openai" or "anthropic" (default: "openai")
  model: 'gpt-4o-mini',   // Model name (default: provider-specific)
  maxFacts: 50,            // Maximum facts to return (default: Infinity)
  concurrency: 4,          // Parallel API calls (default: 3)
  rateLimit: 30,           // Max requests per minute (default: 60)
  requestTimeout: 30000,   // Per-request timeout in ms (default: 30000)
  onProgress: (done, total) => {},  // Progress callback
  onLog: (message) => {},           // Verbose logging callback
  signal: abortController.signal,   // AbortSignal for graceful shutdown
})
```

## Project Structure

```
src/
  extractFacts.js     Pipeline orchestrator — the main entry point
  splitSentences.js   Text → sentence array
  claimFilter.js      Sentence array → likely factual claims
  dedupeFacts.js      Remove duplicate facts
  rateLimiter.js      API rate control
  stdin.js            Read piped input

  llm/
    prompt.js         Shared system prompt
    parse.js          Shared JSON response parsing
    openai.js         OpenAI provider
    anthropic.js      Anthropic provider

cli/
  nool.js             CLI entry point
```

Each file has one job. See [docs/architecture.md](fact-extract/docs/architecture.md) for the full design.

## Source Grounding

Every extracted fact includes a `source_sentence` field linking it back to the original text. This is attached programmatically — not generated by the LLM — so it is always accurate.

This enables:

- Traceable facts for knowledge graphs
- Auditable extraction for research tools
- RAG-compatible output with provenance

## Testing

```bash
npm test
```

## Contributing

See [CONTRIBUTING.md](fact-extract/CONTRIBUTING.md).

## Philosophy

- Do one thing well
- Small modules, explicit data flow
- Readable over clever
- Minimal dependencies
- Built with LLMs, maintained with LLMs

## License

MIT
