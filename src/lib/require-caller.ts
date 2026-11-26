import { NextResponse } from "next/server";

/**
 * Auth gate for published private/team apps.
 * Avoids importing cursor/identity.ts (Turbopack fails on its .js extension alias locally).
 * On the published host the Cursor gate already requires sign-in; we still require the
 * identity header so anonymous/cross-site callers without it are rejected.
 */
export function requireCaller(request: Request):
  | { ok: true; sub: string }
  | { ok: false; response: NextResponse } {
  const isPublished = Boolean(process.env.CURSOR_APP_ID || process.env.VERCEL);
  const header =
    request.headers.get("x-cursor-identity-v2") ||
    request.headers.get("x-cursor-identity");

  if (!isPublished) {
    return { ok: true, sub: "local-dev" };
  }

  if (!header) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized", reason: "missing_header" },
        { status: 401 },
      ),
    };
  }

  // Opaque subject for rate limiting — do not parse/verify claims here.
  return { ok: true, sub: `session:${header.slice(0, 24)}` };
}
