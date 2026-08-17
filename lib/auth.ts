import { betterAuth } from "better-auth";
import { Pool } from "pg";

// validate all required env vars at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITLAB_CLIENT_ID',
  'GITLAB_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'BETTER_AUTH_SECRET',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(
    `x Missing required environment variables: ${missingVars.join(', ')}`
  );
}

// database pool with proper configuration
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// test database connection on startup
// async function testDatabaseConnection() {
//   try {
//     const result = await dbPool.query('SELECT NOW()');
//     console.log('Database connection successful');
//   } catch (error) {
//     console.error('x Database connection failed:', error);
//     throw new Error('x Failed to connect to database. Check DATABASE_URL.');
//   }
// }

// only test in non test environments
// if (process.env.NODE_ENV !== 'test') {
//   testDatabaseConnection().catch((error) => {
//     console.error('x Fatal startup error:', error);
//     process.exit(1);
//   });
// }

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  account: {
    encryptOAuthTokens: true,
  },
  database: dbPool,

  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },

    gitlab: {
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    },
  },
});
