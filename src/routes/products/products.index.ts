import { createRouter } from "@/lib/create-app";

import * as handlers from "./products.handlers";
import * as routes from "./products.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.top, handlers.top)
  .openapi(routes.dashboardList, handlers.dashboardList)
  .openapi(routes.deal, handlers.deal)
  .openapi(routes.search, handlers.search)
  .openapi(routes.allDeals, handlers.allDeal)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.getOneBySlug, handlers.getOneBySlug)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;
