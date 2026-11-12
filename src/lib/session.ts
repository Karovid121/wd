import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Session, User } from "@/generated/prisma/client";
import { sessionCookieAttributes } from "./cookie-options";
import { db } from "./db";

export const SESSION_COOKIE = "nexora_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function cookieOptions(expires: Date) {
  return { ...sessionCookieAttributes(), expires };
}

/** Creates a session and sets its cookie. Only callable from route handlers or server functions. */
export async function createSession(userId: string, userAgent: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, userAgent: userAgent?.slice(0, 255) ?? null, expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function getSession(): Promise<(Session & { user: User }) | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}

/** Extends a session that is still in use, at most once a day. Route handlers only (sets a cookie). */
export async function refreshSession(session: Session) {
  if (Date.now() - session.lastUsedAt.getTime() < REFRESH_AFTER_MS) return;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date(), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}
