type Env = Record<string, string | undefined>;

export type SessionCookieAttributes = {
  httpOnly: true;
  path: "/";
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  partitioned?: true;
};

/**
 * Attributes for the session cookie.
 *
 * The default (SameSite=Lax) is right for an app opened in its own tab, but browsers drop such a
 * cookie when the app is embedded in a frame on another site. SESSION_COOKIE_SAMESITE=none opts in
 * to embedded use; it only works over HTTPS (or localhost).
 */
export function sessionCookieAttributes(env: Env = process.env): SessionCookieAttributes {
  const requested = (env.SESSION_COOKIE_SAMESITE || "lax").toLowerCase();
  const sameSite = requested === "strict" || requested === "none" ? requested : "lax";
  const base = { httpOnly: true, path: "/" } as const;

  if (sameSite === "none") {
    // Browsers reject SameSite=None without Secure. Partitioned keeps the cookie usable where
    // third-party cookies are blocked, by scoping it to the embedding site.
    return { ...base, sameSite, secure: true, partitioned: true };
  }
  const secure = env.SESSION_COOKIE_SECURE ? env.SESSION_COOKIE_SECURE === "true" : env.NODE_ENV === "production";
  return { ...base, sameSite, secure };
}
