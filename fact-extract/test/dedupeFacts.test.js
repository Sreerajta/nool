import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeFacts } from '../src/dedupeFacts.js';

describe('dedupeFacts', () => {
  it('removes exact duplicates keeping highest confidence', () => {
    const facts = [
      { text: 'The sky is blue', confidence: 0.8 },
      { text: 'The sky is blue', confidence: 0.9 },
    ];
    const result = dedupeFacts(facts);
    assert.equal(result.length, 1);
    assert.equal(result[0].confidence, 0.9);
  });

  it('removes case-insensitive duplicates', () => {
    const facts = [
      { text: 'The Sky Is Blue', confidence: 0.7 },
      { text: 'the sky is blue', confidence: 0.85 },
    ];
    const result = dedupeFacts(facts);
    assert.equal(result.length, 1);
    assert.equal(result[0].confidence, 0.85);
  });

  it('ignores punctuation differences', () => {
    const facts = [
      { text: 'The sky is blue.', confidence: 0.8 },
      { text: 'The sky is blue', confidence: 0.9 },
    ];
    const result = dedupeFacts(facts);
    assert.equal(result.length, 1);
  });

  it('keeps distinct facts', () => {
    const facts = [
      { text: 'The sky is blue', confidence: 0.9 },
      { text: 'Water is wet', confidence: 0.8 },
    ];
    const result = dedupeFacts(facts);
    assert.equal(result.length, 2);
  });

  it('handles empty array', () => {
    assert.deepEqual(dedupeFacts([]), []);
  });

  it('preserves source_sentence of highest confidence fact', () => {
    const facts = [
      { text: 'The sky is blue', confidence: 0.7, source_sentence: 'The sky is blue and vast.' },
      { text: 'The sky is blue', confidence: 0.9, source_sentence: 'The sky is blue on clear days.' },
    ];
    const result = dedupeFacts(facts);
    assert.equal(result.length, 1);
    assert.equal(result[0].confidence, 0.9);
    assert.equal(result[0].source_sentence, 'The sky is blue on clear days.');
  });
});
