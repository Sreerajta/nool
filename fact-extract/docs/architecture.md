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
LLM Extraction     (llm/openai.js or llm/anthropic.js)
  │                 Sends text to the selected LLM provider.
  │                 Runs in parallel batches with rate limiting.
  ▼
Source Grounding    (extractFacts.js — inline)
  │                 Attaches source_sentence to each fact programmatically.
  │                 Never relies on the LLM to produce source text.
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
| Pipeline          | `extractFacts.js`   | Orchestrates all stages, selects provider |
| Sentence Splitter | `splitSentences.js` | Text → sentence array                   |
| Claim Filter      | `claimFilter.js`    | Sentence array → likely-claim array     |
| Shared Prompt     | `llm/prompt.js`     | System prompt used by all providers     |
| Shared Parser     | `llm/parse.js`      | JSON response parsing for all providers |
| OpenAI Provider   | `llm/openai.js`     | Text chunk → Fact array (via OpenAI)    |
| Anthropic Provider| `llm/anthropic.js`  | Text chunk → Fact array (via Claude)    |
| Deduplication     | `dedupeFacts.js`    | Fact array → unique Fact array          |
| Rate Limiter      | `rateLimiter.js`    | Controls API request rate               |
| Stdin Reader      | `stdin.js`          | Reads piped input for the CLI           |

## LLM Provider Architecture

```
extractFacts.js
  │
  ├── getExtractor(provider)     simple if/else, returns extract function
  │
  ├── llm/openai.js              OpenAI: chat.completions.create
  │     ├── llm/prompt.js        shared system prompt
  │     └── llm/parse.js         shared JSON parser
  │
  └── llm/anthropic.js           Anthropic: messages.create
        ├── llm/prompt.js        shared system prompt
        └── llm/parse.js         shared JSON parser
```

Provider selection is a plain if/else — no registries, no dynamic dispatch.

## Fact Schema

Every extracted fact follows this structure:

```js
{
  text: string,            // The atomic factual statement (max 20 words)
  subject: string,         // The entity the fact is about
  predicate: string,       // The verb or relationship
  object: string,          // The value or related entity
  confidence: number,      // 0.0–1.0, how clearly stated in source
  source_sentence: string  // The original text this fact was extracted from
}
```

## Data Flow

```
extractFacts(text, options)
  │
  ├── getExtractor(provider)     → extract function
  ├── splitSentences(text)       → string[]
  ├── filterClaims(sentences)    → string[]
  ├── batchSentences(claims)     → string[]     (internal helper)
  ├── runParallel(batches, ...)  → Fact[][]     (internal helper)
  │     ├── extract(batch)       → Fact[]       (per batch, via selected provider)
  │     └── attach source_sentence to each fact  (grounding)
  ├── results.flat()             → Fact[]
  ├── dedupeFacts(allFacts)      → Fact[]
  └── return { facts }
```

## Extension Points

- **New providers**: Add a file in `src/llm/`, add an `if` branch in `getExtractor()`
- **Custom claim filters**: Add rules to the scoring system in `claimFilter.js`
- **Output formats**: Wrap `extractFacts()` and transform the result (CSV, JSONL, etc.)

## Design Decisions

- **Shared prompt**: All providers use the same system prompt from `llm/prompt.js` to ensure consistent extraction quality.
- **Shared parser**: `llm/parse.js` handles JSON extraction robustly, including markdown fences and wrapped text — needed especially for Anthropic which has no `response_format` option.
- **Source grounding**: `source_sentence` is attached in the orchestrator, not by the LLM. This keeps grounding deterministic and accurate.
- **Batching**: Short sentences are grouped into ~500-character batches to reduce API calls.
- **Fallback**: If the claim filter rejects all sentences, the full text is sent as one chunk.
- **Rate limiting**: Simple token-bucket approach. Sufficient for single-user CLI usage.
- **Concurrency**: Worker-pool pattern with configurable parallelism. Defaults to 3.
