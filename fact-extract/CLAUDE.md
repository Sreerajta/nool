# CLAUDE.md — AI Assistant Guidelines

This file tells AI coding assistants (Claude, GPT, Copilot) how to work with this codebase.

## Project Purpose

**nool** (നൂല്‍ — *thread* in Malayalam) pulls the threads of knowledge from raw text. It converts unstructured text into atomic factual statements using an LLM. Single-purpose Unix-style tool: stdin in, JSON out. The CLI command is `nool`, the library export is `extractFacts`.

## Architectural Rules

- **Linear pipeline**: `text → sentences → claims → LLM extraction → deduplication → output`. All code must preserve this flow.
- **Small modules**: Each file has one responsibility. Target 30–60 lines per file.
- **Explicit data flow**: No hidden state, no singletons, no event emitters. Data flows through function arguments and return values.
- **No magic**: No decorators, proxies, metaprogramming, or dynamic imports.

## Coding Style

- Prefer simple standalone functions over classes.
- Prefer step-by-step procedural code over chained functional expressions.
- Avoid deeply nested callbacks or promise chains.
- Use descriptive variable names. `claims` not `c`, `sentences` not `s`.
- Keep functions under 30 lines when possible.
- Use JSDoc comments for public functions. Skip comments for obvious code.

## File Organization

```
src/
  extractFacts.js    — Pipeline orchestrator (public API)
  splitSentences.js  — Text → sentences
  claimFilter.js     — Sentences → likely claims
  llmExtract.js      — Text chunk → facts (OpenAI API)
  dedupeFacts.js     — Remove duplicate facts
  rateLimiter.js     — API rate control
  stdin.js           — Read piped input

cli/
  fact-extract.js    — CLI entry point

test/
  splitSentences.test.js
  claimFilter.test.js
  dedupeFacts.test.js
  extractFacts.test.js
```

Files are named after their primary exported function.

## Fact Schema

All modules operate on this structure:

```js
{
  text: string,       // Atomic factual statement (max 20 words)
  subject: string,    // Entity
  predicate: string,  // Verb/relation
  object: string,     // Value/entity
  confidence: number  // 0.0–1.0
}
```

## Extension Guidelines

### Adding a new extractor
Create a new file in `src/` that exports an async function with signature `(text, options) → Fact[]`. Swap it into `extractFacts.js` in place of `llmExtract`.

### Modifying claim filtering
Edit the regex patterns and scoring logic in `claimFilter.js`. Add new patterns, adjust weights. The `isLikelyClaim` function uses additive scoring — keep that pattern.

### Adding output formats
Do not modify `extractFacts.js`. Instead, create a wrapper that calls `extractFacts()` and transforms the result.

### Adding a new pipeline stage
Insert it as a clear step in `extractFacts.js`. Name the step with a comment. Keep the step-by-step structure.

## Refactoring Guidelines

When modifying code:

- Keep modules small. If a file exceeds ~80 lines, consider splitting.
- Preserve the pipeline structure in `extractFacts.js`.
- Do not introduce abstract base classes, factory patterns, or dependency injection.
- Do not add runtime type-checking libraries. Use JSDoc for types.
- Do not add configuration files (YAML, TOML). Options are passed as function arguments.
- Keep the dependency count minimal. Currently only `openai`.

## Testing

- Use Node.js built-in test runner (`node:test`).
- One test file per source module.
- Test pure functions directly. Mock the OpenAI client for integration tests.
- Run: `npm test`

## Commands

```bash
npm test           # Run all tests
npm run test       # Same
```
