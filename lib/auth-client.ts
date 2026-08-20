import { createAuthClient } from "better-auth/react";
import { useState, useCallback } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});


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
