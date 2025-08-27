import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import {
  DeleteResponseSchema,
  NotAuthorizedSchema,
  NotFoundSchema,
} from "@/lib/constants";

import {
  BrandSchema,
  BrandWithRelationsSchema,
  CreateBrandSchema,
  IdParamSchema,
  UpdateBrandSchema,
} from "./brands.schema";

const tags = ["Brands"];

export const list = createRoute({
  path: "/brands",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(BrandSchema),
      "The list of brands"
    ),
  },
});

export const create = createRoute({
  path: "/brands",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(CreateBrandSchema, "The brand to create"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(BrandSchema, "The created brand"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(CreateBrandSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to create"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Brand with this slug already exists"
    ),
  },
});

export const getOne = createRoute({
  path: "/brands/{id}",
  method: "get",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      BrandWithRelationsSchema,
      "The requested brand"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Brand not found"),
  },
});

export const update = createRoute({
  path: "/brands/{id}",
  method: "patch",
  request: {
    params: IdParamSchema,
    body: jsonContentRequired(UpdateBrandSchema, "The brand updates"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(BrandSchema, "The updated brand"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(UpdateBrandSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to update"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Brand not found"),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Brand with this slug already exists"
    ),
  },
});

export const remove = createRoute({
  path: "/brands/{id}",
  method: "delete",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(DeleteResponseSchema, "Brand deleted"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Brand not found"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to delete"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Cannot delete brand with existing products"
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
