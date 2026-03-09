import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitSentences } from '../src/splitSentences.js';

describe('splitSentences', () => {
  it('splits simple sentences', () => {
    const result = splitSentences('The sky is blue. Water is wet.');
    assert.deepEqual(result, ['The sky is blue.', 'Water is wet.']);
  });

  it('handles abbreviations', () => {
    const result = splitSentences('Dr. Smith went to Washington. He arrived at noon.');
    assert.equal(result.length, 2);
    assert.ok(result[0].includes('Dr.'));
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(splitSentences(''), []);
    assert.deepEqual(splitSentences(null), []);
    assert.deepEqual(splitSentences(undefined), []);
  });

  it('handles single sentence without period', () => {
    const result = splitSentences('The sky is blue');
    assert.deepEqual(result, ['The sky is blue']);
  });

  it('handles multiple whitespace', () => {
    const result = splitSentences('The sky is   blue.   Water   is wet.');
    assert.equal(result.length, 2);
  });

  it('skips very short fragments', () => {
    const result = splitSentences('Hi. The sky is blue.');
    assert.equal(result.length, 1);
    assert.equal(result[0], 'The sky is blue.');
  });

  it('handles decimal numbers', () => {
    const result = splitSentences('Pi is approximately 3.14. It is irrational.');
    assert.equal(result.length, 2);
    assert.ok(result[0].includes('3.14'));
  });

  it('handles exclamation and question marks', () => {
    const result = splitSentences('What a discovery! Is it true? The data confirms it.');
    assert.equal(result.length, 3);
  });
});
