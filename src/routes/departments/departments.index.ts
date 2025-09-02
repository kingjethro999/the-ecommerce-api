import { createRouter } from "@/lib/create-app";

import * as handlers from "./departments.handlers";
import * as routes from "./departments.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.navList, handlers.navList)
  .openapi(routes.catList, handlers.catList)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.getOneBySlug, handlers.getOneBySlug)
  .openapi(routes.remove, handlers.remove);

export default router;
