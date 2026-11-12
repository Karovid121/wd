import { db } from "@/lib/db";
import { error, json, readJson, requireUser, tooManyRequests } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, passwordChangeSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireUser(req, { mutation: true });
  if (auth instanceof Response) return auth;

  const limit = rateLimit(`password:${auth.user.id}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = passwordChangeSchema.safeParse(await readJson(req));
  if (!parsed.success) return error("Please check the highlighted fields", 400, fieldErrors(parsed.error));

  if (!(await verifyPassword(parsed.data.currentPassword, auth.user.passwordHash))) {
    return error("Current password is incorrect", 400, { currentPassword: "Current password is incorrect" });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  // Changing the password signs out every other device.
  await db.$transaction([
    db.user.update({ where: { id: auth.user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: auth.user.id, id: { not: auth.session.id } } }),
  ]);
  return json({ ok: true });
}
