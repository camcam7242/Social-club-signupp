import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis error:', err));

export const connectRedis = async () => {
  await redis.connect();
  console.log('Redis connected');
};

export const setCache = async (key: string, value: unknown, ttlSeconds = 300) => {
  await redis.setEx(key, ttlSeconds, JSON.stringify(value));
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const deleteCache = async (key: string) => redis.del(key);
