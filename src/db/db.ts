import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { Platform } from '@/config/platform';
import * as schema from './schema';

const url = Platform.db.url || 'file:local.db';
const authToken = Platform.db.authToken;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
