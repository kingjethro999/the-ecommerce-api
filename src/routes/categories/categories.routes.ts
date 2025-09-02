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
  CategorySchema,
  CategoryWithRelationsSchema,
  // CategoryWithRelationsSchema,
  CreateCategorySchema,
  CreatedIdSchema,
  IdParamSchema,
  SlugParamSchema,
  UpdateCategorySchema,
} from "./categories.schema";

const tags = ["Categories"];

export const list = createRoute({
  path: "/categories",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(CategorySchema),
      "The list of categories"
    ),
  },
});

export const create = createRoute({
  path: "/categories",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(CreateCategorySchema, "The category to create"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      CreatedIdSchema,
      "The created category"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(CreateCategorySchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to create"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Department not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Category with this slug already exists"
    ),
  },
});

export const getOne = createRoute({
  path: "/categories/{slug}",
  method: "get",
  request: {
    params: SlugParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      CategoryWithRelationsSchema,
      "The requested category"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      SlugParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Category not found"
    ),
  },
});

export const update = createRoute({
  path: "/categories/{id}",
  method: "patch",
  request: {
    params: IdParamSchema,
    body: jsonContentRequired(UpdateCategorySchema, "The category updates"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      postResponseSchema,
      "The updated category"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(UpdateCategorySchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to update"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Category not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Department not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Category with this slug already exists"
    ),
  },
});

export const remove = createRoute({
  path: "/categories/{id}",
  method: "delete",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(DeleteResponseSchema, "Category deleted"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Category not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to delete"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Cannot delete category with existing products"
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
