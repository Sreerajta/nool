import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFacts } from '../src/llm/parse.js';

describe('parseFacts', () => {
  it('parses valid JSON', () => {
    const input = '{"facts": [{"text": "Sky is blue", "confidence": 0.9}]}';
    const result = parseFacts(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'Sky is blue');
  });

  it('extracts JSON from markdown fences', () => {
    const input = '```json\n{"facts": [{"text": "Water is wet", "confidence": 0.8}]}\n```';
    const result = parseFacts(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'Water is wet');
  });

  it('extracts JSON wrapped in text', () => {
    const input = 'Here are the facts:\n{"facts": [{"text": "Fire is hot", "confidence": 0.95}]}\nDone.';
    const result = parseFacts(input);
    assert.equal(result.length, 1);
  });

  it('returns empty array for null', () => {
    assert.deepEqual(parseFacts(null), []);
  });

  it('returns empty array for empty string', () => {
    assert.deepEqual(parseFacts(''), []);
  });

  it('returns empty array for garbage', () => {
    assert.deepEqual(parseFacts('not json at all'), []);
  });

  it('returns empty array when facts is not an array', () => {
    const input = '{"facts": "not an array"}';
    assert.deepEqual(parseFacts(input), []);
  });
});
