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
});
