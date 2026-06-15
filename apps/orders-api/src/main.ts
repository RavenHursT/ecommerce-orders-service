import { createApp } from './bootstrap';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const server = await createApp();
  const port = process.env.PORT ?? 3001;
  server.listen(port, () => {
    Logger.log(`Orders API listening at http://localhost:${port}`, 'Bootstrap');
  });
}

void bootstrap();
