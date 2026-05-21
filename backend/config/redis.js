const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null, // stop retrying - use in-memory fallback
    });

    let redisErrorLogged = false;
    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('error', (err) => {
      if (!redisErrorLogged) {
        redisErrorLogged = true;
        logger.warn(`⚠️  Redis unavailable (${err.message || 'connection refused'}) - using in-memory fallback`);
      }
    });

    redisClient.connect().catch(() => {});

  } catch (error) {
    logger.warn(`⚠️  Redis setup failed: ${error.message} - using in-memory fallback`);
  }
};

// In-memory fallback store for rate limiting when Redis is unavailable
const memoryStore = new Map();

const getRedisClient = () => redisClient;

// Rate limiting helpers
const incrementKey = async (key, ttlSeconds = 60) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return current;
    }
  } catch (err) {
    // fall through to memory
  }

  // Memory fallback
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  entry.count++;
  return entry.count;
};

const getKey = async (key) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      return await redisClient.get(key);
    }
  } catch (err) {}
  const entry = memoryStore.get(key);
  return entry ? entry.count : null;
};

const setKey = async (key, value, ttlSeconds) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      return ttlSeconds
        ? await redisClient.setex(key, ttlSeconds, value)
        : await redisClient.set(key, value);
    }
  } catch (err) {}
  memoryStore.set(key, { count: value, expiresAt: Date.now() + (ttlSeconds || 3600) * 1000 });
};

const deleteKey = async (key) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      return await redisClient.del(key);
    }
  } catch (err) {}
  memoryStore.delete(key);
};

module.exports = { connectRedis: connectRedis, getRedisClient, incrementKey, getKey, setKey, deleteKey };
module.exports.default = connectRedis;
