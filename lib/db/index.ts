import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Edge runtime workaround: we cannot use 'file:' in Edge runtime (used by open graph)
// We will fallback to a remote dummy or mock for build time if not provided
const dbUrl = process.env.TURSO_DATABASE_URL || 'http://localhost:8080';

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
