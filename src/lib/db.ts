import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// eslint-disable-next-line node/no-process-env
const connectionString = process.env.DATABASE_URL as string;

const sql = neon(connectionString);

export const db = drizzle({ client: sql });


