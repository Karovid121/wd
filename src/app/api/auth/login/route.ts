import { db } from "@/lib/db";
import { checkOrigin, clientIp, error, json, readJson, tooManyRequests } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { toSelfUser } from "@/lib/users";
import { fieldErrors, loginSchema } from "@/lib/validation";

// Verified against when the username does not exist, so both cases take the same time.
let dummyHash: Promise<string> | undefined;

export async function POST(req: Request) {
  const blocked = checkOrigin(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const ipLimit = rateLimit(`login-ip:${ip}`, 30, 10 * 60_000);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) return error("Please check the highlighted fields", 400, fieldErrors(parsed.error));
  const { username, password } = parsed.data;

  const userLimit = rateLimit(`login-user:${ip}:${username}`, 10, 10 * 60_000);
  if (!userLimit.ok) return tooManyRequests(userLimit.retryAfterSeconds);

  const user = await db.user.findUnique({ where: { username } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await (dummyHash ??= hashPassword("nexora-dummy"))));
  if (!user || !valid) return error("Incorrect username or password", 401);

  const updated = await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  await createSession(user.id, req.headers.get("user-agent"));
  return json({ user: toSelfUser(updated) });
}
