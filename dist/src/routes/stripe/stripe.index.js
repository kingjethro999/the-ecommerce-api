import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./stripe.handlers.js";
import * as routes from "./stripe.routes.js";
const router = createRouter()
    .openapi(routes.create, handlers.create)
    .openapi(routes.confirmPayment, handlers.confirmPayment);
// .openapi(routes.stripeWebhook, handlers.stripeWebhook);
export default router;
