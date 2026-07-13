import { Injectable } from '@nestjs/common';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TRPCAdapter } from '../trpc.adapter';
import { ProductsService } from 'src/modules/products/products.service';
import {
  productFilterSchema,
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../schemas/product.schema';

function toTrpcError(err: unknown): never {
  if (err instanceof NotFoundException)
    throw new TRPCError({ code: 'NOT_FOUND', message: err.message });
  if (err instanceof ConflictException)
    throw new TRPCError({ code: 'CONFLICT', message: err.message });
  if (err instanceof BadRequestException)
    throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

@Injectable()
export class ProductsRouter {
  constructor(
    private adapter: TRPCAdapter,
    private productsService: ProductsService,
  ) {}

  get router() {
    const { procedure, adminProcedure } = this.adapter;
    return this.adapter.t.router({
      getAll: procedure
        .input(productFilterSchema)
        .query(({ input }) =>
          this.productsService.findAll(input).catch(toTrpcError),
        ),

      getById: procedure
        .input(z.string())
        .query(({ input }) =>
          this.productsService.findOne(input).catch(toTrpcError),
        ),

      create: adminProcedure
        .input(createProductSchema)
        .mutation(({ input }) =>
          this.productsService.create(input).catch(toTrpcError),
        ),

      update: adminProcedure
        .input(updateProductSchema)
        .mutation(({ input }) =>
          this.productsService.update(input.id, input.data).catch(toTrpcError),
        ),

      updateStock: adminProcedure
        .input(updateStockSchema)
        .mutation(({ input }) =>
          this.productsService
            .updateProductStock(input.id, input.quantity)
            .catch(toTrpcError),
        ),

      delete: adminProcedure
        .input(z.string())
        .mutation(({ input }) =>
          this.productsService.deleteProduct(input).catch(toTrpcError),
        ),
    });
  }
}
