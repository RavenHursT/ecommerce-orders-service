import { loadMonorepoEnv } from './load-env';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { orderProcessingNodeHandler } from './queues/order-processing';

loadMonorepoEnv();

export type ExpressApp = ReturnType<typeof express>;

export async function createApp(): Promise<ExpressApp> {
  const server = express();

  if (!process.env.VERCEL_DEPLOYMENT_ID) {
    server.post('/api/queues/process-order', orderProcessingNodeHandler);
  }

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.init();
  return server;
}
