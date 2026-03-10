import { reportBootstrap } from '@infra/config/bootstrap-reporter.js';
import { ENV } from '@infra/config/env.config.js';
import { prisma } from '@infra/config/prisma.js';
import { Logger } from '@infra/adapters/pino-logger.adapter.js';
import { LogErrorReporter } from '@infra/adapters/log-error-reporter.adapter.js';
import { createAppModule } from '@infra/modules/app.module.js';
import { createServer } from '@infra/entry-points/server.js';

async function bootstrap() {
  const logger = new Logger(ENV.LOG_LEVEL);
  const errorReporter = new LogErrorReporter(logger);

  process.on('uncaughtException', (err) => {
    errorReporter.report(err, { type: 'uncaughtException' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    errorReporter.report(reason, { type: 'unhandledRejection' });
    process.exit(1);
  });

  await prisma.$connect();
  logger.info('Database connected');

  const { auth } = await createAppModule();

  const app = createServer(logger, errorReporter, auth.tokenSigner, auth.tokenBlacklist);

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(ENV.PORT, () => {
    reportBootstrap(logger);
  });
}

bootstrap();
