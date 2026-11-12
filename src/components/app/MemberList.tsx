"use client";

import { Avatar } from "@/components/Avatar";
import type { PublicUser } from "@/lib/types";
import type { OpenProfile } from "./AppShell";

type Props = { users: PublicUser[] | null; onOpenProfile: OpenProfile };

export function MemberList({ users, onOpenProfile }: Props) {
  if (!users) {
    return (
      <div className="space-y-3 p-4" aria-busy>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3">
            <div className="size-8 rounded-full bg-hover" />
            <div className="h-3 flex-1 rounded bg-hover" />
          </div>
        ))}
      </div>
    );
  }

  const online = users.filter((u) => u.status !== "offline");
  const offline = users.filter((u) => u.status === "offline");

  return (
    <div className="h-full overflow-y-auto px-2 py-4">
      <Group title="Online" users={online} onOpenProfile={onOpenProfile} />
      <Group title="Offline" users={offline} onOpenProfile={onOpenProfile} dimmed />
    </div>
  );
}

function Group({ title, users, onOpenProfile, dimmed }: Props & { title: string; users: PublicUser[]; dimmed?: boolean }) {
  if (users.length === 0) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {title} — {users.length}
      </h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <button
              onClick={(e) => onOpenProfile(user, e.currentTarget)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-hover hover:opacity-100 ${
                dimmed ? "opacity-50" : ""
              }`}
            >
              <Avatar user={user} size={32} status={user.status} ring="border-side" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{user.displayName}</span>
                {user.bio && <span className="block truncate text-xs text-muted">{user.bio}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
