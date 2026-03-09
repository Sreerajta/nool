# Contributing to nool

Thanks for your interest in contributing. This guide covers how the project works and how to add to it.

## Quick Start

```bash
git clone <repo-url>
cd fact-extract
npm install
npm test
```

## How the Pipeline Works

Every call to `extractFacts(text)` follows this path:

1. **Sentence Splitting** — `splitSentences.js` breaks text into sentences
2. **Claim Filtering** — `claimFilter.js` keeps only sentences likely to contain facts
3. **LLM Extraction** — `llmExtract.js` sends claims to OpenAI and parses the response
4. **Deduplication** — `dedupeFacts.js` removes duplicate facts by normalized text

The orchestrator is `extractFacts.js`. Read it first — it is designed to be self-documenting.

## Running Tests

```bash
npm test
```

Tests use the Node.js built-in test runner. Each source module has a corresponding test file:

| Source               | Test                       |
|----------------------|----------------------------|
| `splitSentences.js`  | `splitSentences.test.js`   |
| `claimFilter.js`     | `claimFilter.test.js`      |
| `dedupeFacts.js`     | `dedupeFacts.test.js`      |
| `extractFacts.js`    | `extractFacts.test.js`     |

## Adding New Features

### New claim filter rules

Edit `src/claimFilter.js`. Add a new regex pattern and integrate it into the scoring system in `isLikelyClaim()`.

### New output formats

Do **not** modify the core pipeline. Instead, create a wrapper:

```js
import { extractFacts } from './src/extractFacts.js';

const result = await extractFacts(text);
const csv = result.facts.map(f => `${f.subject},${f.predicate},${f.object}`).join('\n');
```

### New pipeline stages

Add the stage as a clearly labeled step in `extractFacts.js`. Follow the existing pattern of step-by-step comments.

### Alternative LLM providers

Create a new file (e.g., `src/anthropicExtract.js`) with the same signature as `llmExtract`:

```js
export async function anthropicExtract(text, options) → Fact[]
```

Then swap it into `extractFacts.js`.

## Coding Standards

- **Small modules**: One file, one responsibility. Aim for 30–60 lines.
- **Simple functions**: No classes unless truly necessary. No inheritance.
- **Readable code**: Step-by-step procedural style. Avoid clever one-liners.
- **Descriptive names**: `sentences`, not `s`. `claims`, not `filtered`.
- **Minimal dependencies**: Think twice before adding a new dependency.

## Pull Request Checklist

- [ ] Code follows the existing style
- [ ] New functions have JSDoc comments
- [ ] Tests are added for new functionality
- [ ] `npm test` passes
- [ ] No new dependencies unless essential
- [ ] Pipeline structure is preserved
