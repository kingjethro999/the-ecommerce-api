/* eslint-disable node/no-process-env */
/* eslint-disable no-case-declarations */
/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/arrow-parens */

// Removed Prisma enums
import type Stripe from "stripe";

import { getAuth } from "@/middlewares/jwt-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users as usersTable, orders as ordersTable, orderItems, payments as paymentsTable, products as productsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type {
  ConfirmPaymentRoute,
  CreateIntentRoute,
  StripeWebhookRoute,
} from "./stripe.routes";
import type { StripeProduct } from "./stripe.schema";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getActiveProducts() {
  const stripeProducts = await stripe.products.list();
  const activeProducts = stripeProducts.data.filter(
    (item: any) => item.active === true
  );
  return activeProducts;
}

export const create: AppRouteHandler<CreateIntentRoute> = async (c) => {
  // const auth = getAuth(c);

  // if (!auth?.userId) {
  //   return c.json(
  //     {
  //       message: "You are not logged in.",
  //     },
  //     HttpStatusCodes.UNAUTHORIZED
  //   );
  // }
  const { products, customer } = await c.req.json();

  console.log(products);
  const checkoutProducts: StripeProduct[] = products;
  const amount = checkoutProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Creating Stripe Non existing Stripe Products
  let activeProducts = await getActiveProducts();
  try {
    for (const product of checkoutProducts) {
      const stripeProduct = activeProducts?.find(
        (stripeProduct: any) =>
          stripeProduct?.name?.toLowerCase() === product?.name?.toLowerCase()
      );

      if (stripeProduct === undefined) {
        const unitAmount = Math.round(product.price * 100);

        const prod = await stripe.products.create({
          name: product.name,
          default_price_data: {
            unit_amount: unitAmount,
            currency: "usd",
          },
          images: [product.image],
        });
        c.var.logger?.debug(`Product created: ${prod.name}`);
      } else {
        c.var.logger?.debug("Product already exists");
      }
    }
  } catch (error) {
    console.error("Error creating products:", error);
  }

  activeProducts = await getActiveProducts();
  c.var.logger?.debug("ACTIVE PRODUCTS=>", activeProducts);
  let checkoutStripeProducts: any = [];

  for (const product of checkoutProducts) {
    const stripeProduct = activeProducts?.find(
      (stripeProduct: any) =>
        stripeProduct?.name?.toLowerCase() === product?.name?.toLowerCase()
    );

    if (stripeProduct) {
      checkoutStripeProducts.push({
        price: stripeProduct?.default_price,
        quantity: product.quantity,
      });
    }
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      items: JSON.stringify(checkoutProducts),
      customer: JSON.stringify(customer),
    },
  });
  c.var.logger?.debug("payment intent =>", paymentIntent);
  const clientSecret = paymentIntent.client_secret || "";
  return c.json({ clientSecret }, HttpStatusCodes.CREATED);
};
export const stripeWebhook: AppRouteHandler<StripeWebhookRoute> = async (c) => {
  const body = await c.req.text();

  // Get the specific header we need
  const sig = c.req.header("stripe-signature");

  // Check if signature exists
  if (!sig) {
    console.log("Missing stripe-signature header");
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;

    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentFailed(failedPaymentIntent);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return c.json({ received: true, error: "" }, HttpStatusCodes.OK);
};
export const confirmPayment: AppRouteHandler<ConfirmPaymentRoute> = async (
  c
) => {
  const data = c.req.valid("json");

  await handleConfirmPayment(data.paymentIntentId);

  return c.json({ received: true, error: "" }, HttpStatusCodes.OK);
};

async function handleConfirmPayment(paymentIntentId: string) {
  try {
    console.log("payment IntentId:", paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Parse the items from metadata
    const items = JSON.parse(paymentIntent.metadata.items || "[]");
    const customer = JSON.parse(paymentIntent.metadata.customer);
    console.log("Customer Data:", customer);

    let existingCustomer = (await db.select().from(usersTable).where(eq(usersTable.email, customer.email)).limit(1))[0];

    if (!existingCustomer) {
      throw new Error("No Customer found");
    }

    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const trackingNumber = `TRACK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal;

    const [order] = await db
      .insert(ordersTable)
      .values({
        id: randomUUID(),
        orderNumber,
        userId: existingCustomer?.id || "",
        orderStatus: "CONFIRMED" as any,
        paymentStatus: "SUCCEEDED" as any,
        totalOrderAmount: total,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        trackingNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    // Create order items
    for (const item of items) {
      // Find the product in your database
      let product = (await db.select().from(productsTable).where(eq(productsTable.name, item.name)).limit(1))[0];

      if (product) {
        await db.insert(orderItems).values({
          id: randomUUID(),
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.image,
          title: item.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    // Create payment record
    await db.insert(paymentsTable).values({
      id: randomUUID(),
      orderId: order.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: total,
      currency: paymentIntent.currency,
      status: "SUCCEEDED" as any,
      paymentMethod: paymentIntent.payment_method_types[0] || "card",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    console.log(`Order created successfully: ${order.orderNumber}`);
    // return {
    //   success: true,
    //   code: 200,
    // };

    // Here you might want to:
    // - Send confirmation email
    // - Update inventory
    // - Trigger fulfillment process
    // - Send notifications
  } catch (error) {
    console.error("Error handling successful payment:", error);
    throw error;
  }
}
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    console.log("Payment succeeded:", paymentIntent.id);

    // Parse the items from metadata
    const items = JSON.parse(paymentIntent.metadata.items || "[]");
    const customer = JSON.parse(paymentIntent.metadata.customer);
    console.log("Customer Data:", customer);

    let existingCustomer = (await db.select().from(usersTable).where(eq(usersTable.email, customer.email)).limit(1))[0];

    //   email     String   @unique
    // firstName String?
    // lastName  String?
    // phone     String?
    if (!existingCustomer) {
      const [created] = await db
        .insert(usersTable)
        .values({
          id: randomUUID(),
          name: customer.name,
          phone: customer.phone || "",
          email: customer.email,
          image: null,
          role: "USER" as any,
          password: null,
          status: "ACTIVE" as any,
          isVerified: true,
          token: null,
          resetExpiry: null,
          roleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .returning();
      existingCustomer = created;
    }

    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const trackingNumber = `TRACK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal;

    const [order] = await db
      .insert(ordersTable)
      .values({
        id: randomUUID(),
        orderNumber,
        userId: existingCustomer?.id || "",
        orderStatus: "CONFIRMED" as any,
        paymentStatus: "SUCCEEDED" as any,
        totalOrderAmount: total,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        trackingNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    // Create order items
    for (const item of items) {
      // Find the product in your database
      let product = (await db.select().from(productsTable).where(eq(productsTable.name, item.name)).limit(1))[0];

      if (product) {
        await db.insert(orderItems).values({
          id: randomUUID(),
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.image,
          title: item.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    // Create payment record
    await db.insert(paymentsTable).values({
      id: randomUUID(),
      orderId: order.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: total,
      currency: paymentIntent.currency,
      status: "SUCCEEDED" as any,
      paymentMethod: paymentIntent.payment_method_types[0] || "card",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    console.log(`Order created successfully: ${order.orderNumber}`);

    // Here you might want to:
    // - Send confirmation email
    // - Update inventory
    // - Trigger fulfillment process
    // - Send notifications
  } catch (error) {
    console.error("Error handling successful payment:", error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("Payment failed:", paymentIntent.id);

    // Find existing order and update status
    const existingOrder = (await db.select().from(ordersTable).where(eq(ordersTable.stripePaymentIntentId, paymentIntent.id)).limit(1))[0];

    if (existingOrder) {
      await db
        .update(ordersTable)
        .set({ orderStatus: "CANCELLED" as any, paymentStatus: "FAILED" as any, updatedAt: new Date() })
        .where(eq(ordersTable.id, existingOrder.id));

      await db
        .update(paymentsTable)
        .set({ status: "FAILED" as any, updatedAt: new Date() })
        .where(eq(paymentsTable.stripePaymentIntentId, paymentIntent.id));
    }

    console.log(
      `Payment failed for order: ${existingOrder?.orderNumber || "Not found"}`
    );
  } catch (error) {
    console.error("Error handling failed payment:", error);
    throw error;
  }
}
