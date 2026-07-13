import { z } from 'zod';
import { paginationSchema } from './common.schema';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
    }),
  ),
  shippingAddress: z.string().optional(),
});

export const orderListSchema = paginationSchema;
