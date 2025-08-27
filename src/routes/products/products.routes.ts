import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import {
  DeleteResponseSchema,
  NotAuthorizedSchema,
  NotFoundSchema,
  postResponseSchema,
} from "@/lib/constants";

import {
  CreateProductSchema,
  DashboardProductSchema,
  DealProductSchema,
  IdParamSchema,
  ProductDetailSchema,
  ProductSchema,
  ProductWithRelationsSchema,
  SearchParamSchema,
  SlugParamSchema,
  TopProductSchema,
  UpdateProductSchema,
} from "./products.schema";

const tags = ["Products"];

export const list = createRoute({
  path: "/products",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(ProductWithRelationsSchema),
      "The list of products"
    ),
  },
});
export const dashboardList = createRoute({
  path: "/products/dashboard",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(DashboardProductSchema),
      "The list of products"
    ),
  },
});
export const deal = createRoute({
  path: "/product-deals",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(DealProductSchema),
      "The list of products"
    ),
  },
});
export const search = createRoute({
  path: "/search-products",
  method: "get",
  request: {
    query: SearchParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(DealProductSchema),
      "The list of products"
    ),
  },
});
export const top = createRoute({
  path: "/top-products",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(TopProductSchema),
      "The list of top products"
    ),
  },
});
export const allDeals = createRoute({
  path: "/product-deals/all",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(DealProductSchema),
      "The list of products"
    ),
  },
});

export const create = createRoute({
  path: "/products",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(CreateProductSchema, "The product to create"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      postResponseSchema,
      "Returns the ID of the created product"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(CreateProductSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to create"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Category or Brand not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Product with this slug already exists"
    ),
  },
});

export const getOne = createRoute({
  path: "/products/{id}",
  method: "get",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProductWithRelationsSchema,
      "The requested product"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Product not found"
    ),
  },
});
export const getOneBySlug = createRoute({
  path: "/products/product/{slug}",
  method: "get",
  request: {
    params: SlugParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProductDetailSchema,
      "The requested product"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      SlugParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Product not found"
    ),
  },
});

export const update = createRoute({
  path: "/products/{id}",
  method: "patch",
  request: {
    params: IdParamSchema,
    body: jsonContentRequired(UpdateProductSchema, "The product updates"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProductWithRelationsSchema,
      "The updated product"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(UpdateProductSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to update"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Product not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Category or Brand not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Product with this slug already exists"
    ),
  },
});

export const remove = createRoute({
  path: "/products/{id}",
  method: "delete",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(DeleteResponseSchema, "Product deleted"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Product not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to delete"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Cannot delete product with existing orders or sales"
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
export type DealRoute = typeof deal;
export type SearchRoute = typeof search;
export type AllDealRoute = typeof allDeals;
export type GetOneBySlugRoute = typeof getOneBySlug;
export type DashboardListRoute = typeof dashboardList;
export type TopProductsRoute = typeof top;
