import { createApp } from '../src/create-app';
import type { INestApplication } from '@nestjs/common';

let appPromise: Promise<INestApplication> | null = null;

function getApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

export default async (req: any, res: any) => {
  const app = await getApp();
  const expressApp = app.getHttpAdapter().getInstance();

  return new Promise<void>((resolve, reject) => {
    res.once('finish', resolve);
    res.once('error', reject);
    expressApp(req, res);
  });
};
