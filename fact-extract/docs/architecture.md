# Architecture

## Overview

nool is a single-purpose tool that converts raw text into atomic factual statements. It follows Unix philosophy: read from stdin, write JSON to stdout, compose in pipelines.

## Pipeline

Every extraction follows this linear pipeline:

```
Raw Text
  │
  ▼
Sentence Splitter  (splitSentences.js)
  │                 Rule-based splitting with abbreviation handling.
  ▼
Claim Filter       (claimFilter.js)
  │                 Heuristic check: does this sentence contain a factual claim?
  │                 Reduces LLM calls by filtering non-factual sentences.
  ▼
LLM Extraction     (llmExtract.js)
  │                 Sends text to OpenAI API with a strict extraction prompt.
  │                 Runs in parallel batches with rate limiting.
  ▼
Deduplication      (dedupeFacts.js)
  │                 Normalizes fact text, removes duplicates,
  │                 keeps highest confidence score.
  ▼
JSON Output        { facts: [...] }
```

## Module Responsibilities

| Module            | File                | Responsibility                          |
|-------------------|---------------------|-----------------------------------------|
| Pipeline          | `extractFacts.js`   | Orchestrates all stages                 |
| Sentence Splitter | `splitSentences.js` | Text → sentence array                   |
| Claim Filter      | `claimFilter.js`    | Sentence array → likely-claim array     |
| LLM Extractor     | `llmExtract.js`     | Text chunk → Fact array (via OpenAI)    |
| Deduplication     | `dedupeFacts.js`    | Fact array → unique Fact array          |
| Rate Limiter      | `rateLimiter.js`    | Controls API request rate               |
| Stdin Reader      | `stdin.js`          | Reads piped input for the CLI           |

## Fact Schema

Every extracted fact follows this structure:

```js
{
  text: string,       // The atomic factual statement (max 20 words)
  subject: string,    // The entity the fact is about
  predicate: string,  // The verb or relationship
  object: string,     // The value or related entity
  confidence: number  // 0.0–1.0, how clearly stated in source
}
```

## Data Flow

```
extractFacts(text, options)
  │
  ├── splitSentences(text)        → string[]
  ├── filterClaims(sentences)     → string[]
  ├── batchSentences(claims)      → string[]     (internal helper)
  ├── runParallel(batches, ...)   → Fact[][]     (internal helper)
  │     └── llmExtract(batch)     → Fact[]       (per batch)
  ├── results.flat()              → Fact[]
  ├── dedupeFacts(allFacts)       → Fact[]
  └── return { facts }
```

## Extension Points

- **New extractors**: Replace `llmExtract.js` with any function matching `(text, options) → Fact[]`
- **Custom claim filters**: Add rules to the scoring system in `claimFilter.js`
- **Output formats**: Wrap `extractFacts()` and transform the result (CSV, JSONL, etc.)
- **Different LLM providers**: Swap the OpenAI client in `llmExtract.js` for another provider

## Design Decisions

- **Batching**: Short sentences are grouped into ~500-character batches to reduce API calls.
- **Fallback**: If the claim filter rejects all sentences, the full text is sent as one chunk. This prevents silent failures on unconventional input.
- **Rate limiting**: A simple token-bucket approach. Sufficient for single-user CLI usage.
- **Concurrency**: Worker-pool pattern with configurable parallelism. Defaults to 3.
