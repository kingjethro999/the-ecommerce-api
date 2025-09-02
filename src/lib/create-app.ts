import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import { logger } from "@/middlewares/pino-logger";
import env from "@/env";

import type { AppBindings } from "./types";
import { jwtAuth } from "@/middlewares/jwt-auth";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}
export default function createApp() {
  const app = createRouter();
  app.use(logger());
  app.use(serveEmojiFavicon("🅿️"));
  app.use(
    "/api/*",
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  
  // Apply JWT auth to all API routes except public ones
  app.use("/api/*", jwtAuth({ secret: env.JWT_SECRET }));

  // Set The standard Not found route response
  app.notFound(notFound);
  app.onError(onError);

  return app;
}
