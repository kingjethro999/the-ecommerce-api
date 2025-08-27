import bcrypt from "bcryptjs";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import prisma from "prisma/db";

import type {
  CreateRoute,
  CustomerOrdersRoute,
  CustomersRoute,
  GetOneRoute,
  ListRoute,
  RegisterRoute,
  RemoveRoute,
  UpdateRoute,
} from "./users.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      image: true,
      createdAt: true,
    },
  });
  return c.json(users);
};
export const customers: AppRouteHandler<CustomersRoute> = async (c) => {
  const customers = await prisma.user.findMany({
    where: {
      orders: {
        some: {},
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      name: true,
      image: true,
      _count: {
        select: {
          orders: true,
        },
      },
      createdAt: true,
    },
  });
  interface CustomerWithOrderCount {
    id: string;
    email: string;
    name: string;
    image: string | null;
    createdAt: Date;
    _count: {
      orders: number;
    };
  }

  const res = customers.map((customer: { id: string; clerkUserId: string; email: string; name: string; image: string | null; _count: { orders: number }; createdAt: Date }) => ({
    id: customer.id,
    clerkUserId: customer.clerkUserId,
    email: customer.email,
    name: customer.name,
    image: customer.image,
    orderCount: customer._count.orders,
    createdAt: customer.createdAt.toISOString()
  }));
  
  return c.json(res);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid("json");
  const { password, ...userData } = data;

  // Hash password if provided
  let hashedPassword;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const user = await prisma.user.create({
    data: {
      ...userData,
      ...(hashedPassword && { password: hashedPassword }),
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return c.json(userWithoutPassword, HttpStatusCodes.OK);
};
export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid("json");
  const clerkUserId = data.clerkUserId;
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      id: true,
    },
  });
  if (existingUser) {
    return c.json(existingUser, HttpStatusCodes.OK);
  }
  const user = await prisma.user.create({
    data,
    select: {
      id: true,
    },
  });
  return c.json(user, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return c.json(
      {
        message: "Not Found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(user, HttpStatusCodes.OK);
};
export const customerOrders: AppRouteHandler<CustomerOrdersRoute> = async (
  c
) => {
  const { id } = c.req.valid("param");
  const orders = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      clerkUserId: true,
      image: true,
      orders: {
        select: {
          id: true,
          orderNumber: true,
          totalOrderAmount: true,
          transactionId: true,
          paymentStatus: true,
          orderStatus: true,
          userId: true,
          trackingNumber: true,
          stripeCustomerId: true,
          stripePaymentIntentId: true,
          orderItems: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!orders) {
    return c.json(
      {
        message: "Not Found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(orders, HttpStatusCodes.OK);
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return c.json(
      {
        message: "Not Found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  const { ...userData } = data;

  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      ...userData,
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = updatedUser;

  return c.json(userWithoutPassword, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return c.json(
      {
        message: "Not Found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  await prisma.user.delete({
    where: {
      id,
    },
  });

  return c.json(
    {
      message: "User Deleted Successfully",
    },
    HttpStatusCodes.OK
  );
};
