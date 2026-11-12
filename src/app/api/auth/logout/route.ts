import { db } from "@/lib/db";
import { checkOrigin, json } from "@/lib/http";
import { destroyCurrentSession, getSession } from "@/lib/session";

export async function POST(req: Request) {
  const blocked = checkOrigin(req);
  if (blocked) return blocked;

  const session = await getSession();
  await destroyCurrentSession();
  if (session) {
    // Show as offline right away unless another device is still signed in.
    const remaining = await db.session.count({ where: { userId: session.userId, expiresAt: { gt: new Date() } } });
    if (remaining === 0) await db.user.update({ where: { id: session.userId }, data: { lastSeenAt: null } });
  }
  return json({ ok: true });
}
