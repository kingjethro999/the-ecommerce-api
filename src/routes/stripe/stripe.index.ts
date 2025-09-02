import { createRouter } from "@/lib/create-app";

import * as handlers from "./stripe.handlers";
import * as routes from "./stripe.routes";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.confirmPayment, handlers.confirmPayment);
// .openapi(routes.stripeWebhook, handlers.stripeWebhook);

export default router;
