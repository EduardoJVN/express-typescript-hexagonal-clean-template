import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createHttpTracingMiddleware } from '../http-tracing.middleware.js';
import type { ILogger } from '@domain/ports/logger.port.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

class MockLogger implements ILogger {
  info = vi.fn();
  error = vi.fn();
  warn = vi.fn();
  debug = vi.fn();
  trace = vi.fn();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FinishListener = () => void;

function makeReq(
  overrides: Partial<{ ip: string; headers: Record<string, string> }> = {},
): Request {
  return {
    ip: overrides.ip ?? '1.2.3.4',
    method: 'GET',
    url: '/test',
    headers: overrides.headers ?? { 'user-agent': 'test-agent' },
  } as unknown as Request;
}

function makeRes(): {
  res: Response;
  locals: Record<string, unknown>;
  statusCode: number;
  emit: (event: string) => void;
} {
  const locals: Record<string, unknown> = {};
  const finishListeners: FinishListener[] = [];

  const res = {
    locals,
    statusCode: 200,
    on(event: string, listener: FinishListener) {
      if (event === 'finish') {
        finishListeners.push(listener);
      }
    },
  } as unknown as Response;

  const emit = (event: string) => {
    if (event === 'finish') {
      finishListeners.forEach((l) => l());
    }
  };

  return { res, locals, statusCode: 200, emit };
}

function makeNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createHttpTracingMiddleware', () => {
  let logger: MockLogger;

  beforeEach(() => {
    logger = new MockLogger();
  });

  it('calls next() synchronously', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq();
    const { res } = makeRes();
    const next = makeNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('attaches requestId to res.locals', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq();
    const { res, locals } = makeRes();
    const next = makeNext();

    middleware(req, res, next);

    expect(typeof locals['requestId']).toBe('string');
    expect(locals['requestId']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('does NOT log before res finish event', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq();
    const { res } = makeRes();
    const next = makeNext();

    middleware(req, res, next);

    expect(logger.trace).not.toHaveBeenCalled();
  });

  it('logs at trace level on res finish with correct payload shape', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq({ ip: '192.168.1.5', headers: { 'user-agent': 'Mozilla/5.0' } });
    const { res, locals, emit } = makeRes();
    const next = makeNext();

    middleware(req, res, next);
    emit('finish');

    expect(logger.trace).toHaveBeenCalledOnce();
    const [message, context] = logger.trace.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('http request');
    expect(context['requestId']).toBe(locals['requestId']);
    expect(context['method']).toBe('GET');
    expect(context['url']).toBe('/test');
    expect(context['status']).toBe(200);
    expect(typeof context['durationMs']).toBe('number');
    expect(context['userAgent']).toBe('Mozilla/5.0');
    expect(typeof context['ip']).toBe('string');
  });

  it('anonymizes IPv4 by zeroing last octet', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq({ ip: '192.168.1.5' });
    const { res, emit } = makeRes();

    middleware(req, res, makeNext());
    emit('finish');

    const context = logger.trace.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(context['ip']).toBe('192.168.1.0');
  });

  it('anonymizes IPv6 by zeroing last 4 groups (compressed :: notation)', () => {
    const middleware = createHttpTracingMiddleware(logger);
    // compressed IPv6: 2001:db8::1
    const req = makeReq({ ip: '2001:db8::1' });
    const { res, emit } = makeRes();

    middleware(req, res, makeNext());
    emit('finish');

    const context = logger.trace.mock.calls[0]?.[1] as Record<string, unknown>;
    const ip = context['ip'] as string;
    const groups = ip.split(':');
    expect(groups).toHaveLength(8);
    // last 4 groups must be zeroed
    expect(groups[4]).toBe('0000');
    expect(groups[5]).toBe('0000');
    expect(groups[6]).toBe('0000');
    expect(groups[7]).toBe('0000');
    // first groups preserved
    expect(groups[0]).toBe('2001');
    expect(groups[1]).toBe('0db8');
  });

  it('defaults userAgent to "unknown" when header is missing', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq({ headers: {} });
    const { res, emit } = makeRes();

    middleware(req, res, makeNext());
    emit('finish');

    const context = logger.trace.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(context['userAgent']).toBe('unknown');
  });

  it('anonymizes full (non-compressed) IPv6 by zeroing last 4 groups', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = makeReq({ ip: '2001:0db8:0000:0000:0000:0000:0000:0001' });
    const { res, emit } = makeRes();

    middleware(req, res, makeNext());
    emit('finish');

    const context = logger.trace.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(context['ip']).toBe('2001:0db8:0000:0000:0000:0000:0000:0000');
  });

  it('defaults ip to "unknown" when req.ip is undefined', () => {
    const middleware = createHttpTracingMiddleware(logger);
    const req = {
      ip: undefined,
      method: 'GET',
      url: '/test',
      headers: {},
    } as unknown as Request;
    const { res, emit } = makeRes();

    middleware(req, res, makeNext());
    emit('finish');

    const context = logger.trace.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(context['ip']).toBe('unknown');
  });
});
