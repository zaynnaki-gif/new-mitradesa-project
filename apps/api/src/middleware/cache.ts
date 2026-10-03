import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../services/redis.js';

/**
 * Cache middleware for Express
 * @param duration Cache duration in seconds
 * @param prefix Prefix for cache key
 */
export const cacheMiddleware = (duration: number, prefix: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const client = getRedisClient();
    if (!client) {
      return next();
    }

    // Create a unique key based on URL and query params
    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cachedData = await client.get(key);
      
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }

      // If not in cache, intercept response.send
      const originalSend = res.send;
      res.send = function (body: any): Response {
        res.setHeader('X-Cache', 'MISS');
        // Cache the response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.setex(key, duration, typeof body === 'string' ? body : JSON.stringify(body)).catch(err => {
            console.warn('Failed to set cache for', key, err);
          });
        }
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error);
      next();
    }
  };
};
