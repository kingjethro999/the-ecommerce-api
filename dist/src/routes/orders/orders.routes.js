import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";
import { DeleteResponseSchema, NotAuthorizedSchema, NotFoundSchema, } from "../../lib/constants.js";
import { CreateOrderSchema, IdParamSchema, OrderResponseSchema, OrderWithRelationsSchema, RecentOrderSchema, UpdateOrderSchema, } from "./orders.schema.js";
import { SatsParamSchema } from "../stats/stats.schema.js";
const tags = ["Orders"];
export const list = createRoute({
    path: "/orders",
    method: "get",
    request: {
        query: SatsParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(OrderResponseSchema), "The list of orders"),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(z.object({
            error: z.string(),
        }), "Error"),
    },
});
export const userOrders = createRoute({
    path: "/orders/users/{id}",
    method: "get",
    request: {
        params: IdParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(OrderResponseSchema), "The list of orders"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Order not found"),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(z.object({
            error: z.string(),
        }), "Error"),
    },
});
export const recent = createRoute({
    path: "/recent-orders",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(RecentOrderSchema), "The list of recent orders"),
    },
});
export const create = createRoute({
    path: "/orders",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(CreateOrderSchema, "The order to create"),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(OrderWithRelationsSchema, "The created order"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(CreateOrderSchema), "The validation errors"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to create"),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ message: z.string() }), "User not found"),
        [HttpStatusCodes.CONFLICT]: jsonContent(z.object({ message: z.string() }), "Order with this order number or tracking number already exists"),
    },
});
export const getOne = createRoute({
    path: "/orders/{id}",
    method: "get",
    request: {
        params: IdParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(OrderWithRelationsSchema, "The requested order"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(IdParamSchema, "Invalid id error"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Order not found"),
    },
});
export const update = createRoute({
    path: "/orders/{id}",
    method: "patch",
    request: {
        params: IdParamSchema,
        body: jsonContentRequired(UpdateOrderSchema, "The order updates"),
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(OrderWithRelationsSchema, "The updated order"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(UpdateOrderSchema), "The validation errors"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to update"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Order not found"),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ message: z.string() }), "User not found"),
        [HttpStatusCodes.CONFLICT]: jsonContent(z.object({ message: z.string() }), "Order with this order number or tracking number already exists"),
    },
});
export const remove = createRoute({
    path: "/orders/{id}",
    method: "delete",
    request: {
        params: IdParamSchema,
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(DeleteResponseSchema, "Order deleted"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(IdParamSchema, "Invalid id error"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundSchema, "Order not found"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to delete"),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ message: z.string() }), "Cannot delete order that is delivered or in progress"),
    },
});
