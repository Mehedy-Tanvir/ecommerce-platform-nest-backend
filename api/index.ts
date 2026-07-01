import { createApp } from '../src/create-app';

export default async (req: any, res: any) => {
  const app = await createApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();

  try {
    await new Promise<void>((resolve, reject) => {
      res.once('finish', resolve);
      res.once('error', reject);
      expressApp(req, res);
    });
  } finally {
    // Don't await — let Lambda return immediately, cleanup runs in background
    app.close().catch(() => {});
  }
};
