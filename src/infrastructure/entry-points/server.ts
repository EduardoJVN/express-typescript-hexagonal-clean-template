import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import type { Application, Request, Response, NextFunction } from 'express';
import type { IErrorReporter } from '@domain/ports/error-reporter.port.js';
import type { ITokenSigner } from '@domain/auth/ports/token-signer.port.js';
import type { ITokenBlacklist } from '@domain/auth/ports/token-blacklist.port.js';
import { createJwtAuthMiddleware } from '@infra/auth/entry-points/middlewares/jwt-auth.middleware.js';
import { openApiSpec } from '@infra/entry-points/docs/openapi.js';
import { ENV } from '@infra/config/env.config.js';

export function createServer(
  errorReporter: IErrorReporter,
  tokenSigner: ITokenSigner,
  tokenBlacklist: ITokenBlacklist,
): Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  if (ENV.NODE_ENV === 'development') {
    app.use('/swagger', swaggerUi.serve);
    app.get('/swagger', swaggerUi.setup(openApiSpec));
    app.get('/swagger.json', (_req, res) => {
      res.json(openApiSpec);
    });
  }

  // const jwtMiddleware = createJwtAuthMiddleware(tokenSigner, tokenBlacklist);
  createJwtAuthMiddleware(tokenSigner, tokenBlacklist);

  app.use('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  // 404 handler — no route matched
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler — catches errors forwarded via next(err)

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    errorReporter.report(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
