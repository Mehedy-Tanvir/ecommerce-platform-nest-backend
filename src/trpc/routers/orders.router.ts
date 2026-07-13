import { Injectable } from '@nestjs/common';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TRPCAdapter } from '../trpc.adapter';
import { OrdersService } from 'src/modules/orders/orders.service';

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

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
    }),
  ),
  shippingAddress: z.string().optional(),
});

const getMyOrdersSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
});

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
        .input(getMyOrdersSchema)
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
