import { z } from "zod";
export const StripeProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1),
    image: z.string(),
});
export const StripeIntentResponseSchema = z.object({
    clientSecret: z.string(),
});
export const ConfirmPaymentSchema = z.object({
    paymentIntentId: z.string(),
});
export const StripeIntentRequestSchema = z.object({
    products: z.array(StripeProductSchema),
});
