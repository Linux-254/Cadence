import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.ts';
import { HEARTBEAT_WEB_S } from './server/config.ts';
import { runLapseSweep } from './server/sessionMath.ts';
import { ensureStorageReady, getStorageEngine } from './server/storage.ts';

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  await ensureStorageReady();
  const app = createApp();

  // Background heartbeat lapse checker synchronized with shared config (local Node / preview)
  setInterval(() => {
    void runLapseSweep().catch((err) => {
      console.error('Lapse sweep error:', err);
    });
  }, HEARTBEAT_WEB_S * 1000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
      return res.status(404).send('Not found');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Cadence MERN server listening on http://0.0.0.0:${PORT} (storage: ${getStorageEngine()})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start Cadence server:', err);
  process.exit(1);
});
