import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TRPCAdapter } from '../trpc.adapter';
import { ProductsService } from 'src/modules/products/products.service';

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

const getAllSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  sku: z.string().min(1),
  categoryId: z.string(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const updateProductSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().min(1).optional(),
    categoryId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateStockSchema = z.object({
  id: z.string(),
  quantity: z.number().int(),
});

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
        .input(getAllSchema)
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
