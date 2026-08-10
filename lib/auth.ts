import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DB_STRING!,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {

  },
  plugins: [jwt()],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})
