import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import prisma from "prisma/db";

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
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return c.json(products);
};
export const top: AppRouteHandler<TopProductsRoute> = async (c) => {
  const products = await prisma.product.findMany({
    where: {
      orderItems: {
        some: {}, // This ensures orderItems count > 0
      },
    },
    select: {
      name: true,
      id: true,
      orderItems: {
        select: {
          quantity: true, // assuming you need quantity for calculations
          price: true, // assuming you need price for total amount
          order: {
            select: {
              id: true, // to count unique orders
            },
          },
        },
      },
    },
    take: 4,
  });

  // Transform the data to match TopProductSchema
  const transformedProducts = products.map((product) => {
    // Get unique orders for this product
    const uniqueOrders = new Set(
      product.orderItems.map((item: any) => item.order.id)
    );

    // Calculate total amount (assuming price * quantity per order item)
    const total = product.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      id: product.id,
      name: product.name,
      total,
      count: uniqueOrders.size, // number of unique orders
    };
  });

  return c.json(transformedProducts);
};
export const deal: AppRouteHandler<DealRoute> = async (c) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      summary: true,
      imageUrl: true,
      stockQty: true,
    },
    take: 8,
  });
  return c.json(products);
};
export const dashboardList: AppRouteHandler<DashboardListRoute> = async (c) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      imageUrl: true,
      createdAt: true,
      stockQty: true,
      isActive: true,
      lowStockAlert: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return c.json(products);
};
export const allDeal: AppRouteHandler<AllDealRoute> = async (c) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      imageUrl: true,
      stockQty: true,
    },
  });
  return c.json(products);
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
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

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
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
    });

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
  const existingProduct = await prisma.product.findUnique({
    where: { slug: data.slug },
  });

  if (existingProduct) {
    return c.json(
      {
        message: "Product with this slug already exists",
      },
      HttpStatusCodes.CONFLICT
    );
  }

  const product = await prisma.product.create({
    data,
    select: {
      id: true,
    },
  });

  return c.json(product, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");
  // console.log("PRODUCT ID----:", id);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        include: {
          department: true,
        },
      },
      brand: true,
    },
  });

  if (!product) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(product, HttpStatusCodes.OK);
};
export const getOneBySlug: AppRouteHandler<GetOneBySlugRoute> = async (c) => {
  const { slug } = c.req.valid("param");

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      summary: true,
      description: true,
      frequentlyBoughtTogetherItemIds: true,
      imageUrl: true,
      productImages: true,
      stockQty: true,
      categoryId: true,
    },
  });

  if (!product) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  const similarProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: {
        not: product.id, // Exclude the current product
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      imageUrl: true,
    },
    take: 6, // Limit to 6 similar products
  });
  const frequentlyBoughtTogether = await prisma.product.findMany({
    where: {
      id: {
        in: product.frequentlyBoughtTogetherItemIds,
      },
      stockQty: {
        gt: 0, // Only include products that are in stock
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      price: true,
    },
  });
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

  const products = await prisma.product.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive", // Case-insensitive search
          },
        },
        {
          summary: {
            contains: query,
            mode: "insensitive",
          },
        },
        // Uncomment if you want to search by slug as well
        // {
        //   slug: {
        //     contains: query,
        //     mode: 'insensitive',
        //   },
        // },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discount: true,
      summary: true,
      imageUrl: true,
      stockQty: true,
    },
    take: 8,
  });
  return c.json(products);
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

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

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
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

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
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
    });

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
  if (data.slug && data.slug !== existingProduct.slug) {
    const productWithSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (productWithSlug) {
      return c.json(
        {
          message: "Product with this slug already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      brand: true,
    },
  });

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

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    return c.json(
      {
        message: "Product not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  // Check if product has order items or sales
  if (product._count.orderItems > 0) {
    return c.json(
      {
        message: "Cannot delete product with existing orders or sales",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await prisma.product.delete({
    where: { id },
  });

  return c.json(
    {
      message: "Product deleted successfully",
    },
    HttpStatusCodes.OK
  );
};
