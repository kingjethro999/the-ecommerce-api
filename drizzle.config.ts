import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/lib/schema/index.ts',
  out: './drizzle',
  tablesFilter: ['ecommerce_*'],
  connectionString: process.env.DATABASE_URL!,
} satisfies Config;