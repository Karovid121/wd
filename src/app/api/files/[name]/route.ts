import { error, requireUser } from "@/lib/http";
import { readStoredFile } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const file = await readStoredFile((await params).name);
  if (!file) return error("Not found", 404);

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.bytes.length),
      // File names are random and never reused, so the bytes behind a URL never change.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
