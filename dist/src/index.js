import { serve } from "@hono/node-server";
import app from "./app.js";
import env from "./env.js";
const port = env.PORT;
serve({
    fetch: app.fetch,
    port,
}, (info) => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${info.port}`);
});
