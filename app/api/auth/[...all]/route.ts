import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

//todo:  add ratelimit and logger
export const { GET, POST } = toNextJsHandler(auth);
