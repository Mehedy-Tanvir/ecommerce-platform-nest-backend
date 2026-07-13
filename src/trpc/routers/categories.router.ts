import { Injectable } from '@nestjs/common';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TRPCAdapter } from '../trpc.adapter';
import { CategoryService } from 'src/modules/category/category.service';

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
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const updateCategorySchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

@Injectable()
export class CategoriesRouter {
  constructor(
    private adapter: TRPCAdapter,
    private categoryService: CategoryService,
  ) {}

  get router() {
    const { procedure, adminProcedure } = this.adapter;

    return this.adapter.t.router({
      getAll: procedure
        .input(getAllSchema)
        .query(({ input }) =>
          this.categoryService.findAll(input).catch(toTrpcError),
        ),

      getById: procedure
        .input(z.string())
        .query(({ input }) =>
          this.categoryService.findOne(input).catch(toTrpcError),
        ),

      getBySlug: procedure
        .input(z.string())
        .query(({ input }) =>
          this.categoryService.findOneBySlug(input).catch(toTrpcError),
        ),

      create: adminProcedure
        .input(createCategorySchema)
        .mutation(({ input }) =>
          this.categoryService.createCategory(input).catch(toTrpcError),
        ),

      update: adminProcedure
        .input(updateCategorySchema)
        .mutation(({ input }) =>
          this.categoryService
            .updateCategory(input.id, input.data)
            .catch(toTrpcError),
        ),

      delete: adminProcedure
        .input(z.string())
        .mutation(({ input }) =>
          this.categoryService.deleteCategory(input).catch(toTrpcError),
        ),
    });
  }
}
