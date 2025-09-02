import { createRouter } from "@/lib/create-app";

import * as handlers from "./orders.handlers";
import * as routes from "./orders.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.userOrders, handlers.userOrders)
  .openapi(routes.recent, handlers.recent);
// .openapi(routes.getOne, handlers.getOne)
// .openapi(routes.update, handlers.update)
// .openapi(routes.remove, handlers.remove);

export default router;
