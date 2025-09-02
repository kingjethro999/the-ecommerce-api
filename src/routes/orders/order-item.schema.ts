import { z } from "zod";

import { ProductSchema } from "../products/products.schema";

// Base OrderItem schema for validation
export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string().min(1, "Order ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  imageUrl: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const OrderItemWithRelationsSchema = OrderItemSchema.extend({
  product: ProductSchema.optional(),
});

export const IdParamSchema = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: "00b4766213f0732810a29d8a",
    }),
});

// Schema for creating a new order item
export const CreateOrderItemSchema = OrderItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating an order item
export const UpdateOrderItemSchema = CreateOrderItemSchema.partial();

// Type definitions derived from the schemas
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderItemInput = z.infer<typeof CreateOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof UpdateOrderItemSchema>;
export type OrderItemWithRelations = z.infer<
  typeof OrderItemWithRelationsSchema
>;
