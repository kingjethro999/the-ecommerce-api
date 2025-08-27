import { z } from "zod";

import { ProductSchema } from "../products/products.schema";

// Base Brand schema for validation
export const BrandSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  bannerImage: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const BrandWithRelationsSchema = BrandSchema.extend({
  products: z.array(ProductSchema).optional().default([]),
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

// Schema for creating a new brand
export const CreateBrandSchema = BrandSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating a brand
export const UpdateBrandSchema = CreateBrandSchema.partial();

// Type definitions derived from the schemas
export type Brand = z.infer<typeof BrandSchema>;
export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;
export type BrandWithRelations = z.infer<typeof BrandWithRelationsSchema>;
