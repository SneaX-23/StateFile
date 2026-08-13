import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "github"
  })
}

