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
      "confidence": 0.92
    },
    {
      "text": "Octopus blood is blue",
      "subject": "Octopus blood",
      "predicate": "is",
      "object": "blue",
      "confidence": 0.90
    },
    {
      "text": "Octopus blood contains hemocyanin",
      "subject": "Octopus blood",
      "predicate": "contains",
      "object": "hemocyanin",
      "confidence": 0.88
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
LLM Extraction         Extract structured facts via OpenAI
  │
  ▼
Deduplication          Remove duplicate facts, keep highest confidence
  │
  ▼
JSON Output            { facts: [...] }
```

Claim filtering runs *before* the LLM, using lightweight heuristics (numbers, scientific verbs, entity names, measurements). This significantly reduces API calls and cost.

## Installation

```bash
npm install nool
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## CLI

Nool follows Unix philosophy — read stdin, write JSON to stdout, compose in pipelines.

```bash
# From a file
cat article.txt | nool

# From the web
curl -s https://en.wikipedia.org/wiki/Octopus | html2text | nool

# Just the fact text
cat paper.txt | nool | jq '.facts[] | .text'

# Top 5 by confidence
cat paper.txt | nool | jq '[.facts | sort_by(-.confidence) | .[:5]]'

# Compose with anything
scraper | paragraph-filter | nool | jq
```

## Library

```js
import { extractFacts } from 'nool'

const result = await extractFacts(
  'Octopuses have three hearts and blue blood due to hemocyanin.'
)

console.log(result.facts)
```

### Options

```js
const result = await extractFacts(text, {
  model: 'gpt-4o-mini',   // OpenAI model (default: gpt-4o-mini)
  maxFacts: 50,            // Maximum facts to return (default: Infinity)
  concurrency: 4,          // Parallel API calls (default: 3)
  rateLimit: 30,           // Max requests per minute (default: 60)
})
```

## Project Structure

```
src/
  extractFacts.js     Pipeline orchestrator — the main entry point
  splitSentences.js   Text → sentence array
  claimFilter.js      Sentence array → likely factual claims
  llmExtract.js       Text chunk → facts via OpenAI
  dedupeFacts.js      Remove duplicate facts
  rateLimiter.js      API rate control
  stdin.js            Read piped input

cli/
  nool.js             CLI entry point
```

Each file has one job. Files are named after their primary exported function. See [docs/architecture.md](fact-extract/docs/architecture.md) for the full design.

## Examples

```bash
# Wikipedia → facts
curl -s "https://en.wikipedia.org/wiki/Octopus" \
  | html2text | nool | jq '.facts[] | .text'

# Research paper → top 10 facts by confidence
cat paper.txt | nool \
  | jq '[.facts | sort_by(-.confidence) | .[:10] | .[] | {text, confidence}]'
```

```js
// Curiosity cards
import { extractFacts } from 'nool'

const { facts } = await extractFacts('The Moon is drifting away from Earth at 3.8 cm per year.')
facts.forEach(f => console.log(`[${f.confidence}] ${f.text}`))
```

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
