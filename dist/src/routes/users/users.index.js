import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./users.handlers.js";
import * as routes from "./users.routes.js";
const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.customers, handlers.customers)
    .openapi(routes.customerOrders, handlers.customerOrders)
    .openapi(routes.create, handlers.create)
    .openapi(routes.register, handlers.register)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.update, handlers.update)
    .openapi(routes.remove, handlers.remove);
export default router;
