import { NextResponse } from "next/server";
import { getIdentity } from "../../cursor/identity";

/**
 * Auth gate for published private/team apps.
 * Verifies the Cursor identity JWT (or the local simulated viewer in development).
 */
export async function requireCaller(
  request: Request,
): Promise<{ ok: true; sub: string } | { ok: false; response: NextResponse }> {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized", reason: identity.reason },
        { status: 401, headers: { "cache-control": "private, no-store" } },
      ),
    };
  }

  return { ok: true, sub: identity.sub };
}
