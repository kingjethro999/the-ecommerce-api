import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./stats.handlers.js";
import * as routes from "./stats.routes.js";
const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.stats, handlers.stats)
    .openapi(routes.briefItems, handlers.briefItems);
export default router;
