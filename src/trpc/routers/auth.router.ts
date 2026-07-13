import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';

import { TRPCAdapter } from '../trpc.adapter';
import { AuthService } from 'src/modules/auth/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../schemas/auth.schema';

function toTrpcError(err: unknown): never {
  if (err instanceof ConflictException)
    throw new TRPCError({ code: 'CONFLICT', message: err.message });
  if (err instanceof UnauthorizedException)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: err.message });
  if (err instanceof InternalServerErrorException)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message,
    });
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

@Injectable()
export class AuthRouter {
  constructor(
    private adapter: TRPCAdapter,
    private authService: AuthService,
  ) {}

  get router() {
    const { procedure, protectedProcedure } = this.adapter;

    return this.adapter.t.router({
      register: procedure
        .input(registerSchema)
        .mutation(({ input }) =>
          this.authService.register(input).catch(toTrpcError),
        ),

      login: procedure
        .input(loginSchema)
        .mutation(({ input }) =>
          this.authService.login(input).catch(toTrpcError),
        ),

      refresh: protectedProcedure
        .input(refreshSchema)
        .mutation(({ ctx }) =>
          this.authService.refreshTokens(ctx.user.id).catch(toTrpcError),
        ),

      logout: protectedProcedure.mutation(({ ctx }) =>
        this.authService.logout(ctx.user.id).catch(toTrpcError),
      ),

      me: protectedProcedure.query(
        ({ ctx }) => ctx.user as { id: string; email: string; role: string },
      ),
    });
  }
}
