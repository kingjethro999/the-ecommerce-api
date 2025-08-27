import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./orders.handlers.js";
import * as routes from "./orders.routes.js";
const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.userOrders, handlers.userOrders)
    .openapi(routes.recent, handlers.recent);
// .openapi(routes.getOne, handlers.getOne)
// .openapi(routes.update, handlers.update)
// .openapi(routes.remove, handlers.remove);
export default router;
