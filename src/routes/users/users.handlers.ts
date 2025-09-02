import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { eq, and, desc, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/schema";

import type {
  CreateRoute,
  CustomerOrdersRoute,
  CustomersRoute,
  GetOneRoute,
  ListRoute,
  RegisterRoute,
  LoginRoute,
  RemoveRoute,
  UpdateRoute,
} from "./users.routes";
import env from "@/env";
import { sign } from "hono/jwt";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const shaped = userList.map((u: any) => ({
    ...u,
    firstName: u.name,
    lastName: u.name,
  }));
  return c.json(shaped);
};

export const customers: AppRouteHandler<CustomersRoute> = async (c) => {
  const customersWithOrders = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
      orderCount: count(orders.id).as("orderCount"),
    })
    .from(users)
    .leftJoin(orders, eq(users.id, orders.userId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return c.json(customersWithOrders);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid("json");
  const { password, ...userData } = data as any;

  let hashedPassword: string | undefined;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const insertValues = {
    id: randomUUID(),
    name: (userData as any).name ?? `${(userData as any).firstName ?? ""} ${(userData as any).lastName ?? ""}`.trim(),
    // phone is NOT NULL + UNIQUE in DB. Generate a unique placeholder if missing.
    phone: (userData as any).phone ?? `AUTO-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    email: (userData as any).email,
    image: (userData as any).image ?? null,
    role: (userData as any).role ?? "ADMIN",
    password: hashedPassword ?? null,
    status: (userData as any).status ?? "ACTIVE",
    isVerified: (userData as any).isVerified ?? true,
    token: (userData as any).token ?? null,
    resetExpiry: (userData as any).resetExpiry ?? null,
    roleId: (userData as any).roleId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;

  const [user] = await db.insert(users).values(insertValues as any).returning();

  const { password: _pw, ...userWithoutPassword } = user as any;
  return c.json(userWithoutPassword, HttpStatusCodes.OK);
};

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid("json") as any;
  const { email, password, name } = data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ id: (existing[0] as any).id }, HttpStatusCodes.OK);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [user] = await db.insert(users).values({
    id: randomUUID(),
    email,
    name,
    // phone is NOT NULL + UNIQUE in DB. Generate a unique placeholder.
    phone: `AUTO-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    password: hashedPassword,
    isVerified: true,
    status: "ACTIVE",
    role: "USER",
    image: null,
    emailVerified: null,
    token: null,
    resetExpiry: null,
    roleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any).returning();

  return c.json({ id: (user as any).id }, HttpStatusCodes.OK);
};

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { email, password } = c.req.valid("json") as any;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0] as any;
  if (!user || !user.password) {
    return c.json({ message: "Invalid email or password" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return c.json({ message: "Invalid email or password" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const token = await sign({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET);
  return c.json({ token, id: user.id, email: user.email }, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const user = rows[0] as any;
  if (!user) {
    return c.json({ message: "Not Found" }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json({
    ...user,
    firstName: user.name,
    lastName: user.name,
  }, HttpStatusCodes.OK);
};

export const customerOrders: AppRouteHandler<CustomerOrdersRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const user = userRows[0];
  if (!user) {
    return c.json({ message: "Not Found" }, HttpStatusCodes.NOT_FOUND);
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, id))
    .orderBy(desc(orders.createdAt));

  const ordersWithItems = orderRows.map((o: any) => ({ ...o, orderItems: [] }));

  return c.json({ ...user, orders: ordersWithItems }, HttpStatusCodes.OK);
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json") as any;

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (exists.length === 0) {
    return c.json({ message: "Not Found" }, HttpStatusCodes.NOT_FOUND);
  }

  const [updated] = await db
    .update(users)
    .set({ ...(data as any), updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  const { password: _pw, ...userWithoutPassword } = updated as any;
  return c.json(userWithoutPassword, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (exists.length === 0) {
    return c.json({ message: "Not Found" }, HttpStatusCodes.NOT_FOUND);
  }

  await db.delete(users).where(eq(users.id, id));

  return c.json({ message: "User Deleted Successfully" }, HttpStatusCodes.OK);
};
