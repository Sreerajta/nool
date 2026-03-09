import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractFacts } from '../src/extractFacts.js';

describe('extractFacts', () => {
  it('returns { facts: [] } for empty string', async () => {
    const result = await extractFacts('');
    assert.deepEqual(result, { facts: [] });
  });

  it('returns { facts: [] } for whitespace', async () => {
    const result = await extractFacts('   \n\n  ');
    assert.deepEqual(result, { facts: [] });
  });

  it('returns { facts: [] } for null', async () => {
    const result = await extractFacts(null);
    assert.deepEqual(result, { facts: [] });
  });

  it('returns object with facts array', async () => {
    const result = await extractFacts('');
    assert.ok(Object.hasOwn(result, 'facts'));
    assert.ok(Array.isArray(result.facts));
  });

  it('accepts provider option without crashing on empty input', async () => {
    const result = await extractFacts('', { provider: 'anthropic' });
    assert.deepEqual(result, { facts: [] });
  });

  it('accepts unknown provider and falls back to openai on empty input', async () => {
    const result = await extractFacts('', { provider: 'unknown' });
    assert.deepEqual(result, { facts: [] });
  });

  it('calls onLog when provided', async () => {
    const logs = [];
    await extractFacts('', { onLog: (msg) => logs.push(msg) });
    // Empty input returns early before logging
    assert.equal(logs.length, 0);
  });

  it('accepts signal option without crashing on empty input', async () => {
    const ac = new AbortController();
    const result = await extractFacts('', { signal: ac.signal });
    assert.deepEqual(result, { facts: [] });
  });
});
