// TEMPORARY login diagnostics — not for commit. Sets cookies with different attributes, then
// records which ones the browser sends back, plus the request context, to a local log file.
import { appendFile } from "node:fs/promises";
import { cookies } from "next/headers";

const LOG = "/tmp/nexora-auth-debug.log";

const PROBES: Record<string, Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2]> = {
  p_lax: { path: "/", sameSite: "lax" },
  p_lax_secure: { path: "/", sameSite: "lax", secure: true },
  p_lax_secure_httponly: { path: "/", sameSite: "lax", secure: true, httpOnly: true },
  p_lax_secure_expires: { path: "/", sameSite: "lax", secure: true, maxAge: 3600 },
  p_none_secure: { path: "/", sameSite: "none", secure: true },
  p_none_secure_partitioned: { path: "/", sameSite: "none", secure: true, partitioned: true },
  p_none_secure_partitioned_httponly_expires: {
    path: "/",
    sameSite: "none",
    secure: true,
    partitioned: true,
    httpOnly: true,
    maxAge: 3600,
  },
};

function context(req: Request) {
  const h = (name: string) => req.headers.get(name);
  let referer: string | null = null;
  try {
    const url = new URL(h("referer") ?? "");
    referer = url.origin + url.pathname;
  } catch {}
  return {
    host: h("host"),
    forwardedHost: h("x-forwarded-host"),
    forwardedProto: h("x-forwarded-proto"),
    origin: h("origin"),
    referer,
    secFetchSite: h("sec-fetch-site"),
    secFetchMode: h("sec-fetch-mode"),
    secFetchDest: h("sec-fetch-dest"),
    secFetchStorageAccess: h("sec-fetch-storage-access"),
    secChUa: h("sec-ch-ua"),
    cookieNames: (h("cookie") ?? "")
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter(Boolean),
  };
}

async function log(entry: unknown) {
  await appendFile(LOG, JSON.stringify({ at: new Date().toISOString(), ...(entry as object) }) + "\n");
}

export async function GET(req: Request) {
  const store = await cookies();
  for (const [name, options] of Object.entries(PROBES)) store.set(name, "1", options);
  await log({ step: "set", ...context(req) });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const ctx = context(req);
  const client = await req.json().catch(() => null);
  const returned = Object.keys(PROBES).filter((name) => ctx.cookieNames.includes(name));
  await log({ step: "read", returned, missing: Object.keys(PROBES).filter((n) => !returned.includes(n)), client, ...ctx });
  return Response.json({ returned }, { headers: { "Cache-Control": "no-store" } });
}
