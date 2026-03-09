import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLikelyClaim, filterClaims } from '../src/claimFilter.js';

describe('isLikelyClaim', () => {
  it('detects sentences with scientific verbs', () => {
    assert.ok(isLikelyClaim('Octopuses have three hearts.'));
    assert.ok(isLikelyClaim('Water contains hydrogen and oxygen.'));
  });

  it('detects sentences with numbers', () => {
    assert.ok(isLikelyClaim('The Earth is 4.5 billion years old.'));
  });

  it('detects sentences with measurements', () => {
    assert.ok(isLikelyClaim('The tower measures 324 meters in height.'));
  });

  it('rejects questions', () => {
    assert.equal(isLikelyClaim('What is the meaning of life?'), false);
  });

  it('rejects short fragments', () => {
    assert.equal(isLikelyClaim('Hi there'), false);
  });

  it('rejects imperatives', () => {
    assert.equal(isLikelyClaim('Please visit our website for more info.'), false);
  });

  it('rejects empty and null input', () => {
    assert.equal(isLikelyClaim(''), false);
    assert.equal(isLikelyClaim(null), false);
  });
});

describe('filterClaims', () => {
  it('keeps factual sentences and removes non-claims', () => {
    const sentences = [
      'The Sun is a star.',
      'Click here for more.',
      'Mars has two moons.',
    ];
    const claims = filterClaims(sentences);
    assert.ok(claims.length >= 1);
    assert.ok(claims.some(c => c.includes('Sun') || c.includes('Mars')));
    assert.ok(!claims.some(c => c.includes('Click')));
  });
});
