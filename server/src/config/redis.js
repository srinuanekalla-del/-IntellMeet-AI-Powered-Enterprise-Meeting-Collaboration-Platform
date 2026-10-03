import Redis from 'ioredis';

/**
 * Single shared Redis client used for:
 * - caching session/meeting data
 * - the Socket.io Redis adapter (for horizontal scaling across nodes)
 */
export const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 500, 2000);
  },
});

let hasWarnedRedisDown = false;
redisClient.on('connect', () => console.log('[Redis] connected'));
redisClient.on('error', (err) => {
  if (!hasWarnedRedisDown) {
    console.error('[Redis] not available:', err.message, '(caching/session features disabled)');
    hasWarnedRedisDown = true;
  }
});

