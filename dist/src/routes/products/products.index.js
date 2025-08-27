import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./products.handlers.js";
import * as routes from "./products.routes.js";
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
