import { createApp } from '../src/create-app';
import { PrismaService } from '../src/prisma/prisma.service';

export default async (req: any, res: any) => {
  const app = await createApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  // @ts-ignore — serverless-http is installed at build time on Vercel
  const { default: serverless } = await import('serverless-http');
  const handler = serverless(expressApp);

  try {
    return await handler(req, res);
  } finally {
    try {
      const prismaService = app.get(PrismaService);
      await prismaService.$disconnect();
    } catch (e) {
      // Ignore disconnect errors — pool may already be closed
    }
    try {
      await app.close();
    } catch (e) {
      // Ignore close errors — app may already be closed
    }
  }
};
