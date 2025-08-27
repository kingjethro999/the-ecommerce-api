import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { NotAuthorizedSchema } from "../../lib/constants.js";
import { ConfirmPaymentSchema, StripeIntentRequestSchema, StripeIntentResponseSchema, } from "./stripe.schema.js";
const tags = ["Stripe"];
export const create = createRoute({
    path: "/payment-intent",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(StripeIntentRequestSchema, "The stripe products to create a payment intent for"),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(StripeIntentResponseSchema, "The stripe intent secret"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(NotAuthorizedSchema, "You need to be authenticated to create"),
    },
});
export const stripeWebhook = createRoute({
    path: "/webhooks/stripe",
    method: "post",
    tags,
    request: {
    // body: jsonContentRequired(
    //   z.string(),
    //   "The stripe products to create a payment intent for"
    // ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
        // Webhooks typically return 200, not 201
        z.object({ received: z.boolean() }), "Webhook received successfully"),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "Webhook verification failed"),
    },
});
export const confirmPayment = createRoute({
    path: "/stripe/confirm-payment",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(ConfirmPaymentSchema, "The stripe payment intent id"),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
        // Webhooks typically return 200, not 201
        z.object({ received: z.boolean() }), "Webhook received successfully"),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "Webhook verification failed"),
    },
});
