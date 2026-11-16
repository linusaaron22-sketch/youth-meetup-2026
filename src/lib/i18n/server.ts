import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./messages";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "hi" ? "hi" : "en";
}
