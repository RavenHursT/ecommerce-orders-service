import { createApp } from './bootstrap';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const server = await createApp();
  const port = process.env.PORT ?? 3002;
  server.listen(port, () => {
    Logger.log(`Warehouses API listening at http://localhost:${port}`, 'Bootstrap');
  });
}

void bootstrap();
