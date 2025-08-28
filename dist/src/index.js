import { serve } from "@hono/node-server";
import app from "./app.js";
import env from "./env.js";

const port = process.env.PORT || env.PORT || 8000; // 👈 this line is key

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
