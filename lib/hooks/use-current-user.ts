'use client'
import { authClient } from "@/lib/auth-client";
export function useCurrentUser() {
  const { data: session } = authClient.useSession();
  return session?.user ?? null;
}
