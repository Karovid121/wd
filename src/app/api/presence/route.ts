import { db } from "@/lib/db";
import { json, requireUser } from "@/lib/http";
import { refreshSession } from "@/lib/session";
import { toPublicUser, toSelfUser } from "@/lib/users";

const STATUS_ORDER = { online: 0, idle: 1, busy: 2, offline: 3 } as const;

/** Heartbeat: marks the caller as connected and returns everyone's current presence. */
export async function POST(req: Request) {
  const auth = await requireUser(req, { mutation: true });
  if (auth instanceof Response) return auth;

  const me = await db.user.update({ where: { id: auth.user.id }, data: { lastSeenAt: new Date() } });
  await refreshSession(auth.session);

  const now = Date.now();
  const users = (await db.user.findMany({ orderBy: { displayName: "asc" }, take: 500 }))
    .map((u) => toPublicUser(u, now))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return json({ me: toSelfUser(me), users });
}
