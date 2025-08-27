import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./banners.handlers.js";
import * as routes from "./banners.routes.js";
const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.update, handlers.update)
    .openapi(routes.remove, handlers.remove);
export default router;
