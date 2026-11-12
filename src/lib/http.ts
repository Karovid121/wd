import "server-only";
import type { Session, User } from "@/generated/prisma/client";
import { rateLimit } from "./rate-limit";
import { getSession } from "./session";

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function error(message: string, status: number, fields?: Record<string, string>, headers?: Record<string, string>) {
  return json({ error: message, ...(fields ? { fields } : {}) }, status, headers);
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * CSRF defence for requests that change data: a browser request must come from the app's own origin.
 * Returns an error response when it does not, otherwise null.
 */
export function checkOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser clients send no Origin; browsers that omit it still send Sec-Fetch-Site.
    const site = req.headers.get("sec-fetch-site");
    return site && site !== "same-origin" && site !== "none" ? error("Cross-site request blocked", 403) : null;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return error("Cross-site request blocked", 403);
  }
  const allowed = new Set<string>();
  for (const name of ["host", "x-forwarded-host"]) {
    const value = req.headers.get(name)?.split(",")[0]?.trim();
    if (value) allowed.add(value);
  }
  if (process.env.APP_ORIGIN) {
    try {
      allowed.add(new URL(process.env.APP_ORIGIN).host);
    } catch {}
  }
  return allowed.has(originHost) ? null : error("Cross-site request blocked", 403);
}

export function tooManyRequests(retryAfterSeconds: number) {
  return error("Too many attempts. Please wait a moment and try again.", 429, undefined, {
    "Retry-After": String(retryAfterSeconds),
  });
}

/** Parses a JSON body, returning undefined for oversized or malformed payloads. */
export async function readJson(req: Request, maxBytes = 16 * 1024): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

type Authed = { user: User; session: Session };

/** Guard for signed-in API routes. Mutations also get the origin check and a per-user rate limit. */
export async function requireUser(req: Request, opts: { mutation?: boolean } = {}): Promise<Authed | Response> {
  if (opts.mutation) {
    const blocked = checkOrigin(req);
    if (blocked) return blocked;
  }
  const session = await getSession();
  if (!session) return error("You are not signed in", 401);
  if (opts.mutation) {
    const limit = rateLimit(`api:${session.userId}`, 120, 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  }
  const { user, ...rest } = session;
  return { user, session: rest };
}
