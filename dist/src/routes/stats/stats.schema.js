import { z } from "zod";
const ProductsPerCategorySchema = z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    productCount: z.number().int().min(0),
});
export const SatsParamSchema = z.object({
    period: z.enum(["today", "last7days", "last28days", "total"]),
});
export const SatsResponseParamSchema = z.object({
    customers: z.object({
        value: z.number(),
        change: z.number(),
    }),
    orders: z.object({
        value: z.number(),
        change: z.number(),
    }),
    products: z.object({
        value: z.number(),
        change: z.number(),
    }),
    categories: z.object({
        value: z.number(),
        change: z.number(),
    }),
    period: z.string(),
});
const PriceStatsSchema = z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    average: z.number().min(0),
});
export const ItemBriefSchema = z.object({
    label: z.string(),
    value: z.string(),
});
export const ItemsResponseSchema = z.object({
    brandOptions: z.array(ItemBriefSchema),
    productOptions: z.array(ItemBriefSchema),
    categoryOptions: z.array(ItemBriefSchema),
});
export const StatsResponseSchema = z.object({
    totalCategories: z.number().int().min(0),
    totalProducts: z.number().int().min(0),
    productsPerCategory: z.array(ProductsPerCategorySchema),
    priceStats: PriceStatsSchema,
    lastUpdated: z.string().datetime(),
});
// For error responses
export const StatsErrorResponseSchema = z.object({
    error: z.string(),
});
// Combined response type for both success and error cases
export const StatsApiResponseSchema = z.union([
    StatsResponseSchema,
    StatsErrorResponseSchema,
]);
