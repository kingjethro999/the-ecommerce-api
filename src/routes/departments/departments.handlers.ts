import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { db } from "@/lib/db";
import { departments, categories } from "@/lib/schema";
import { count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  CatListRoute,
  CreateRoute,
  GetOneBySlugRoute,
  GetOneRoute,
  ListRoute,
  NavListRoute,
  RemoveRoute,
  UpdateRoute,
} from "./departments.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const rows = await db
    .select({
      id: departments.id,
      title: departments.title,
      slug: departments.slug,
      bannerImage: departments.bannerImage,
      description: departments.description,
      isActive: departments.isActive,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
      categoriesCount: count(categories.id).as("categoriesCount"),
    })
    .from(departments)
    .leftJoin(categories, eq(departments.id, categories.departmentId))
    .groupBy(
      departments.id,
      departments.title,
      departments.slug,
      departments.bannerImage,
      departments.description,
      departments.isActive,
      departments.createdAt,
      departments.updatedAt,
    )
    .orderBy(desc(departments.createdAt));

  const shaped = rows.map((d: any) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    bannerImage: d.bannerImage,
    description: d.description,
    isActive: d.isActive,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    _count: { categories: Number(d.categoriesCount ?? 0) },
  }));

  return c.json(shaped);
};
export const navList: AppRouteHandler<NavListRoute> = async (c) => {
  const rows = await db
    .select({ id: departments.id, slug: departments.slug, title: departments.title })
    .from(departments);
  return c.json(rows);
};
export const catList: AppRouteHandler<CatListRoute> = async (c) => {
  const deptRows = await db
    .select({ id: departments.id, slug: departments.slug, title: departments.title })
    .from(departments);

  const catRows = await db
    .select({
      id: categories.id,
      image: categories.image,
      name: categories.name,
      slug: categories.slug,
      departmentId: categories.departmentId,
    })
    .from(categories);

  const catByDept = new Map<string, any[]>();
  for (const cat of catRows) {
    const list = catByDept.get(cat.departmentId) ?? [];
    list.push({ id: cat.id, image: cat.image, name: cat.name, slug: cat.slug });
    catByDept.set(cat.departmentId, list);
  }
  const shaped = deptRows.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    categories: catByDept.get(d.id) ?? [],
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
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.slug, data.slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        message: "Department with this slug already exists",
      },
      HttpStatusCodes.CONFLICT
    );
  }

  const [created] = await db
    .insert(departments)
    .values({
      id: randomUUID(),
      title: data.title,
      slug: data.slug,
      bannerImage: data.bannerImage,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      updatedAt: new Date(),
    } as any)
    .returning({ id: departments.id });

  return c.json(created, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const deptRows = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  const department = deptRows[0];

  if (!department) {
    return c.json(
      {
        message: "Department not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, image: categories.image })
    .from(categories)
    .where(eq(categories.departmentId, id));

  return c.json({ ...department, categories: cats }, HttpStatusCodes.OK);
};
export const getOneBySlug: AppRouteHandler<GetOneBySlugRoute> = async (c) => {
  const { slug } = c.req.valid("param");

  // Fetch base department (without categories first)
  const baseRows = await db
    .select({
      id: departments.id,
      title: departments.title,
      slug: departments.slug,
      bannerImage: departments.bannerImage,
      description: departments.description,
    })
    .from(departments)
    .where(eq(departments.slug, slug))
    .limit(1);
  const baseDepartment = baseRows[0];

  if (!baseDepartment) {
    return c.json(
      {
        message: "Department not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Special case: "general" department should list ALL categories
  if (slug === "general") {
    const cats = await db
      .select({ name: categories.name, id: categories.id, slug: categories.slug, image: categories.image })
      .from(categories);

    const result = {
      ...baseDepartment,
      categories: cats,
    };

    return c.json(result, HttpStatusCodes.OK);
  }

  // Default behavior: categories only within this department
  const cats = await db
    .select({ name: categories.name, id: categories.id, slug: categories.slug, image: categories.image })
    .from(categories)
    .where(eq(categories.departmentId, baseDepartment.id));

  const result = {
    ...baseDepartment,
    categories: cats,
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
    .select({ id: departments.id, slug: departments.slug })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  const existingDepartment = existingRows[0];

  if (!existingDepartment) {
    return c.json(
      {
        message: "Department not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if slug is unique if slug is being updated
  if (data.slug && data.slug !== existingDepartment.slug) {
    const slugRows = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.slug, data.slug))
      .limit(1);
    const departmentWithSlug = slugRows[0];

    if (departmentWithSlug) {
      return c.json(
        {
          message: "Department with this slug already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }
  }

  const [updatedDepartment] = await db
    .update(departments)
    .set({
      title: data.title,
      slug: data.slug,
      bannerImage: data.bannerImage,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      updatedAt: new Date(),
    } as any)
    .where(eq(departments.id, id))
    .returning({ id: departments.id });

  return c.json(updatedDepartment, HttpStatusCodes.OK);
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

  const deptRows = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  const department = deptRows[0];

  if (!department) {
    return c.json(
      {
        message: "Department not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if department has categories
  const [{ cnt }] = await db
    .select({ cnt: count(categories.id).as("cnt") })
    .from(categories)
    .where(eq(categories.departmentId, id));
  if (Number(cnt ?? 0) > 0) {
    return c.json(
      {
        message: "Cannot delete department with existing categories",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await db.delete(departments).where(eq(departments.id, id));

  return c.json(
    {
      message: "Department deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
