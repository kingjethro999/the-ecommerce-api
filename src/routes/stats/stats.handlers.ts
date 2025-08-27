/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/arrow-parens */
import { startOfDay, subDays, subWeeks, subMonths } from "date-fns";
import { getAuth } from "@hono/clerk-auth";
import { Category, Product } from "@prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import prisma from "prisma/db";

import type { BriefItemsRoute, ListRoute, StatsRoute } from "./stats.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  // Calculate statistics
  // const auth = getAuth(c);

  // if (!auth?.userId) {
  //   return c.json(
  //     {
  //       message: "You are not logged in.",
  //     },
  //     HttpStatusCodes.UNAUTHORIZED
  //   );
  // }
  // Products per category
  const categories = await prisma.category.findMany({
    include: {
      products: true,
    },
  });
  const products = await prisma.product.findMany();
  const totalCategories = categories.length;
  const totalProducts = products.length;
  interface CategoryWithProducts extends Category {
    products: Product[];
  }

  const productsPerCategory = categories.map((category: CategoryWithProducts) => ({
    categoryId: category.id,
    categoryName: category.name,
    productCount: products.filter(
      (product: Product) => product.categoryId === category.id
    ).length,
  }));

  // Price statistics
  const prices = products.map((product: Product) => product.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 
    ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length 
    : 0;

  const stats = {
    totalCategories,
    totalProducts,
    productsPerCategory,
    priceStats: {
      min: minPrice,
      max: maxPrice,
      average: Math.round(avgPrice * 100) / 100,
    },
    lastUpdated: new Date().toISOString(),
  };
  return c.json(stats, HttpStatusCodes.OK);
};
export const stats: AppRouteHandler<StatsRoute> = async (c) => {
  try {
    const { period = "today" } = c.req.query();
    // console.log(period);
    const now = new Date();
    const today = startOfDay(now);

    let dateFilter = {};
    let previousDateFilter = {};

    switch (period) {
      case "today":
        dateFilter = { createdAt: { gte: today } };
        // Compare with yesterday
        const yesterday = startOfDay(subDays(today, 1));
        const dayBefore = startOfDay(subDays(today, 2));
        previousDateFilter = {
          createdAt: {
            gte: dayBefore,
            lt: yesterday,
          },
        };
        break;

      case "last7days":
        const sevenDaysAgo = startOfDay(subDays(today, 7));
        dateFilter = { createdAt: { gte: sevenDaysAgo } };
        // Compare with previous 7 days (days 8-14 ago)
        const fourteenDaysAgo = startOfDay(subDays(today, 14));
        previousDateFilter = {
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        };
        break;

      case "last28days":
        const twentyEightDaysAgo = startOfDay(subDays(today, 28));
        dateFilter = { createdAt: { gte: twentyEightDaysAgo } };
        // Compare with previous 28 days (days 29-56 ago)
        const fiftySixDaysAgo = startOfDay(subDays(today, 56));
        previousDateFilter = {
          createdAt: {
            gte: fiftySixDaysAgo,
            lt: twentyEightDaysAgo,
          },
        };
        break;

      case "total":
        dateFilter = {};
        break;

      default:
        dateFilter = { createdAt: { gte: today } };
        const defaultYesterday = startOfDay(subDays(today, 1));
        const defaultDayBefore = startOfDay(subDays(today, 2));
        previousDateFilter = {
          createdAt: {
            gte: defaultDayBefore,
            lt: defaultYesterday,
          },
        };
    }
    // console.log(dateFilter);
    // Fetch current period metrics
    const [customers, orders, products, categories] = await Promise.all([
      prisma.user.count({
        where: {
          role: "USER",
          ...dateFilter,
        },
      }),
      prisma.order.count({
        where: dateFilter,
      }),
      prisma.product.count({
        where: {
          isActive: true,
          ...dateFilter,
        },
      }),
      prisma.category.count({
        where: {
          isActive: true,
          ...dateFilter,
        },
      }),
    ]);

    // For total period, return without percentage changes
    if (period === "total") {
      return c.json(
        {
          customers: {
            value: customers,
            change: 0,
          },
          orders: {
            value: orders,
            change: 0,
          },
          products: {
            value: products,
            change: 0,
          },
          categories: {
            value: categories,
            change: 0,
          },
          period,
        },
        HttpStatusCodes.OK
      );
    }

    // Fetch previous period data for comparison
    const [prevCustomers, prevOrders, prevProducts, prevCategories] =
      await Promise.all([
        prisma.user.count({
          where: {
            role: "USER",
            ...previousDateFilter,
          },
        }),
        prisma.order.count({
          where: previousDateFilter,
        }),
        prisma.product.count({
          where: {
            isActive: true,
            ...previousDateFilter,
          },
        }),
        prisma.category.count({
          where: {
            isActive: true,
            ...previousDateFilter,
          },
        }),
      ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100;
    };

    return c.json(
      {
        customers: {
          value: customers,
          change: calculateChange(customers, prevCustomers),
        },
        orders: {
          value: orders,
          change: calculateChange(orders, prevOrders),
        },
        products: {
          value: products,
          change: calculateChange(products, prevProducts),
        },
        categories: {
          value: categories,
          change: calculateChange(categories, prevCategories),
        },
        period,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
};
export const briefItems: AppRouteHandler<BriefItemsRoute> = async (c) => {
  // Products per category
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      title: true,
    },
  });
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const categoryOptions = categories.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
  const brandOptions = brands.map((item) => {
    return {
      label: item.title,
      value: item.id,
    };
  });
  const productOptions = products.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });

  return c.json(
    { productOptions, brandOptions, categoryOptions },
    HttpStatusCodes.OK
  );
};
