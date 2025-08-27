import { z } from "zod";
import { CategorySchema } from "../categories/categories.schema.js";
// Base Product schema for validation
export const ProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    imageUrl: z.string().optional().nullable(),
    productImages: z.array(z.string()).default([]),
    frequentlyBoughtTogetherItemIds: z.array(z.string()).default([]),
    description: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isDeal: z.boolean().default(false),
    price: z.number().min(0, "Price must be positive"),
    buyingPrice: z
        .number()
        .min(0, "Buying price must be positive")
        .optional()
        .nullable(),
    dealPrice: z
        .number()
        .min(0, "Deal price must be positive")
        .optional()
        .nullable(),
    stockQty: z
        .number()
        .min(0, "Stock quantity must be positive")
        .optional()
        .nullable(),
    lowStockAlert: z
        .number()
        .min(0, "Low stock alert must be positive")
        .default(5)
        .optional()
        .nullable(),
    discount: z
        .number()
        .min(0)
        .max(100, "Discount must be between 0 and 100")
        .optional()
        .nullable(),
    categoryId: z.string().optional().nullable(),
    brandId: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional().nullable(),
});
export const ResponseProductSchema = ProductSchema.omit({
    createdAt: true,
    updatedAt: true,
    brandId: true,
    lowStockAlert: true,
    dealPrice: true,
    buyingPrice: true,
    isActive: true,
    isDeal: true,
    isFeatured: true,
});
export const DashboardResponseProductSchema = ProductSchema.omit({
    updatedAt: true,
    brandId: true,
    lowStockAlert: true,
    dealPrice: true,
    buyingPrice: true,
    isDeal: true,
    isFeatured: true,
    summary: true,
    productImages: true,
    frequentlyBoughtTogetherItemIds: true,
});
export const SimilarProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    imageUrl: z.string().optional().nullable(),
    price: z.number().min(0, "Price must be positive"),
    discount: z
        .number()
        .min(0)
        .max(100, "Discount must be between 0 and 100")
        .optional()
        .nullable(),
});
export const FBPSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    imageUrl: z.string().optional().nullable(),
    price: z.number().min(0, "Price must be positive"),
});
export const ProductDetailSchema = ResponseProductSchema.extend({
    similarProducts: SimilarProductSchema.array().optional().nullable(),
    frequentlyBoughtProducts: FBPSchema.array().optional().nullable(),
});
export const ProductWithRelationsSchema = ProductSchema.extend({
    category: CategorySchema.optional().nullable(),
});
export const DashboardProductSchema = DashboardResponseProductSchema.extend({
    category: CategorySchema.omit({
        createdAt: true,
        updatedAt: true,
        slug: true,
        image: true,
        bannerImage: true,
        description: true,
        isActive: true,
        departmentId: true,
    })
        .optional()
        .nullable(),
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
export const SlugParamSchema = z.object({
    slug: z.string().min(3).openapi({
        example: "product-name",
    }),
});
export const SearchParamSchema = z.object({
    query: z.string().min(1).openapi({
        example: "product-name",
    }),
});
// Schema for creating a new product
export const CreateProductSchema = ProductSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const DealProductSchema = ProductSchema.omit({
    createdAt: true,
    updatedAt: true,
    productImages: true,
    description: true,
    isActive: true,
    isFeatured: true,
    isDeal: true,
    buyingPrice: true,
    dealPrice: true,
    frequentlyBoughtTogetherItemIds: true,
    lowStockAlert: true,
    categoryId: true,
    brandId: true,
});
// Schema for updating a product
export const UpdateProductSchema = CreateProductSchema.partial();
export const TopProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name  is required"),
    total: z.number(),
    count: z.number(),
});
