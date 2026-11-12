export type ImageKind = { ext: "png" | "jpg" | "gif" | "webp"; mime: string };

/** Identifies an image from its leading bytes; the client-supplied type and name are never trusted. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png", mime: "image/png" };
  if (starts([0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (starts([0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61)
    return { ext: "gif", mime: "image/gif" };
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return { ext: "webp", mime: "image/webp" };
  return null;
}

export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};
