// import type { PrismaClient } from '@prisma/client';
import { createAuthModule, type AuthModule } from '@infra/auth/module/auth.module.js';
// import type { ILogger } from '@domain/ports/logger.port.js';

export interface AppModule {
  auth: AuthModule;
}

export async function createAppModule(): Promise<AppModule> {
  const auth = await createAuthModule();

  return { auth };
}
