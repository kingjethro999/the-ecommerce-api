import { z } from "zod";
// Base Banner schema for validation
export const BannerSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    imageUrl: z.string().min(1, "Image URL is required"),
    mobileImageUrl: z.string().optional().nullable(),
    linkUrl: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
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
// Schema for creating a new banner
export const CreateBannerSchema = BannerSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const HomeBannerSchema = BannerSchema.omit({
    createdAt: true,
    updatedAt: true,
    description: true,
    isActive: true,
});
// Schema for updating a banner
export const UpdateBannerSchema = CreateBannerSchema.partial();
