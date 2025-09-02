import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { categories, departments, products } from "@/lib/schema";
import { count, desc, eq, ne, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  RemoveRoute,
  UpdateRoute,
} from "./categories.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image,
      bannerImage: categories.bannerImage,
      description: categories.description,
      isActive: categories.isActive,
      departmentId: categories.departmentId,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productsCount: count(products.id).as("productsCount"),
      departmentTitle: departments.title,
    })
    .from(categories)
    .leftJoin(products, eq(categories.id, products.categoryId))
    .leftJoin(departments, eq(categories.departmentId, departments.id))
    .groupBy(
      categories.id,
      categories.name,
      categories.slug,
      categories.image,
      categories.bannerImage,
      categories.description,
      categories.isActive,
      categories.departmentId,
      categories.createdAt,
      categories.updatedAt,
      departments.title,
    )
    .orderBy(desc(categories.createdAt));

  const shaped = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: r.image,
    bannerImage: r.bannerImage,
    description: r.description,
    isActive: r.isActive,
    departmentId: r.departmentId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    department: { title: r.departmentTitle },
    _count: { products: Number(r.productsCount ?? 0) },
  }));

  return c.json(shaped);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const data = c.req.valid("json");

  // Check if department exists
  const depRows = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, data.departmentId))
    .limit(1);
  const department = depRows[0];

  if (!department) {
    return c.json(
      {
        message: "Department not found",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  // Check if slug is unique
  const existingCategory = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, data.slug))
    .limit(1);

  if (existingCategory.length > 0) {
    return c.json(
      {
        message: "Category with this slug already exists",
      },
      HttpStatusCodes.CONFLICT
    );
  }

  const [category] = await db
    .insert(categories)
    .values({
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      image: data.image,
      bannerImage: data.bannerImage ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      departmentId: data.departmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning();

  return c.json(category, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { slug } = c.req.valid("param");

  const catRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      bannerImage: categories.bannerImage,
      description: categories.description,
      departmentId: categories.departmentId,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  const category = catRows[0] as any;

  if (!category) {
    return c.json(
      {
        message: "Category not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  const similarCategories = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, image: categories.image })
    .from(categories)
    .where(and(eq(categories.departmentId, category.departmentId), ne(categories.id, category.id)));
  const result = {
    ...category,
    similarCategories,
  };

  return c.json(result, HttpStatusCodes.OK);
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const existingRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  const existingCategory = existingRows[0];

  if (!existingCategory) {
    return c.json(
      {
        message: "Category not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if department exists if departmentId is being updated
  if (data.departmentId) {
    const depRows2 = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, data.departmentId))
      .limit(1);
    const department = depRows2[0];

    if (!department) {
      return c.json(
        {
          message: "Department not found",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  // Check if slug is unique if slug is being updated
  if (data.slug && data.slug !== existingCategory.slug) {
    const slugRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1);
    const categoryWithSlug = slugRows[0];

    if (categoryWithSlug) {
      return c.json(
        {
          message: "Category with this slug already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }
  }

  const [updatedCategory] = await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug,
      image: data.image,
      bannerImage: data.bannerImage ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      departmentId: data.departmentId,
      updatedAt: new Date(),
    } as any)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  return c.json(updatedCategory, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { id } = c.req.valid("param");

  const cat = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  const category = cat[0];

  if (!category) {
    return c.json(
      {
        message: "Category not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if category has products
  const [{ cnt }] = await db
    .select({ cnt: count(products.id).as("cnt") })
    .from(products)
    .where(eq(products.categoryId, id));
  if (Number(cnt ?? 0) > 0) {
    return c.json(
      {
        message: "Cannot delete category with existing products",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await db.delete(categories).where(eq(categories.id, id));

  return c.json(
    {
      message: "Category deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
