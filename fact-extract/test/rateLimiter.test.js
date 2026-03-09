import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/rateLimiter.js';

describe('createRateLimiter', () => {
  it('creates a limiter function', () => {
    const limiter = createRateLimiter(60);
    assert.equal(typeof limiter, 'function');
  });

  it('returns a promise', async () => {
    const limiter = createRateLimiter(6000);
    const result = limiter();
    assert.ok(result instanceof Promise);
    await result;
  });

  it('assigns sequential slots to concurrent callers', async () => {
    const limiter = createRateLimiter(60); // 1 per second
    const timestamps = [];

    // Fire 3 calls concurrently
    await Promise.all([
      limiter().then(() => timestamps.push(Date.now())),
      limiter().then(() => timestamps.push(Date.now())),
      limiter().then(() => timestamps.push(Date.now())),
    ]);

    // Second call should be ~1s after first, third ~1s after second
    const gap1 = timestamps[1] - timestamps[0];
    const gap2 = timestamps[2] - timestamps[1];

    assert.ok(gap1 >= 800, `Gap1 too short: ${gap1}ms (expected ~1000ms)`);
    assert.ok(gap2 >= 800, `Gap2 too short: ${gap2}ms (expected ~1000ms)`);
  });
});
