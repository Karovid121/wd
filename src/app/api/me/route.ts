import { db } from "@/lib/db";
import { error, json, readJson, requireUser } from "@/lib/http";
import { toSelfUser } from "@/lib/users";
import { fieldErrors, profileUpdateSchema } from "@/lib/validation";
import type { UserStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  return json({ user: toSelfUser(auth.user) });
}

export async function PATCH(req: Request) {
  const auth = await requireUser(req, { mutation: true });
  if (auth instanceof Response) return auth;

  const parsed = profileUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return error("Please check the highlighted fields", 400, fieldErrors(parsed.error));
  const { status, ...rest } = parsed.data;

  try {
    const user = await db.user.update({
      where: { id: auth.user.id },
      data: { ...rest, ...(status ? { status: status.toUpperCase() as UserStatus } : {}), lastSeenAt: new Date() },
    });
    return json({ user: toSelfUser(user) });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return error("That username is taken", 409, { username: "That username is taken" });
    }
    throw e;
  }
}
