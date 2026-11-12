import { db } from "@/lib/db";
import { checkOrigin, clientIp, error, json, readJson, tooManyRequests } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { toSelfUser } from "@/lib/users";
import { fieldErrors, registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const blocked = checkOrigin(req);
  if (blocked) return blocked;

  const limit = rateLimit(`register:${clientIp(req)}`, 10, 60 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) return error("Please check the highlighted fields", 400, fieldErrors(parsed.error));
  const { username, displayName, password } = parsed.data;

  if (await db.user.findUnique({ where: { username }, select: { id: true } })) {
    return error("That username is taken", 409, { username: "That username is taken" });
  }

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await db.user.create({ data: { username, displayName, passwordHash, lastSeenAt: new Date() } });
  } catch (e) {
    // Two sign-ups raced for the same name; the unique index decided.
    if ((e as { code?: string }).code === "P2002") {
      return error("That username is taken", 409, { username: "That username is taken" });
    }
    throw e;
  }

  await createSession(user.id, req.headers.get("user-agent"));
  return json({ user: toSelfUser(user) }, 201);
}
