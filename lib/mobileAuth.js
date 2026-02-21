/**
 * lib/mobileAuth.js
 * Shared JWT verification helper for all /api/mobile/* routes.
 * Validates Bearer token and returns decoded user payload.
 */
import jwt from "jsonwebtoken";

/**
 * @param {Request} req
 * @returns {{ ok: true, user: {id, email, role} } | { ok: false, error: string }}
 */
export async function verifyMobileToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "Missing or malformed Authorization header" };
  }

  const token = authHeader.slice(7);
  const secret = process.env.NEXTAUTH_SECRET || "default_secret";

  try {
    const decoded = jwt.verify(token, secret);
    return { ok: true, user: decoded };
  } catch (e) {
    return { ok: false, error: "Invalid or expired access token" };
  }
}
