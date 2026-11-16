import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";

/**
 * On Vercel, x-vercel-forwarded-for is a platform request header. Accept only a
 * single syntactically valid address; proxy chains and arbitrary XFF fallbacks
 * are rejected. Production fails closed if the trusted platform header is absent.
 */
export async function getRegistrationRateLimitSubjectHash(): Promise<string | null> {
  const requestHeaders = await headers();
  const supplied = process.env.VERCEL === "1" ? requestHeaders.get("x-vercel-forwarded-for") : null;
  const address = supplied && !supplied.includes(",") && isIP(supplied) ? supplied :
    process.env.NODE_ENV !== "production" && !supplied ? "local-development" : null;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!address || !key) return null;
  return createHmac("sha256", key).update(address).digest("hex");
}
