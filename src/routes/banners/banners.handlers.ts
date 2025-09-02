import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { banners } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  RemoveRoute,
  UpdateRoute,
} from "./banners.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const rows = await db
    .select({
      id: banners.id,
      title: banners.title,
      linkUrl: banners.linkUrl,
      imageUrl: banners.imageUrl,
      mobileImageUrl: banners.mobileImageUrl,
      description: banners.description,
    })
    .from(banners)
    .where(eq(banners.isActive, true as any))
    .orderBy(desc(banners.createdAt));
  return c.json(rows);
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

  const [banner] = await db
    .insert(banners)
    .values({
      id: randomUUID(),
      title: data.title,
      linkUrl: (data as any).linkUrl ?? null,
      imageUrl: data.imageUrl,
      mobileImageUrl: (data as any).mobileImageUrl ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning();

  return c.json(banner, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const res = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  const banner = res[0];

  if (!banner) {
    return c.json(
      {
        message: "Banner not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(banner, HttpStatusCodes.OK);
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

  const exist = await db.select({ id: banners.id }).from(banners).where(eq(banners.id, id)).limit(1);
  const existingBanner = exist[0];

  if (!existingBanner) {
    return c.json(
      {
        message: "Banner not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  const [updatedBanner] = await db
    .update(banners)
    .set({
      title: data.title,
      linkUrl: (data as any).linkUrl ?? null,
      imageUrl: data.imageUrl,
      mobileImageUrl: (data as any).mobileImageUrl ?? null,
      description: (data as any).description ?? null,
      isActive: (data as any).isActive ?? true,
      updatedAt: new Date(),
    } as any)
    .where(eq(banners.id, id))
    .returning();

  return c.json(updatedBanner, HttpStatusCodes.OK);
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

  const br = await db.select({ id: banners.id }).from(banners).where(eq(banners.id, id)).limit(1);
  const banner = br[0];

  if (!banner) {
    return c.json(
      {
        message: "Banner not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  await db.delete(banners).where(eq(banners.id, id));

  return c.json(
    {
      message: "Banner deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
