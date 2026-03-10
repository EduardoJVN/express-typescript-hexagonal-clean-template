import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createJwtAuthMiddleware } from '../jwt-auth.middleware.js';
import type { ITokenSigner, TokenPayload } from '@domain/auth/ports/token-signer.port.js';
import type { ITokenBlacklist } from '@domain/auth/ports/token-blacklist.port.js';

// ─── Mocks ───────────────────────────────────────────────────────────────────

class MockTokenSigner implements ITokenSigner {
  sign = vi.fn();
  verify = vi.fn<(token: string) => TokenPayload>();
}

class MockTokenBlacklist implements ITokenBlacklist {
  add = vi.fn<(token: string, expiresAt: Date) => Promise<void>>();
  isBlacklisted = vi.fn<(token: string) => Promise<boolean>>();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function makeRes(): {
  res: Response;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  locals: Record<string, unknown>;
} {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const locals: Record<string, unknown> = {};
  const res = { status, json, locals } as unknown as Response;
  return { res, status, json, locals };
}

function makeNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('createJwtAuthMiddleware', () => {
  let tokenSigner: MockTokenSigner;
  let tokenBlacklist: MockTokenBlacklist;

  beforeEach(() => {
    tokenSigner = new MockTokenSigner();
    tokenBlacklist = new MockTokenBlacklist();
  });

  it('responds 401 when Authorization header is absent', async () => {
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when Authorization header uses wrong scheme (Basic)', async () => {
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq({ authorization: 'Basic dXNlcjpwYXNz' });
    const { res, status, json } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when token after Bearer is empty string', async () => {
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq({ authorization: 'Bearer ' });
    const { res, status, json } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when tokenSigner.verify throws', async () => {
    tokenSigner.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq({ authorization: 'Bearer bad-token' });
    const { res, status, json } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when token is blacklisted', async () => {
    tokenSigner.verify.mockReturnValue({ sub: 'user-123', email: 'user@example.com' });
    tokenBlacklist.isBlacklisted.mockResolvedValue(true);
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq({ authorization: 'Bearer valid-but-blacklisted' });
    const { res, status, json } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets res.locals.userId and calls next() on happy path', async () => {
    tokenSigner.verify.mockReturnValue({ sub: 'user-abc', email: 'user@example.com' });
    tokenBlacklist.isBlacklisted.mockResolvedValue(false);
    const middleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
    const req = makeReq({ authorization: 'Bearer valid-token' });
    const { res, status, locals } = makeRes();
    const next = makeNext();

    await middleware(req, res, next);

    expect(locals['userId']).toBe('user-abc');
    expect(next).toHaveBeenCalledOnce();
    expect(status).not.toHaveBeenCalled();
  });
});
