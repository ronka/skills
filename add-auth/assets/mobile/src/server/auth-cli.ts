// Only for `npx auth generate`, which needs a static instance to read the schema.
// Never import this file from a route: it opens a pool at load time.
import { Pool } from '@neondatabase/serverless';

import { createAuthForCli } from './auth';

export const auth = createAuthForCli(new Pool({ connectionString: process.env.DATABASE_URL }));
