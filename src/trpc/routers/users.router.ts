import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TRPCAdapter } from '../trpc.adapter';
import { UsersService } from 'src/modules/users/users.service';

function toTrpcError(err: unknown): never {
  if (err instanceof NotFoundException)
    throw new TRPCError({ code: 'NOT_FOUND', message: err.message });
  if (err instanceof ConflictException)
    throw new TRPCError({ code: 'CONFLICT', message: err.message });
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

@Injectable()
export class UsersRouter {
  constructor(
    private adapter: TRPCAdapter,
    private usersService: UsersService,
  ) {}

  get router() {
    const { protectedProcedure } = this.adapter;

    return this.adapter.t.router({
      getProfile: protectedProcedure.query(({ ctx }) =>
        this.usersService.findOne(ctx.user.id).catch(toTrpcError),
      ),

      updateProfile: protectedProcedure
        .input(updateProfileSchema)
        .mutation(({ ctx, input }) =>
          this.usersService.update(ctx.user.id, input).catch(toTrpcError),
        ),

      changePassword: protectedProcedure
        .input(changePasswordSchema)
        .mutation(({ ctx, input }) =>
          this.usersService
            .changePassword(ctx.user.id, input)
            .catch(toTrpcError),
        ),
    });
  }
}
