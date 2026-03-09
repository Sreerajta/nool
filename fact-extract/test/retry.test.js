import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../src/retry.js';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const result = await withRetry(() => Promise.resolve('ok'));
    assert.equal(result, 'ok');
  });

  it('retries on rate limit error and succeeds', async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) {
        const err = new Error('rate limit exceeded');
        err.status = 429;
        throw err;
      }
      return Promise.resolve('ok');
    };

    const result = await withRetry(fn, { maxRetries: 3 });
    assert.equal(result, 'ok');
    assert.equal(attempts, 3);
  });

  it('throws after max retries exhausted', async () => {
    const fn = () => {
      const err = new Error('rate limit exceeded');
      err.status = 429;
      throw err;
    };

    await assert.rejects(
      () => withRetry(fn, { maxRetries: 1 }),
      { message: 'rate limit exceeded' },
    );
  });

  it('does not retry non-retryable errors', async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      throw new Error('invalid api key');
    };

    await assert.rejects(
      () => withRetry(fn, { maxRetries: 3 }),
      { message: 'invalid api key' },
    );
    assert.equal(attempts, 1);
  });

  it('calls onRetry callback', async () => {
    let retryCount = 0;
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('rate limit');
        err.status = 429;
        throw err;
      }
      return Promise.resolve('ok');
    };

    await withRetry(fn, {
      maxRetries: 3,
      onRetry: () => { retryCount++; },
    });
    assert.equal(retryCount, 1);
  });

  it('retries on 529 overloaded error', async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('overloaded');
        err.status = 529;
        throw err;
      }
      return Promise.resolve('ok');
    };

    const result = await withRetry(fn, { maxRetries: 2 });
    assert.equal(result, 'ok');
  });
});
