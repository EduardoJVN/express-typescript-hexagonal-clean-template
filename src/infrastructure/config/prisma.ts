import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from '@infra/config/env.config.js';

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
