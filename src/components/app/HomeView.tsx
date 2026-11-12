"use client";

import { useState } from "react";
import { CircleCheck, ChevronRight, Search } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { PublicUser, SelfUser } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import type { OpenProfile } from "./AppShell";
import type { SettingsTab } from "./SettingsModal";

type Props = {
  me: SelfUser;
  users: PublicUser[] | null;
  onOpenProfile: OpenProfile;
  onOpenSettings: (tab: SettingsTab) => void;
};

export function HomeView({ me, users, onOpenProfile, onOpenSettings }: Props) {
  const [query, setQuery] = useState("");

  const steps = [
    { label: "Add a profile picture", done: !!me.avatarUrl },
    { label: "Write something about yourself", done: me.bio.length > 0 },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  const q = query.trim().toLowerCase();
  const matches = users?.filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.username.includes(q));
  const onlineCount = users?.filter((u) => u.status !== "offline").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
        <section className="relative animate-rise overflow-hidden rounded-2xl border border-line bg-elev p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-40 size-56 rounded-full bg-cyan/15 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <Avatar user={me} size={72} status={me.preferredStatus} ring="border-elev" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Hey, {me.displayName}</h2>
              <p className="mt-1 truncate text-sm text-muted">
                Signed in as <span className="text-fg">@{me.username}</span>
              </p>
            </div>
          </div>
        </section>

        {remaining > 0 && (
          <section className="animate-rise rounded-2xl border border-line bg-side p-5 [animation-delay:60ms]">
            <h3 className="font-semibold">Finish your profile</h3>
            <p className="mt-0.5 text-sm text-muted">
              {remaining === 1 ? "One step left." : `${remaining} steps left.`}
            </p>
            <ul className="mt-3 space-y-1.5">
              {steps.map((step) => (
                <li key={step.label}>
                  <button
                    disabled={step.done}
                    onClick={() => onOpenSettings("profile")}
                    className="group flex w-full items-center gap-3 rounded-lg bg-elev px-3.5 py-3 text-left text-sm transition-colors enabled:hover:bg-hover disabled:text-muted"
                  >
                    {step.done ? (
                      <CircleCheck className="size-5 text-online" />
                    ) : (
                      <span className="size-5 rounded-full border-2 border-faint" />
                    )}
                    <span className={`flex-1 ${step.done ? "line-through" : ""}`}>{step.label}</span>
                    {!step.done && (
                      <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="animate-rise [animation-delay:120ms]">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">People</h3>
              <p className="text-sm text-muted">
                {users ? `${onlineCount} online · ${users.length} ${users.length === 1 ? "member" : "members"}` : "Loading…"}
              </p>
            </div>
            <label className="flex w-full items-center gap-2 rounded-lg border border-line bg-rail px-3 transition-colors focus-within:border-accent sm:w-64">
              <Search className="size-4 text-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                aria-label="Search people"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-faint"
              />
            </label>
          </div>

          {matches && matches.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              No one matches “{query.trim()}”.
            </p>
          )}

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {matches?.map((user) => (
              <li key={user.id}>
                <button
                  onClick={(e) => onOpenProfile(user, e.currentTarget)}
                  className="flex w-full items-center gap-3.5 rounded-xl border border-line bg-side p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-faint hover:bg-elev hover:shadow-lg hover:shadow-black/20"
                >
                  <Avatar user={user} size={44} status={user.status} ring="border-side" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{user.displayName}</span>
                      {user.id === me.id && (
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft uppercase">
                          You
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      @{user.username} · {STATUS_LABEL[user.status]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
