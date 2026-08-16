import { createAuthClient } from "better-auth/react";
import { useState, useCallback } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// hook for current user
export function useCurrentUser() {
  const { data: session } = authClient.useSession();
  return session?.user ?? null;
}

// hook for authentication status
export function useIsAuthenticated() {
  const user = useCurrentUser();
  return !!user;
}


// unused for now
// export const signInWithGitHub = async () => {
//   const data = await authClient.signIn.social({
//     provider: "github",
//     callbackURL: "/dashboard",
//   })
// }
//
// export const signInWithGitLab = async () => {
//   const data = await authClient.signIn.social({
//     provider: "gitlab",
//     callbackURL: "/dashboard"
//   })
// }


// hook for signOut
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
