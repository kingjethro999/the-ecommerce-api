import { z } from "zod";

import { CategorySchema } from "../categories/categories.schema";

// Base Department schema for validation

export const DepartmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  bannerImage: z.string().min(1, "Banner image is required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const DepartmentWithRelationsSchema = DepartmentSchema.extend({
  categories: z.array(CategorySchema).optional().default([]),
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

export const CreateDepartmentSchema = DepartmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const NavDepartmentSchema = DepartmentSchema.omit({
  createdAt: true,
  updatedAt: true,
  bannerImage: true,
  description: true,
  isActive: true,
});
export const DetailDepartmentSchema = DepartmentSchema.omit({
  createdAt: true,
  updatedAt: true,
  isActive: true,
});
export const DepartmentCategorySchema = NavDepartmentSchema.extend({
  categories: z.array(
    CategorySchema.omit({
      createdAt: true,
      updatedAt: true,
      bannerImage: true,
      description: true,
      isActive: true,
      departmentId: true,
    })
  ),
});
export const DetailDepartmentCategorySchema = DetailDepartmentSchema.extend({
  categories: z.array(
    CategorySchema.omit({
      createdAt: true,
      updatedAt: true,
      bannerImage: true,
      description: true,
      isActive: true,
      departmentId: true,
    })
  ),
});

// Schema for updating a department
export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// Type definitions derived from the schemas
export type Department = z.infer<typeof DepartmentSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type DepartmentWithRelations = z.infer<
  typeof DepartmentWithRelationsSchema
>;
