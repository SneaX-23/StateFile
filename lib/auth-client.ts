import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [jwtClient()],
});

export async function fetchGoAPI(endpoint: string, options: RequestInit = {}) {
  const { data } = await authClient.jwt.getToken();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (data?.token) {
    headers.set("Authorization", `Bearer ${data.token}`);
  }

  return fetch(`${process.env.NEXT_PUBLIC_GO_BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });
}
