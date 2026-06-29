import { Logger } from '@nestjs/common';
import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  Logger.error('Error starting the application:', error);
  process.exit(1);
});
