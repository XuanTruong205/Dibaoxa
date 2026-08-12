import { describe, expect, it } from 'vitest';
import { redisClient } from '../src/config/redis.js';

describe('room hold storage', () => {
  it('stores values with a TTL and deletes them explicitly', async () => {
    const key = `test:hold:${Date.now()}`;

    await redisClient.set(key, 'reserved', 'EX', 30);

    expect(await redisClient.get(key)).toBe('reserved');
    expect(await redisClient.ttl(key)).toBeGreaterThan(0);
    expect(await redisClient.del(key)).toBe(1);
    expect(await redisClient.get(key)).toBeNull();
  });

  it('executes a guarded operation in local fallback mode', async () => {
    const result = await redisClient.withLock('test-room', async () => 'done');
    expect(result).toBe('done');
  });
});
