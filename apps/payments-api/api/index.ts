import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp, type ExpressApp } from '../src/bootstrap';

let cachedServer: ExpressApp | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cachedServer = cachedServer ?? (await createApp());
  return cachedServer(req, res);
}
