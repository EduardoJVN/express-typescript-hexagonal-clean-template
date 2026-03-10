import type { RequestHandler, Request, Response, NextFunction } from 'express';
import type { ITokenSigner } from '@domain/auth/ports/token-signer.port.js';
import type { ITokenBlacklist } from '@domain/auth/ports/token-blacklist.port.js';

export function createJwtAuthMiddleware(
  tokenSigner: ITokenSigner,
  tokenBlacklist: ITokenBlacklist,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    if (token === '') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let payload: ReturnType<ITokenSigner['verify']>;
    try {
      payload = tokenSigner.verify(token);
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const blacklisted = await tokenBlacklist.isBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.locals['userId'] = payload.sub;
    next();
  };
}
