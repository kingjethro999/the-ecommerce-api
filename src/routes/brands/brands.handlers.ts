import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { brands, products, categories } from "@/lib/schema";
import { count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  RemoveRoute,
  UpdateRoute,
} from "./brands.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const rows = await db
    .select({
      id: brands.id,
      title: brands.title,
      slug: brands.slug,
      bannerImage: brands.bannerImage,
      logo: brands.logo,
      description: brands.description,
      isActive: brands.isActive,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      productsCount: count(products.id).as("productsCount"),
    })
    .from(brands)
    .leftJoin(products, eq(brands.id, products.brandId))
    .groupBy(
      brands.id,
      brands.title,
      brands.slug,
      brands.bannerImage,
      brands.logo,
      brands.description,
      brands.isActive,
      brands.createdAt,
      brands.updatedAt,
    )
    .orderBy(desc(brands.createdAt));

  const shaped = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    bannerImage: r.bannerImage,
    logo: r.logo,
    description: r.description,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
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

  // Check if slug is unique
  const existing = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, data.slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        message: "Brand with this slug already exists",
      },
      HttpStatusCodes.CONFLICT
    );
  }

  const [brand] = await db
    .insert(brands)
    .values({
      id: randomUUID(),
      title: data.title,
      slug: data.slug,
      bannerImage: (data as any).bannerImage ?? null,
      logo: (data as any).logo ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning();

  return c.json(brand, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const brandRows = await db
    .select()
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
  const brand = brandRows[0] as any;

  if (!brand) {
    return c.json(
      {
        message: "Brand not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  const prods = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      imageUrl: products.imageUrl,
      price: products.price,
      discount: products.discount,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(eq(products.brandId, id));

  const catIds = Array.from(new Set(prods.map((p) => p.categoryId).filter(Boolean))) as string[];
  const catRows = catIds.length
    ? await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, catIds[0]))
    : [];
  const categoryById = new Map(catRows.map((c) => [c.id, c]));

  const shaped = {
    ...brand,
    products: prods.map((p) => ({
      ...p,
      category: p.categoryId ? categoryById.get(p.categoryId) : null,
    })),
  } as any;

  return c.json(shaped, HttpStatusCodes.OK);
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
    .select({ id: brands.id, slug: brands.slug })
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
  const existingBrand = existingRows[0];

  if (!existingBrand) {
    return c.json(
      {
        message: "Brand not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if slug is unique if slug is being updated
  if (data.slug && data.slug !== existingBrand.slug) {
    const slugRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, data.slug))
      .limit(1);
    const brandWithSlug = slugRows[0];

    if (brandWithSlug) {
      return c.json(
        {
          message: "Brand with this slug already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }
  }

  const [updatedBrand] = await db
    .update(brands)
    .set({
      title: data.title,
      slug: data.slug,
      bannerImage: (data as any).bannerImage ?? null,
      logo: (data as any).logo ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      updatedAt: new Date(),
    } as any)
    .where(eq(brands.id, id))
    .returning();

  return c.json(updatedBrand, HttpStatusCodes.OK);
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

  const brandRows = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
  const brand = brandRows[0];

  if (!brand) {
    return c.json(
      {
        message: "Brand not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  const [{ cnt }] = await db
    .select({ cnt: count(products.id).as("cnt") })
    .from(products)
    .where(eq(products.brandId, id));
  if (Number(cnt ?? 0) > 0) {
    return c.json(
      {
        message: "Cannot delete brand with existing products",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await db.delete(brands).where(eq(brands.id, id));

  return c.json(
    {
      message: "Brand deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
