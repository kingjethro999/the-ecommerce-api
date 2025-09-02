/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/arrow-parens */
import { startOfDay, subDays, subWeeks, subMonths } from "date-fns";
import { getAuth } from "@/middlewares/jwt-auth";
// Removed Prisma types
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { db } from "@/lib/db";
import { users, orders as ordersTable, products as productsTable, categories as categoriesTable, brands as brandsTable } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";

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
  const cats = await db.select().from(categoriesTable);
  const prods = await db.select().from(productsTable);
  const totalCategories = cats.length;
  const totalProducts = prods.length;

  const productsPerCategory = cats.map((cat: any) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    productCount: prods.filter((p: any) => p.categoryId === cat.id).length,
  }));

  // Price statistics
  const prices = prods.map((p: any) => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length : 0;

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
    // NOTE: We can't directly express dateFilter objects; we'll calculate in SQL where possible
    const customers = Number((await db.select({ v: sql<number>`COUNT(*)` }).from(users).where(eq(users.role, "USER" as any)))[0]?.v ?? 0);
    const orders = Number((await db.select({ v: sql<number>`COUNT(*)` }).from(ordersTable))[0]?.v ?? 0);
    const products = Number((await db.select({ v: sql<number>`COUNT(*)` }).from(productsTable).where(eq(productsTable.isActive, true as any)))[0]?.v ?? 0);
    const categories = Number((await db.select({ v: sql<number>`COUNT(*)` }).from(categoriesTable).where(eq(categoriesTable.isActive, true as any)))[0]?.v ?? 0);

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
    const prevCustomers = customers; // placeholder until date filters are modeled
    const prevOrders = orders;
    const prevProducts = products;
    const prevCategories = categories;

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
  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
  const brands = await db.select({ id: brandsTable.id, title: brandsTable.title }).from(brandsTable);
  const products = await db.select({ id: productsTable.id, name: productsTable.name }).from(productsTable);
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
