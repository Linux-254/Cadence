import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { storage, stripPasswordHash } from './storage.ts';
import type { UserProfile } from '../src/types/cadence.ts';

const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function signAccessToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + 15 * 60_000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAccessToken(token: string): { sub: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      exp: number;
    };
    if (!parsed.sub || Date.now() > parsed.exp) return null;
    return { sub: parsed.sub };
  } catch {
    return null;
  }
}

export function setRefreshCookie(res: Response, rawToken: string) {
  res.cookie('cadence_refresh', rawToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('cadence_refresh', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
  });
}

export interface AuthedRequest extends Request {
  user?: UserProfile;
  authSource?: 'web' | 'extension';
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (bearer.startsWith('ext_')) {
      const extUserId = await storage.findUserIdByExtensionTokenHash(hashToken(bearer));
      if (!extUserId) {
        return res.status(401).json({ error: 'Invalid or revoked extension token.' });
      }
      const userRecord = await storage.findUserById(extUserId);
      if (!userRecord) return res.status(401).json({ error: 'User not found.' });
      req.user = stripPasswordHash(userRecord);
      req.authSource = 'extension';
      return next();
    }

    let userId: string | null = null;
    if (bearer) {
      const verified = verifyAccessToken(bearer);
      if (verified) userId = verified.sub;
    }

    if (!userId) {
      const refreshCookie = parseCookieValue(req.headers.cookie, 'cadence_refresh');
      if (refreshCookie) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          const hasRequestedWith = req.headers['x-requested-with'] === 'XMLHttpRequest';
          const origin = req.headers.origin;
          const host = req.headers['x-forwarded-host'] || req.headers.host;
          const originMatchesHost = origin && host && origin.includes(String(host));
          if (!hasRequestedWith && !originMatchesHost) {
            return res.status(403).json({ error: 'CSRF validation failed.' });
          }
        }
        const rt = await storage.findValidRefreshToken(hashToken(refreshCookie));
        if (rt && new Date(rt.expiresAt).getTime() > Date.now()) {
          userId = rt.userId;
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRecord = await storage.findUserById(userId);
    if (!userRecord) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }

    req.user = stripPasswordHash(userRecord);
    req.authSource = 'web';
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    let userId: string | null = null;
    if (bearer) {
      if (bearer.startsWith('ext_')) {
        userId = await storage.findUserIdByExtensionTokenHash(hashToken(bearer));
      } else {
        const verified = verifyAccessToken(bearer);
        if (verified) userId = verified.sub;
      }
    }
    if (!userId) {
      const refreshCookie = parseCookieValue(req.headers.cookie, 'cadence_refresh');
      if (refreshCookie) {
        const rt = await storage.findValidRefreshToken(hashToken(refreshCookie));
        if (rt && new Date(rt.expiresAt).getTime() > Date.now()) {
          userId = rt.userId;
        }
      }
    }
    if (userId) {
      const userRecord = await storage.findUserById(userId);
      if (userRecord) req.user = stripPasswordHash(userRecord);
    }
  } catch {
    // Non-fatal optional auth
  }
  return next();
}

export function parseCookieValue(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === key) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

