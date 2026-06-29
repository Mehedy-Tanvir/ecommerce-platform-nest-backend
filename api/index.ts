import { createApp } from '../src/create-app';

let handler: any;

export default async (req: any, res: any) => {
  if (!handler) {
    const app = await createApp();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    const { default: serverless } = await import('serverless-http');
    handler = serverless(expressApp);
  }
  return handler(req, res);
};
