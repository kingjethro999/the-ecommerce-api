/* eslint-disable node/no-process-env */
import Stripe from "stripe";

import env from "@/env";

if (process.env.STRIPE_SECRET_KEY === undefined) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
