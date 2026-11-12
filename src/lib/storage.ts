import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, sniffImage } from "./image";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const FILE_NAME = /^[a-f0-9]{32}\.(png|jpg|gif|webp)$/;

function uploadDir() {
  // The directory is configured at runtime, so it must not be traced into the build output.
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

/** Stores an image under a random name. Returns null when the bytes are not a supported image. */
export async function saveImage(bytes: Uint8Array): Promise<string | null> {
  const kind = sniffImage(bytes);
  if (!kind) return null;
  const name = `${randomBytes(16).toString("hex")}.${kind.ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name), bytes, { mode: 0o600 });
  return name;
}

export async function readStoredFile(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  // The strict name pattern is what prevents path traversal.
  if (!FILE_NAME.test(name)) return null;
  try {
    const bytes = await readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
    return { bytes, mime: MIME_BY_EXT[name.split(".")[1]] };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(name: string | null | undefined) {
  if (!name || !FILE_NAME.test(name)) return;
  await unlink(path.join(/*turbopackIgnore: true*/ uploadDir(), name)).catch(() => {});
}
