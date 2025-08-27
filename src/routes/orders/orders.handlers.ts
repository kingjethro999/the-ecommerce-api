// import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import prisma from "prisma/db";

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

    const orders = await prisma.order.findMany({
      where: dateFilter, // Apply the date filter
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        totalOrderAmount: true,
        createdAt: true,
        orderItems: true,
        user: {
          select: {
            name: true,
            email: true,
            id: true,
            clerkUserId: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(orders, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
export const userOrders: AppRouteHandler<UserOrdersRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: id,
      },
    });
    if (!user) {
      return c.json(
        {
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }
    const orders = await prisma.order.findMany({
      where: {
        userId: user?.id,
      }, // Apply the date filter
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        totalOrderAmount: true,
        createdAt: true,
        orderItems: true,
        user: {
          select: {
            name: true,
            email: true,
            id: true,
            clerkUserId: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(orders, HttpStatusCodes.OK);
  } catch (error) {
    // console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
export const recent: AppRouteHandler<RecentOrderRoute> = async (c) => {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      paymentStatus: true,
      orderNumber: true,
      totalOrderAmount: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  });
  return c.json(orders, HttpStatusCodes.OK);
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
