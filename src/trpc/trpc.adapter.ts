import { initTRPC, TRPCError } from '@trpc/server';
import { Injectable, Logger } from '@nestjs/common';
import type { TRPCRootObject } from '@trpc/server';
import {
  createExpressMiddleware,
  CreateExpressContextOptions,
} from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context, createContext } from './context';

@Injectable()
export class TRPCAdapter {
  private readonly logger = new Logger(TRPCAdapter.name);
  t!: TRPCRootObject<Context, object, any>;
  procedure: any;
  protectedProcedure: any;
  adminProcedure: any;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.t = initTRPC.context<Context>().create({
      errorFormatter: ({ shape, error }) => ({
        ...shape,
        data: {
          ...shape.data,
          success: false,
          message: error.message ?? 'An error occurred',
        },
      }),
    });

    this.procedure = this.t.procedure;
    this.protectedProcedure = this.t.procedure.use(
      this.t.middleware(async ({ ctx, next }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }
        return next({ ctx: { ...ctx, user: ctx.user } });
      }),
    );
    this.adminProcedure = this.protectedProcedure.use(
      this.t.middleware(async ({ ctx, next }) => {
        if (!ctx.user || ctx.user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }
        return next({ ctx });
      }),
    );
  }

  getMiddleware(appRouter: import('./trpc.router').AppRouter) {
    return createExpressMiddleware({
      router: appRouter,
      createContext: (opts: CreateExpressContextOptions) =>
        createContext(opts, this.jwtService, this.prisma),
    });
  }
}
