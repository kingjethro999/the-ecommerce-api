// import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { orders as ordersTable, orderItems, users as usersTable } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";

import type {
  ListRoute,
  RecentOrderRoute,
  UserOrdersRoute,
} from "./orders.routes";

import { startOfDay, subDays } from "date-fns";

// import prisma from "prisma/db";

// import type {
//   CreateRoute,
//   GetOneRoute,
//   ListRoute,
//   RemoveRoute,
//   UpdateRoute,
// } from "./orders.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  try {
    const { period = "today" } = c.req.query();

    const now = new Date();
    const today = startOfDay(now);

    let dateFilter = {};

    switch (period) {
      case "today":
        dateFilter = { createdAt: { gte: today } };
        break;

      case "last7days":
        const sevenDaysAgo = startOfDay(subDays(today, 7));
        dateFilter = { createdAt: { gte: sevenDaysAgo } };
        break;

      case "last28days":
        const twentyEightDaysAgo = startOfDay(subDays(today, 28));
        dateFilter = { createdAt: { gte: twentyEightDaysAgo } };
        break;

      case "total":
        dateFilter = {}; // No filter for total
        break;

      default:
        dateFilter = { createdAt: { gte: today } };
    }

    let baseQuery = db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        paymentStatus: ordersTable.paymentStatus,
        totalOrderAmount: ordersTable.totalOrderAmount,
        createdAt: ordersTable.createdAt,
        userId: ordersTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userImage: usersTable.image,
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id));

    if ((dateFilter as any).createdAt?.gte) {
      baseQuery = baseQuery.where(sql`${ordersTable.createdAt} >= ${(dateFilter as any).createdAt.gte}`);
    }

    const rows = await baseQuery.orderBy(desc(ordersTable.createdAt));

    const orderIds = rows.map((r) => r.id);
    const items = orderIds.length
      ? await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            imageUrl: orderItems.imageUrl,
            title: orderItems.title,
          })
          .from(orderItems)
          .where(sql`${orderItems.orderId} = ANY(${orderIds})`)
      : [];
    const itemsByOrder = new Map<string, any[]>();
    for (const it of items) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push(it);
      itemsByOrder.set(it.orderId, list);
    }

    const shaped = rows.map((r: any) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      paymentStatus: r.paymentStatus,
      totalOrderAmount: r.totalOrderAmount,
      createdAt: r.createdAt,
      orderItems: itemsByOrder.get(r.id) ?? [],
      user: { id: r.userId, name: r.userName, email: r.userEmail, image: r.userImage },
    }));

    return c.json(shaped, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
export const userOrders: AppRouteHandler<UserOrdersRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const userRows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (userRows.length === 0) {
      return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const rows = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        paymentStatus: ordersTable.paymentStatus,
        totalOrderAmount: ordersTable.totalOrderAmount,
        createdAt: ordersTable.createdAt,
        userId: ordersTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userImage: usersTable.image,
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
      .where(eq(ordersTable.userId, id))
      .orderBy(desc(ordersTable.createdAt));

    const orderIds = rows.map((r) => r.id);
    const items = orderIds.length
      ? await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            imageUrl: orderItems.imageUrl,
            title: orderItems.title,
          })
          .from(orderItems)
          .where(sql`${orderItems.orderId} = ANY(${orderIds})`)
      : [];
    const itemsByOrder = new Map<string, any[]>();
    for (const it of items) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push(it);
      itemsByOrder.set(it.orderId, list);
    }

    const shaped = rows.map((r: any) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      paymentStatus: r.paymentStatus,
      totalOrderAmount: r.totalOrderAmount,
      createdAt: r.createdAt,
      orderItems: itemsByOrder.get(r.id) ?? [],
      user: { id: r.userId, name: r.userName, email: r.userEmail, image: r.userImage },
    }));

    return c.json(shaped, HttpStatusCodes.OK);
  } catch (error) {
    // console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
export const recent: AppRouteHandler<RecentOrderRoute> = async (c) => {
  const rows = await db
    .select({
      id: ordersTable.id,
      paymentStatus: ordersTable.paymentStatus,
      orderNumber: ordersTable.orderNumber,
      totalOrderAmount: ordersTable.totalOrderAmount,
      userName: usersTable.name,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(4);
  const shaped = rows.map((r) => ({ id: r.id, paymentStatus: r.paymentStatus, orderNumber: r.orderNumber, totalOrderAmount: r.totalOrderAmount, user: { name: r.userName } }));
  return c.json(shaped, HttpStatusCodes.OK);
};

// export const create: AppRouteHandler<CreateRoute> = async (c) => {
//   const auth = getAuth(c);

//   if (!auth?.userId) {
//     return c.json(
//       {
//         message: "You are not logged in.",
//       },
//       HttpStatusCodes.UNAUTHORIZED
//     );
//   }

//   const data = c.req.valid("json");

//   // Check if user exists
//   const user = await prisma.user.findUnique({
//     where: { id: data.userId },
//   });

//   if (!user) {
//     return c.json(
//       {
//         message: "User not found",
//       },
//       HttpStatusCodes.BAD_REQUEST
//     );
//   }

//   // Check if order number is unique
//   const existingOrder = await prisma.order.findUnique({
//     where: { orderNumber: data.orderNumber },
//   });

//   if (existingOrder) {
//     return c.json(
//       {
//         message: "Order with this order number already exists",
//       },
//       HttpStatusCodes.CONFLICT
//     );
//   }

//   // Check if tracking number is unique if provided
//   if (data.trackingNumber) {
//     const orderWithTrackingNumber = await prisma.order.findUnique({
//       where: { trackingNumber: data.trackingNumber },
//     });

//     if (orderWithTrackingNumber) {
//       return c.json(
//         {
//           message: "Order with this tracking number already exists",
//         },
//         HttpStatusCodes.CONFLICT
//       );
//     }
//   }

//   const order = await prisma.order.create({
//     data,
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           phone: true,
//         },
//       },
//       orderItems: true,
//     },
//   });

//   return c.json(order, HttpStatusCodes.CREATED);
// };

// export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
//   const { id } = c.req.valid("param");

//   const order = await prisma.order.findUnique({
//     where: { id },
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           phone: true,
//         },
//       },
//       orderItems: {
//         include: {
//           product: {
//             include: {
//               category: true,
//               brand: true,
//             },
//           },
//         },
//       },
//       sales: true,
//     },
//   });

//   if (!order) {
//     return c.json(
//       {
//         message: "Order not found",
//       },
//       HttpStatusCodes.NOT_FOUND
//     );
//   }

//   return c.json(order, HttpStatusCodes.OK);
// };

// export const update: AppRouteHandler<UpdateRoute> = async (c) => {
//   const auth = getAuth(c);

//   if (!auth?.userId) {
//     return c.json(
//       {
//         message: "You are not logged in.",
//       },
//       HttpStatusCodes.UNAUTHORIZED
//     );
//   }

//   const { id } = c.req.valid("param");
//   const data = c.req.valid("json");

//   const existingOrder = await prisma.order.findUnique({
//     where: { id },
//   });

//   if (!existingOrder) {
//     return c.json(
//       {
//         message: "Order not found",
//       },
//       HttpStatusCodes.NOT_FOUND
//     );
//   }

//   // Check if user exists if being updated
//   if (data.userId) {
//     const user = await prisma.user.findUnique({
//       where: { id: data.userId },
//     });

//     if (!user) {
//       return c.json(
//         {
//           message: "User not found",
//         },
//         HttpStatusCodes.BAD_REQUEST
//       );
//     }
//   }

//   // Check if order number is unique if being updated
//   if (data.orderNumber && data.orderNumber !== existingOrder.orderNumber) {
//     const orderWithNumber = await prisma.order.findUnique({
//       where: { orderNumber: data.orderNumber },
//     });

//     if (orderWithNumber) {
//       return c.json(
//         {
//           message: "Order with this order number already exists",
//         },
//         HttpStatusCodes.CONFLICT
//       );
//     }
//   }

//   // Check if tracking number is unique if being updated
//   if (
//     data.trackingNumber &&
//     data.trackingNumber !== existingOrder.trackingNumber
//   ) {
//     const orderWithTrackingNumber = await prisma.order.findUnique({
//       where: { trackingNumber: data.trackingNumber },
//     });

//     if (orderWithTrackingNumber) {
//       return c.json(
//         {
//           message: "Order with this tracking number already exists",
//         },
//         HttpStatusCodes.CONFLICT
//       );
//     }
//   }

//   const updatedOrder = await prisma.order.update({
//     where: { id },
//     data,
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           phone: true,
//         },
//       },
//       orderItems: true,
//     },
//   });

//   return c.json(updatedOrder, HttpStatusCodes.OK);
// };

// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//   const auth = getAuth(c);

//   if (!auth?.userId) {
//     return c.json(
//       {
//         message: "You are not logged in.",
//       },
//       HttpStatusCodes.UNAUTHORIZED
//     );
//   }

//   const { id } = c.req.valid("param");

//   const order = await prisma.order.findUnique({
//     where: { id },
//     include: {
//       _count: {
//         select: {
//           orderItems: true,
//           sales: true,
//         },
//       },
//     },
//   });

//   if (!order) {
//     return c.json(
//       {
//         message: "Order not found",
//       },
//       HttpStatusCodes.NOT_FOUND
//     );
//   }

//   // Note: In a real application, you might want to prevent deletion of orders
//   // that are not in PENDING or CANCELLED status
//   if (
//     order.orderStatus === "DELIVERED" ||
//     order.orderStatus === "IN_PROGRESS"
//   ) {
//     return c.json(
//       {
//         message: "Cannot delete order that is delivered or in progress",
//       },
//       HttpStatusCodes.BAD_REQUEST
//     );
//   }

//   await prisma.order.delete({
//     where: { id },
//   });

//   return c.json(
//     {
//       message: "Order deleted successfully",
//     },
//     HttpStatusCodes.OK
//   );
// };
