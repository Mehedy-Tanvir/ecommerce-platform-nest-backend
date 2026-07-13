import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

export async function createContext(
  opts: CreateExpressContextOptions,
  jwtService: JwtService,
  prisma: PrismaService,
) {
  const { req, res } = opts;
  let user: { id: string; email: string; role: Role } | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = await jwtService.verifyAsync(token);
      user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });
    } catch {
      // Token invalid or expired — user stays null
    }
  }

  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;
