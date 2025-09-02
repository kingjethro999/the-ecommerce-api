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

import { SlugParamSchema } from "../products/products.schema";
import {
  CreateDepartmentSchema,
  DepartmentCategorySchema,
  DepartmentSchema,
  DepartmentWithRelationsSchema,
  DetailDepartmentCategorySchema,
  IdParamSchema,
  NavDepartmentSchema,
  UpdateDepartmentSchema,
} from "./departments.schema";

const tags = ["Departments"];

export const list = createRoute({
  path: "/departments",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(DepartmentSchema),
      "The list of departments"
    ),
  },
});
export const navList = createRoute({
  path: "/nav-departments",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(NavDepartmentSchema),
      "The list of departments"
    ),
  },
});
export const catList = createRoute({
  path: "/departments/categories",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(NavDepartmentSchema),
      "The list of departments categories"
    ),
  },
});

export const create = createRoute({
  path: "/departments",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      CreateDepartmentSchema,
      "The payload need to create department"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      postResponseSchema,
      "Returns ID of the Created Department"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(CreateDepartmentSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to create"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Department with this slug already exists"
    ),
  },
});

export const getOne = createRoute({
  path: "/departments/{id}",
  method: "get",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DepartmentWithRelationsSchema,
      "The requested department"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Department not found"
    ),
  },
});
export const getOneBySlug = createRoute({
  path: "/departments/department/{slug}",
  method: "get",
  request: {
    params: SlugParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DetailDepartmentCategorySchema,
      "The requested department"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      SlugParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Department not found"
    ),
  },
});

export const update = createRoute({
  path: "/departments/{id}",
  method: "patch",
  request: {
    params: IdParamSchema,
    body: jsonContentRequired(UpdateDepartmentSchema, "The department updates"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      postResponseSchema,
      "Returns the ID of the Updated Department"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(UpdateDepartmentSchema),
      "The validation errors"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to update"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Department not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Department with this slug already exists"
    ),
  },
});

export const remove = createRoute({
  path: "/departments/{id}",
  method: "delete",
  request: {
    params: IdParamSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DeleteResponseSchema,
      "Department deleted"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      IdParamSchema,
      "Invalid id error"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      NotFoundSchema,
      "Department not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      NotAuthorizedSchema,
      "You need to be authenticated to delete"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Cannot delete department with existing categories"
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
export type NavListRoute = typeof navList;
export type CatListRoute = typeof catList;
export type GetOneBySlugRoute = typeof getOneBySlug;
