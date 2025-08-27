import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";
import { DeleteResponseSchema, NotAuthorizedSchema, NotFoundSchema, } from "../../lib/constants.js";
import { BannerSchema, CreateBannerSchema, HomeBannerSchema, IdParamSchema, UpdateBannerSchema, } from "./banners.schema.js";
const tags = ["Banners"];
export const list = createRoute({
    path: "/banners",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(HomeBannerSchema), "The list of banners"),
    },
});
export const create = createRoute({
    path: "/banners",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(CreateBannerSchema, "The banner to create"),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(BannerSchema, "The created banner"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(CreateBannerSchema), "The validation errors"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to create"),
    },
});
export const getOne = createRoute({
    path: "/banners/{id}",
    method: "get",
    request: {
        params: IdParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(BannerSchema, "The requested banner"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(IdParamSchema, "Invalid id error"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Banner not found"),
    },
});
export const update = createRoute({
    path: "/banners/{id}",
    method: "patch",
    request: {
        params: IdParamSchema,
        body: jsonContentRequired(UpdateBannerSchema, "The banner updates"),
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(BannerSchema, "The updated banner"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(UpdateBannerSchema), "The validation errors"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to update"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Banner not found"),
    },
});
export const remove = createRoute({
    path: "/banners/{id}",
    method: "delete",
    request: {
        params: IdParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(DeleteResponseSchema, "Banner deleted"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(IdParamSchema, "Invalid id error"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Banner not found"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to delete"),
    },
});
