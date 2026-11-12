import { beforeEach, describe, expect, it } from "vitest";
import { sniffImage } from "@/lib/image";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";
import { loginSchema, profileUpdateSchema, registerSchema } from "@/lib/validation";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$abc$def")).toBe(false);
    expect(await verifyPassword("x", "scrypt$999999999$8$1$abc$def")).toBe(false);
  });
});

describe("validation", () => {
  it("normalises usernames to lowercase", () => {
    const parsed = registerSchema.parse({ username: "  Ada_L ", displayName: " Ada ", password: "longenough" });
    expect(parsed).toEqual({ username: "ada_l", displayName: "Ada", password: "longenough" });
  });

  it.each(["ab", "has space", "emoji😀", "a..b", "x".repeat(21), "semi;colon"])("rejects username %j", (username) => {
    expect(registerSchema.safeParse({ username, displayName: "A", password: "longenough" }).success).toBe(false);
  });

  it("rejects short passwords and empty display names", () => {
    expect(registerSchema.safeParse({ username: "ada", displayName: "A", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ username: "ada", displayName: "   ", password: "longenough" }).success).toBe(false);
  });

  it("rejects non-object and missing login input", () => {
    expect(loginSchema.safeParse(undefined).success).toBe(false);
    expect(loginSchema.safeParse({ username: "ada" }).success).toBe(false);
  });

  it("accepts partial profile updates but not empty or unknown-status ones", () => {
    expect(profileUpdateSchema.safeParse({ status: "busy" }).success).toBe(true);
    expect(profileUpdateSchema.safeParse({ bio: "" }).success).toBe(true);
    expect(profileUpdateSchema.safeParse({}).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ status: "away" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ bio: "x".repeat(191) }).success).toBe(false);
  });

  it("drops fields a client must not set", () => {
    expect(profileUpdateSchema.parse({ bio: "hi", passwordHash: "x", id: "y" })).toEqual({ bio: "hi" });
  });
});

describe("rate limiting", () => {
  beforeEach(resetRateLimits);

  it("blocks after the limit and recovers when the window ends", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, 500);
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 1 });
    expect(rateLimit("k", 3, 1000, 1000).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true);
  });
});

describe("image sniffing", () => {
  const pad = (bytes: number[]) => Uint8Array.from([...bytes, ...new Array(16).fill(0)]);

  it("recognises supported formats by content", () => {
    expect(sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(sniffImage(pad([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))?.ext).toBe("gif");
    expect(sniffImage(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))?.ext).toBe("webp");
  });

  it("rejects everything else, including SVG and HTML", () => {
    const text = (s: string) => new TextEncoder().encode(s);
    expect(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImage(text("<!doctype html><html></html>"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});
