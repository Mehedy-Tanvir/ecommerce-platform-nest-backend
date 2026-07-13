import { z } from 'zod';
import { paginationSchema } from './common.schema';

export const productFilterSchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
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

export const updateStockSchema = z.object({
  id: z.string(),
  quantity: z.number().int(),
});
