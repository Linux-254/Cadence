import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.ts';
import { ensureStorageReady } from '../server/storage.ts';

const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureStorageReady();
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
