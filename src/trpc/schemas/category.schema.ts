import { z } from 'zod';
import { paginationSchema } from './common.schema';

export const categoryFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateCategorySchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
});
