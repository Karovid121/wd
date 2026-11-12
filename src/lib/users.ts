import "server-only";
import type { User } from "@/generated/prisma/client";
import type { PublicUser, SelfUser, Status } from "./types";

/** A user with no heartbeat for this long is shown as offline. */
export const PRESENCE_TIMEOUT_MS = 90_000;

export function effectiveStatus(user: Pick<User, "status" | "lastSeenAt">, now = Date.now()): Status {
  if (!user.lastSeenAt || now - user.lastSeenAt.getTime() > PRESENCE_TIMEOUT_MS) return "offline";
  return user.status.toLowerCase() as Status;
}

export function toPublicUser(user: User, now = Date.now()): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarFile ? `/api/files/${user.avatarFile}` : null,
    bio: user.bio,
    status: effectiveStatus(user, now),
    createdAt: user.createdAt.toISOString(),
  };
}

export function toSelfUser(user: User): SelfUser {
  const preferredStatus = user.status.toLowerCase() as Status;
  // The viewer is by definition connected, so show them the status they chose.
  return { ...toPublicUser(user), status: preferredStatus, preferredStatus };
}
