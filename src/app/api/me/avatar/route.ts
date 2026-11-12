import { db } from "@/lib/db";
import { error, json, requireUser, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_AVATAR_BYTES, deleteStoredFile, saveImage } from "@/lib/storage";
import { toSelfUser } from "@/lib/users";

const TOO_LARGE = "Image must be 2 MB or smaller";

export async function POST(req: Request) {
  const auth = await requireUser(req, { mutation: true });
  if (auth instanceof Response) return auth;

  const limit = rateLimit(`avatar:${auth.user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  // Reject obviously oversized uploads before buffering the body.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_AVATAR_BYTES + 64 * 1024) return error(TOO_LARGE, 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return error("Invalid upload", 400);
  }
  if (!(file instanceof File) || file.size === 0) return error("Choose an image to upload", 400);
  if (file.size > MAX_AVATAR_BYTES) return error(TOO_LARGE, 413);

  const name = await saveImage(new Uint8Array(await file.arrayBuffer()));
  if (!name) return error("Use a PNG, JPEG, GIF or WebP image", 415);

  const user = await db.user.update({ where: { id: auth.user.id }, data: { avatarFile: name } });
  await deleteStoredFile(auth.user.avatarFile);
  return json({ user: toSelfUser(user) });
}

export async function DELETE(req: Request) {
  const auth = await requireUser(req, { mutation: true });
  if (auth instanceof Response) return auth;

  const user = await db.user.update({ where: { id: auth.user.id }, data: { avatarFile: null } });
  await deleteStoredFile(auth.user.avatarFile);
  return json({ user: toSelfUser(user) });
}
