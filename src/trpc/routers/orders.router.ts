import { Injectable } from '@nestjs/common';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TRPCAdapter } from '../trpc.adapter';
import { OrdersService } from 'src/modules/orders/orders.service';
import { createOrderSchema, orderListSchema } from '../schemas/order.schema';

function toTrpcError(err: unknown): never {
  if (err instanceof NotFoundException)
    throw new TRPCError({ code: 'NOT_FOUND', message: err.message });
  if (err instanceof BadRequestException)
    throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

@Injectable()
export class OrdersRouter {
  constructor(
    private adapter: TRPCAdapter,
    private ordersService: OrdersService,
  ) {}

  get router() {
    const { protectedProcedure } = this.adapter;

    return this.adapter.t.router({
      create: protectedProcedure
        .input(createOrderSchema)
        .mutation(({ ctx, input }) =>
          this.ordersService.create(ctx.user.id, input).catch(toTrpcError),
        ),

      getMyOrders: protectedProcedure
        .input(orderListSchema)
        .query(({ ctx, input }) =>
          this.ordersService
            .findAllForUser(ctx.user.id, input)
            .catch(toTrpcError),
        ),

      getById: protectedProcedure
        .input(z.string())
        .query(({ ctx, input }) =>
          this.ordersService.findOne(input, ctx.user.id).catch(toTrpcError),
        ),

      cancel: protectedProcedure
        .input(z.string())
        .mutation(({ ctx, input }) =>
          this.ordersService.cancel(input, ctx.user.id).catch(toTrpcError),
        ),
    });
  }
}
