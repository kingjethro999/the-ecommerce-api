import { clerkMiddleware } from "@hono/clerk-auth";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";
import { logger } from "../middlewares/pino-logger.js";
export function createRouter() {
    return new OpenAPIHono({
        strict: false,
        defaultHook,
    });
}
export default function createApp() {
    const app = createRouter();
    app.use(logger());
    app.use("*", clerkMiddleware());
    app.use(serveEmojiFavicon("🅿️"));
    app.use("/api/*", cors({
        origin: "*",
    }));
    // Set The standard Not found route response
    app.notFound(notFound);
    app.onError(onError);
    return app;
}
