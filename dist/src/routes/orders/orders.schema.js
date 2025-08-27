import { z } from "zod";
import { UserSchema } from "../users/users.schema.js";
import { OrderItemSchema } from "./order-item.schema.js";
// Enum schemas
export const PaymentStatusSchema = z.enum([
    "PENDING",
    "SUCCEEDED",
    "FAILED",
    "REFUNDED",
    "CANCELLED",
    "PROCESSING",
]);
export const OrderStatusSchema = z.enum([
    "PENDING",
    "CANCELLED",
    "CONFIRMED",
    "PROCESSING",
    "DELIVERED",
    "SHIPPED",
    "REFUNDED",
]);
// Base Order schema for validation
// id               String        @id @default(cuid())
//   orderNumber      String        @unique
//   userId           String
//   user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
//   currency         String        @default("usd")
//   totalOrderAmount Float
//   paymentStatus    PaymentStatus @default(PENDING)
//   transactionId    String?
//   orderStatus      OrderStatus   @default(DELIVERED)
//   trackingNumber   String?       @unique
//   orderItems       OrderItem[]
//   stripePaymentIntentId String?   @unique
//   stripeCustomerId      String?
//   Payment               Payment[]
//   address               Address?  @relation(fields: [addressId], references: [id])
//   addressId             String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
export const OrderSchema = z.object({
    id: z.string(),
    orderNumber: z.string().min(1, "Order number is required"),
    userId: z.string().min(1, "User ID is required"),
    currency: z.string().min(1, "User ID is required"),
    totalOrderAmount: z.number().min(0, "Total order amount must be positive"),
    paymentStatus: PaymentStatusSchema.default("SUCCEEDED"),
    transactionId: z.string().optional().nullable(),
    stripePaymentIntentId: z.string().optional().nullable(),
    stripeCustomerId: z.string().optional().nullable(),
    orderStatus: OrderStatusSchema.default("DELIVERED"),
    trackingNumber: z.string().optional().nullable(),
    addressId: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export const OrderWithRelationsSchema = OrderSchema.extend({
    user: UserSchema.optional(),
    orderItems: z.array(OrderItemSchema).optional().default([]),
});
export const OrderResponseSchema = z.object({
    id: z.string(),
    paymentStatus: PaymentStatusSchema.default("SUCCEEDED"),
    createdAt: z.date().optional(),
    orderNumber: z.string().min(1, "Order number is required"),
    orderItems: z.array(OrderItemSchema).optional().default([]),
    user: z.object({
        name: z.string(),
        email: z.string(),
        id: z.string(),
        clerkUserId: z.string(),
        image: z.string().optional().nullable(),
    }),
});
export const RecentOrderSchema = z.object({
    id: z.string(),
    paymentStatus: PaymentStatusSchema.default("SUCCEEDED"),
    orderNumber: z.string().min(1, "Order number is required"),
    totalOrderAmount: z.number(),
    user: z.object({
        name: z.string(),
    }),
});
export const IdParamSchema = z.object({
    id: z
        .string()
        .min(3)
        .openapi({
        param: {
            name: "id",
            in: "path",
        },
        example: "00b4766213f0732810a29d8a",
    }),
});
// Schema for creating a new order
export const CreateOrderSchema = OrderSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Schema for updating an order
export const UpdateOrderSchema = CreateOrderSchema.partial();
