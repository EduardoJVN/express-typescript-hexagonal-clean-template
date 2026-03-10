import { randomUUID } from 'crypto';
import type { RequestHandler, Request, Response, NextFunction } from 'express';
import type { ILogger } from '@domain/ports/logger.port.js';

function anonymizeIp(ip: string): string {
  // IPv6 detection: contains colon
  if (ip.includes(':')) {
    // Expand compressed :: notation to full 8-group form
    const expandIpv6 = (addr: string): string => {
      const sides = addr.split('::');
      if (sides.length === 2) {
        const left = sides[0] ? sides[0].split(':') : [];
        const right = sides[1] ? sides[1].split(':') : [];
        const missing = 8 - left.length - right.length;
        const middle = Array<string>(missing).fill('0000');
        return [...left, ...middle, ...right].map((g) => g.padStart(4, '0')).join(':');
      }
      return addr
        .split(':')
        .map((g) => g.padStart(4, '0'))
        .join(':');
    };

    const expanded = expandIpv6(ip);
    const groups = expanded.split(':');
    // Zero last 4 groups
    for (let i = 4; i < 8; i++) {
      groups[i] = '0000';
    }
    return groups.join(':');
  }

  // IPv4: zero last octet
  const parts = ip.split('.');
  parts[3] = '0';
  return parts.join('.');
}

export function createHttpTracingMiddleware(logger: ILogger): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startMs = Date.now();
    const requestId = randomUUID();
    res.locals['requestId'] = requestId;

    res.on('finish', () => {
      const durationMs = Date.now() - startMs;
      const rawIp = req.ip;
      const ip = rawIp !== undefined ? anonymizeIp(rawIp) : 'unknown';
      const userAgent = req.headers['user-agent'] ?? 'unknown';

      logger.trace('http request', {
        requestId,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        durationMs,
        userAgent,
        ip,
      });
    });

    next();
  };
}
