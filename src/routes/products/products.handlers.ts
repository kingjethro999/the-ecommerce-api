import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { products as productsTable, categories, brands, orderItems, orders } from "@/lib/schema";
import { and, desc, eq, ilike, ne, sql, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  AllDealRoute,
  CreateRoute,
  DashboardListRoute,
  DealRoute,
  GetOneBySlugRoute,
  GetOneRoute,
  ListRoute,
  RemoveRoute,
  SearchRoute,
  TopProductsRoute,
  UpdateRoute,
} from "./products.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      imageUrl: productsTable.imageUrl,
      price: productsTable.price,
      discount: productsTable.discount,
      stockQty: productsTable.stockQty,
      isActive: productsTable.isActive,
      createdAt: productsTable.createdAt,
      categoryId: productsTable.categoryId,
      brandId: productsTable.brandId,
      categoryName: categories.name,
      brandTitle: brands.title,
    })
    .from(productsTable)
    .leftJoin(categories, eq(productsTable.categoryId, categories.id))
    .leftJoin(brands, eq(productsTable.brandId, brands.id))
    .orderBy(desc(productsTable.createdAt));

  const shaped = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.imageUrl,
    price: r.price,
    discount: r.discount,
    stockQty: r.stockQty,
    isActive: r.isActive,
    createdAt: r.createdAt,
    category: r.categoryName ? { name: r.categoryName, id: r.categoryId } : null,
    brand: r.brandTitle ? { title: r.brandTitle, id: r.brandId } : null,
  }));
  return c.json(shaped);
};
export const top: AppRouteHandler<TopProductsRoute> = async (c) => {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      total: sql<number>`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0)`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
    })
    .from(productsTable)
    .leftJoin(orderItems, eq(productsTable.id, orderItems.productId))
    .groupBy(productsTable.id, productsTable.name)
    .orderBy(desc(sql`COUNT(${orderItems.id})`))
    .limit(4);
  const transformedProducts = rows.map((r: any) => ({ id: r.id, name: r.name, total: Number(r.total || 0), count: Number(r.orderCount || 0) }));
  return c.json(transformedProducts);
};
export const deal: AppRouteHandler<DealRoute> = async (c) => {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      discount: productsTable.discount,
      summary: productsTable.summary,
      imageUrl: productsTable.imageUrl,
      stockQty: productsTable.stockQty,
    })
    .from(productsTable)
    .limit(8);
  return c.json(rows);
};
export const dashboardList: AppRouteHandler<DashboardListRoute> = async (c) => {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      discount: productsTable.discount,
      imageUrl: productsTable.imageUrl,
      createdAt: productsTable.createdAt,
      stockQty: productsTable.stockQty,
      isActive: productsTable.isActive,
      lowStockAlert: productsTable.lowStockAlert,
      categoryId: productsTable.categoryId,
      categoryName: categories.name,
    })
    .from(productsTable)
    .leftJoin(categories, eq(productsTable.categoryId, categories.id))
    .orderBy(desc(productsTable.createdAt));
  const shaped = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: r.price,
    discount: r.discount,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
    stockQty: r.stockQty,
    isActive: r.isActive,
    lowStockAlert: r.lowStockAlert,
    category: r.categoryName ? { id: r.categoryId, name: r.categoryName } : null,
  }));
  return c.json(shaped);
};
export const allDeal: AppRouteHandler<AllDealRoute> = async (c) => {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      discount: productsTable.discount,
      imageUrl: productsTable.imageUrl,
      stockQty: productsTable.stockQty,
    })
    .from(productsTable);
  return c.json(rows);
};
export interface HotProduct {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
  image: string;
  stock: number;
}

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

  // Check if category exists if provided
  if (data.categoryId) {
    const catRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);
    const category = catRows[0];

    if (!category) {
      return c.json(
        {
          message: "Category not found",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  // Check if brand exists if provided
  if (data.brandId) {
    const brandRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, data.brandId))
      .limit(1);
    const brand = brandRows[0];

    if (!brand) {
      return c.json(
        {
          message: "Brand not found",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  // Check if slug is unique
  const existingProduct = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.slug, data.slug))
    .limit(1);

  if (existingProduct.length > 0) {
    return c.json(
      {
        message: "Product with this slug already exists",
      },
      HttpStatusCodes.CONFLICT
    );
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      imageUrl: (data as any).imageUrl ?? null,
      productImages: (data as any).productImages ?? [],
      description: (data as any).description ?? null,
      summary: (data as any).summary ?? null,
      isActive: (data as any).isActive ?? true,
      isFeatured: (data as any).isFeatured ?? false,
      isDeal: (data as any).isDeal ?? false,
      price: data.price,
      buyingPrice: (data as any).buyingPrice ?? null,
      dealPrice: (data as any).dealPrice ?? null,
      stockQty: (data as any).stockQty ?? null,
      lowStockAlert: (data as any).lowStockAlert ?? 5,
      discount: (data as any).discount ?? null,
      categoryId: (data as any).categoryId ?? null,
      frequentlyBoughtTogetherItemIds: (data as any).frequentlyBoughtTogetherItemIds ?? [],
      brandId: (data as any).brandId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning({ id: productsTable.id });

  return c.json(product, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");
  // console.log("PRODUCT ID----:", id);

  const rows = await db
    .select({
      ...productsTable,
      categoryName: categories.name,
      categorySlug: categories.slug,
      brandTitle: brands.title,
    })
    // @ts-expect-error drizzle spreads
    .from(productsTable)
    .leftJoin(categories, eq(productsTable.categoryId, categories.id))
    .leftJoin(brands, eq(productsTable.brandId, brands.id))
    .where(eq(productsTable.id, id))
    .limit(1);
  const base = rows[0] as any;

  if (!base) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  const shaped = {
    ...base,
    category: base.categoryId
      ? { id: base.categoryId, name: base.categoryName, slug: base.categorySlug, department: null }
      : null,
    brand: base.brandId ? { id: base.brandId, title: base.brandTitle } : null,
  } as any;

  return c.json(shaped, HttpStatusCodes.OK);
};
export const getOneBySlug: AppRouteHandler<GetOneBySlugRoute> = async (c) => {
  const { slug } = c.req.valid("param");

  const prodRows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      discount: productsTable.discount,
      summary: productsTable.summary,
      description: productsTable.description,
      frequentlyBoughtTogetherItemIds: productsTable.frequentlyBoughtTogetherItemIds,
      imageUrl: productsTable.imageUrl,
      productImages: productsTable.productImages,
      stockQty: productsTable.stockQty,
      categoryId: productsTable.categoryId,
    })
    .from(productsTable)
    .where(eq(productsTable.slug, slug))
    .limit(1);
  const product = prodRows[0] as any;

  if (!product) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  const similarProducts = await db
    .select({ id: productsTable.id, name: productsTable.name, slug: productsTable.slug, price: productsTable.price, discount: productsTable.discount, imageUrl: productsTable.imageUrl })
    .from(productsTable)
    .where(and(eq(productsTable.categoryId, product.categoryId), ne(productsTable.id, product.id)))
    .limit(6);
  const fbtIds = (product.frequentlyBoughtTogetherItemIds as string[]) ?? [];
  const frequentlyBoughtTogether = fbtIds.length
    ? await db
        .select({ id: productsTable.id, name: productsTable.name, imageUrl: productsTable.imageUrl, price: productsTable.price, stockQty: productsTable.stockQty })
        .from(productsTable)
        .where(and(inArray(productsTable.id, fbtIds), sql`${productsTable.stockQty} > 0`))
    : [];
  const result = {
    ...product,
    similarProducts,
    frequentlyBoughtTogether,
  };

  return c.json(result, HttpStatusCodes.OK);
};
export const search: AppRouteHandler<SearchRoute> = async (c) => {
  const { query } = c.req.query();

  // If no query provided, return empty results or all products (based on your preference)
  if (!query) {
    return c.json([]);
  }

  const q = `%${(query || "").toLowerCase()}%`;
  const rows = await db
    .select({ id: productsTable.id, name: productsTable.name, slug: productsTable.slug, price: productsTable.price, discount: productsTable.discount, summary: productsTable.summary, imageUrl: productsTable.imageUrl, stockQty: productsTable.stockQty })
    .from(productsTable)
    .where(sql`LOWER(${productsTable.name}) LIKE ${q} OR LOWER(${productsTable.summary}) LIKE ${q}`)
    .limit(8);
  return c.json(rows);
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

  const existingRows = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, id)).limit(1);
  const existingProduct = existingRows[0];

  if (!existingProduct) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if category exists if being updated
  if (data.categoryId) {
    const catRows = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId)).limit(1);
    const category = catRows[0];

    if (!category) {
      return c.json(
        {
          message: "Category not found",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  // Check if brand exists if being updated
  if (data.brandId) {
    const brandRows = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, data.brandId)).limit(1);
    const brand = brandRows[0];

    if (!brand) {
      return c.json(
        {
          message: "Brand not found",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }
  }

  // Check if slug is unique if slug is being updated
  if (data.slug && data.slug !== (existingProduct as any).slug) {
    const slugRows = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, data.slug)).limit(1);
    const productWithSlug = slugRows[0];

    if (productWithSlug) {
      return c.json(
        {
          message: "Product with this slug already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }
  }

  const [updated] = await db
    .update(productsTable)
    .set({
      name: data.name,
      slug: data.slug,
      imageUrl: (data as any).imageUrl ?? null,
      productImages: (data as any).productImages ?? [],
      description: (data as any).description ?? null,
      summary: (data as any).summary ?? null,
      isActive: (data as any).isActive ?? true,
      isFeatured: (data as any).isFeatured ?? false,
      isDeal: (data as any).isDeal ?? false,
      price: data.price,
      buyingPrice: (data as any).buyingPrice ?? null,
      dealPrice: (data as any).dealPrice ?? null,
      stockQty: (data as any).stockQty ?? null,
      lowStockAlert: (data as any).lowStockAlert ?? 5,
      discount: (data as any).discount ?? null,
      categoryId: (data as any).categoryId ?? null,
      frequentlyBoughtTogetherItemIds: (data as any).frequentlyBoughtTogetherItemIds ?? [],
      brandId: (data as any).brandId ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(productsTable.id, id))
    .returning();

  const catJoin = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.id, (updated as any).categoryId))
    .limit(1);
  const categoryObj = catJoin[0] ? { id: catJoin[0].id, name: catJoin[0].name } : null;
  const brandJoin = await db
    .select({ id: brands.id, title: brands.title })
    .from(brands)
    .where(eq(brands.id, (updated as any).brandId))
    .limit(1);
  const brandObj = brandJoin[0] ? { id: brandJoin[0].id, title: brandJoin[0].title } : null;

  const updatedProduct = { ...(updated as any), category: categoryObj, brand: brandObj } as any;

  return c.json(updatedProduct, HttpStatusCodes.OK);
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

  const pr = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, id)).limit(1);
  const product = pr[0];

  if (!product) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if product has order items or sales
  const orderItemCount = await db
    .select({ cnt: sql<number>`COUNT(${orderItems.id})` })
    .from(orderItems)
    .where(eq(orderItems.productId, id));
  if (Number(orderItemCount[0]?.cnt ?? 0) > 0) {
    return c.json(
      {
        message: "Cannot delete product with existing orders or sales",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await db.delete(productsTable).where(eq(productsTable.id, id));

  return c.json(
    {
      message: "Product deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
