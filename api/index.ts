import 'dotenv/config';
import { createApp } from '../server/app.ts';
import { ensureStorageReady } from '../server/storage.ts';

const app = createApp();

let initPromise: Promise<void> | null = null;
function getStorageReadyPromise(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureStorageReady().catch((err) => {
      console.error('Storage initialization warning in Vercel handler:', err);
      initPromise = null;
    });
  }
  return initPromise;
}

// Ensure storage & database tables/seeds are ready before handling requests
app.use(async (_req, _res, next) => {
  try {
    await getStorageReadyPromise();
  } catch {
    // Continue into express route handlers
  }
  next();
});

export default app;
