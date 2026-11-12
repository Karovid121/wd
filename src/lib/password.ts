import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 128 * N * R * 2;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, length, { N: n, r, p, maxmem: MAX_MEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Returns `scrypt$N$r$p$salt$hash` so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const params = [Number(n), Number(r), Number(p)];
  if (params.some((v) => !Number.isInteger(v) || v <= 0) || params[0] > N * 4) return false;
  const expected = Buffer.from(hash, "base64url");
  try {
    const actual = await derive(password, Buffer.from(salt, "base64url"), params[0], params[1], params[2], expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
