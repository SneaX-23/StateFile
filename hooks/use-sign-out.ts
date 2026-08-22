'use client'
import { authClient } from "@/lib/auth-client"
import { useCallback, useState } from "react";
export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
    } catch (err) {
      console.error("Sign-out error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { signOut, isLoading };
}
