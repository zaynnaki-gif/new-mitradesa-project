import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    redisClient.on('error', (err) => {
      console.warn('Redis client error:', err);
    });
  }

  return redisClient;
};

export const clearCache = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.warn('Failed to clear cache for pattern', pattern, error);
  }
};
