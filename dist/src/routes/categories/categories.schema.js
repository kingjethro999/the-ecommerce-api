import { z } from "zod";
export const CategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    image: z.string().min(1, "Image is required"),
    bannerImage: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    departmentId: z.string().min(1, "Department ID is required"),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional().nullable(),
});
export const SimilarCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    image: z.string().min(1, "Image is required"),
});
export const CategoryProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    imageUrl: z.string().optional().nullable(),
    price: z.number().min(0, "Image is required"),
    discount: z
        .number()
        .min(0)
        .max(100, "Discount must be between 0 and 100")
        .optional()
        .nullable(),
});
export const CategoryWithRelationsSchema = CategorySchema.omit({
    slug: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    image: true,
}).extend({
    products: CategoryProductSchema.array().optional().default([]),
    similarCategories: SimilarCategorySchema.array().optional(),
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
        example: "category-name",
    }),
});
export const CreatedIdSchema = z.object({
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
// Schema for creating a new category
export const CreateCategorySchema = CategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Schema for updating a category
export const UpdateCategorySchema = CreateCategorySchema.partial();
// export type CategoryWithRelations = z.infer<typeof CategoryWithRelationsSchema>;
