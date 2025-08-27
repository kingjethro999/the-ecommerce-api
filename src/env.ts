/* eslint-disable style/brace-style */
import type { ZodError } from "zod";

import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(config());

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  DATABASE_URL: z.string(),
  // JWT_SECRET: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLIC_KEY: z.string(),
  // FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line import/no-mutable-exports, ts/no-redeclare
let env: env;

try {
  // eslint-disable-next-line node/no-process-env
  env = EnvSchema.parse(process.env);
} catch (e) {
  const error = e as ZodError;
  console.error("❌ Invalid env: ");
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

export default env;
