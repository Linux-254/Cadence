import type express from 'express';
import { storage } from './storage.ts';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

export interface RateLimiterStore {
  consume(key: string, max: number, windowMs: number): Promise<RateLimitResult>;
}

class MemoryRateLimiterStore implements RateLimiterStore {
  private buckets = new Map<string, { count: number; resetMs: number }>();

  async consume(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetMs <= now) {
      const resetMs = now + windowMs;
      this.buckets.set(key, { count: 1, resetMs });
      if (this.buckets.size > 5000) {
        for (const [k, v] of this.buckets) {
          if (v.resetMs <= now) this.buckets.delete(k);
        }
      }
      return { allowed: true, remaining: Math.max(0, max - 1), resetAt: new Date(resetMs).toISOString() };
    }
    const nextCount = existing.count + 1;
    existing.count = nextCount;
    return {
      allowed: nextCount <= max,
      remaining: Math.max(0, max - nextCount),
      resetAt: new Date(existing.resetMs).toISOString(),
    };
  }
}

class StorageRateLimiterStore implements RateLimiterStore {
  async consume(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    return storage.consumeRateLimit(key, max, windowMs);
  }
}

const memoryStore = new MemoryRateLimiterStore();
const dbStore = new StorageRateLimiterStore();

export function getRateLimiterStore(): RateLimiterStore {
  // Use storage-backed limiter on Vercel / multi-instance deployments; memory in single-process local dev
  return process.env.VERCEL ? dbStore : memoryStore;
}

export function rateLimit(options: { keyPrefix: string; max: number; windowMs: number }): express.RequestHandler {
  return async (req, res, next) => {
    try {
      const userPart = (req as express.Request & { user?: { id: string } }).user?.id || req.ip || 'anon';
      const bucketKey = `${options.keyPrefix}:${userPart}`;
      const result = await getRateLimiterStore().consume(bucketKey, options.max, options.windowMs);

      res.setHeader('RateLimit-Limit', String(options.max));
      res.setHeader('RateLimit-Remaining', String(result.remaining));
      res.setHeader('RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests. Please wait a moment before trying again.',
          resetAt: result.resetAt,
        });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
