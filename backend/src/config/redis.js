import { randomUUID } from 'crypto';
import { createClient } from 'redis';
import { ENV } from './env.js';

const DEFAULT_TTL_SECONDS = 600;
const LOCK_TTL_MS = 15_000;
const LOCK_WAIT_MS = 5_000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class InMemoryTtlStore {
  constructor() {
    this.store = new Map();
  }

  prune(key) {
    const entry = this.store.get(key);
    if (entry && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry || null;
  }

  async set(key, value, mode, duration) {
    const ttlSeconds = mode === 'EX' && Number.isFinite(duration)
      ? duration
      : DEFAULT_TTL_SECONDS;
    this.store.set(key, {
      value,
      expireAt: Date.now() + (ttlSeconds * 1000),
    });
    return 'OK';
  }

  async get(key) {
    return this.prune(key)?.value ?? null;
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key) {
    const entry = this.prune(key);
    if (!entry) return -2;
    return Math.max(0, Math.ceil((entry.expireAt - Date.now()) / 1000));
  }
}

const memoryStore = new InMemoryTtlStore();
let networkClient = null;

function canUseNetworkRedis() {
  return Boolean(networkClient?.isReady);
}

function ensureProductionRedis() {
  if (ENV.NODE_ENV === 'production' && !canUseNetworkRedis()) {
    const error = new Error('Redis is required and must be reachable in production.');
    error.statusCode = 503;
    error.code = 'REDIS_UNAVAILABLE';
    throw error;
  }
}

export async function connectRedis() {
  if (!ENV.REDIS_URL) {
    if (ENV.NODE_ENV === 'production') {
      throw new Error('REDIS_URL is required in production.');
    }
    console.warn('Redis is not configured; using the in-memory TTL store for local development.');
    return false;
  }

  const client = createClient({
    url: ENV.REDIS_URL,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: (retries) => Math.min(retries * 100, 2_000),
    },
  });

  client.on('error', (error) => {
    console.error(`Redis connection error: ${error.message}`);
  });

  try {
    await client.connect();
    networkClient = client;
    console.log('Redis connected.');
    return true;
  } catch (error) {
    networkClient = null;
    if (client.isOpen) await client.disconnect();
    if (ENV.NODE_ENV === 'production') throw error;
    console.warn(`Redis unavailable; using local memory fallback: ${error.message}`);
    return false;
  }
}

export async function disconnectRedis() {
  if (!networkClient?.isOpen) return;
  const client = networkClient;
  networkClient = null;
  await client.quit();
}

async function acquireNetworkLock(key, token) {
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    const result = await networkClient.set(key, token, { NX: true, PX: LOCK_TTL_MS });
    if (result === 'OK') return true;
    await delay(50);
  }
  return false;
}

async function releaseNetworkLock(key, token) {
  await networkClient.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    { keys: [key], arguments: [token] },
  );
}

export const redisClient = {
  async set(key, value, mode, duration) {
    if (canUseNetworkRedis()) {
      const ttlSeconds = mode === 'EX' && Number.isFinite(duration)
        ? duration
        : DEFAULT_TTL_SECONDS;
      return networkClient.set(key, value, { EX: ttlSeconds });
    }
    ensureProductionRedis();
    return memoryStore.set(key, value, mode, duration);
  },

  async get(key) {
    if (canUseNetworkRedis()) return networkClient.get(key);
    ensureProductionRedis();
    return memoryStore.get(key);
  },

  async del(key) {
    if (canUseNetworkRedis()) return networkClient.del(key);
    ensureProductionRedis();
    return memoryStore.del(key);
  },

  async ttl(key) {
    if (canUseNetworkRedis()) return networkClient.ttl(key);
    ensureProductionRedis();
    return memoryStore.ttl(key);
  },

  async withLock(resourceKey, operation) {
    if (!canUseNetworkRedis()) {
      ensureProductionRedis();
      return operation();
    }

    const lockKey = `lock:${resourceKey}`;
    const token = randomUUID();
    const acquired = await acquireNetworkLock(lockKey, token);
    if (!acquired) {
      const error = new Error('The room is busy. Please try again.');
      error.statusCode = 503;
      error.code = 'ROOM_LOCK_TIMEOUT';
      throw error;
    }

    try {
      return await operation();
    } finally {
      await releaseNetworkLock(lockKey, token);
    }
  },
};
