/* eslint-disable style/eol-last */
// users.schema.ts
import { z } from "zod";
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
// Enum for user status
export const UserStatusEnum = z.enum([
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING",
]);
export const UserRoleEnum = z.enum(["ADMIN", "USER"]);
// Base User schema for validation
export const UserSchema = z.object({
    id: z.string(),
    clerkUserId: z.string(),
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional().nullable(),
    emailVerified: z.date().optional().nullable(),
    image: z.string().url("Image must be a valid URL").optional().nullable(),
    role: UserRoleEnum.default("USER"),
    password: z.string().optional().nullable(),
    status: UserStatusEnum.default("ACTIVE"),
    isVerified: z.boolean().default(true),
    token: z.string().optional().nullable(),
    resetExpiry: z.date().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    roleId: z.string().optional().nullable(),
});
export const BriefUserSchema = z.object({
    id: z.string(),
    clerkUserId: z.string(),
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    name: z.string().min(1, "Name is required"),
    image: z.string().url("Image must be a valid URL").optional().nullable(),
    createdAt: z.date().optional(),
});
export const CustomerSchema = z.object({
    id: z.string(),
    clerkUserId: z.string(),
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
    image: z.string().url("Image must be a valid URL").optional().nullable(),
    orderCount: z.number(),
    createdAt: z.date().optional(),
});
export const IdParamSchema = z.object({
    id: z
        .string()
        .min(24)
        .openapi({
        param: {
            name: "id",
            in: "path",
        },
        example: "00b4766213f0732810a29d8a",
    }),
});
// Schema for creating a new user (without id, createdAt, updatedAt)
export const CreateUserSchema = UserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
});
export const ClerkUserSchema = z.object({
    clerkUserId: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    name: z.string(),
    image: z.string(),
});
// Schema for updating an existing user (all fields optional except id)
export const UpdateUserSchema = UserSchema.omit({
    id: true,
    clerkUserId: true, // ClerkUserId shouldn't be updated
    createdAt: true,
    updatedAt: true,
    password: true, // Password should be updated through a separate endpoint for security
}).partial();
export const OrderItemSchema = z.object({
    id: z.string(),
    orderId: z.string().min(1, "Order ID is required"),
    productId: z.string().min(1, "Product ID is required"),
    imageUrl: z.string().optional().nullable(),
    title: z.string().min(1, "Title is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be positive"),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export const OrderSchema = z.object({
    id: z.string(),
    orderNumber: z.string().min(1, "Order number is required"),
    totalOrderAmount: z.number().min(0),
    transactionId: z.string().optional().nullable(),
    paymentStatus: PaymentStatusSchema.default("PENDING"),
    orderStatus: OrderStatusSchema.default("DELIVERED"),
    userId: z.string(),
    trackingNumber: z.string().optional().nullable(),
    stripeCustomerId: z.string().optional().nullable(),
    stripePaymentIntentId: z.string().optional().nullable(),
    orderItems: z.array(OrderItemSchema).optional().default([]),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export const CustomerOrderSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    clerkUserId: z.string(),
    image: z.string().optional().nullable(),
    orders: z.array(OrderSchema).optional().default([]),
});
