"use client";

import { useEffect, useRef } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import { Avatar, StatusDot, userGradient } from "@/components/Avatar";
import type { PublicUser } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export type ProfileAnchor = { userId: string; x: number; y: number };

type Props = {
  user: PublicUser;
  anchor: ProfileAnchor;
  isSelf: boolean;
  onClose: () => void;
  onEdit: () => void;
};

export function ProfileCard({ user, anchor, isSelf, onClose, onEdit }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // Deferred so the click that opened the card does not immediately close it.
    const timer = setTimeout(() => document.addEventListener("mousedown", onDown));
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const joined = new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${user.displayName}'s profile`}
      style={{ left: anchor.x, top: anchor.y }}
      className="fixed z-50 w-80 animate-pop overflow-hidden rounded-2xl border border-line bg-elev shadow-2xl shadow-black/60"
    >
      <div className="h-20" style={{ background: userGradient(user.id) }} />
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <span className="rounded-full border-[5px] border-elev bg-elev">
            <Avatar user={user} size={80} status={user.status} ring="border-elev" />
          </span>
          {isSelf && (
            <button
              onClick={onEdit}
              className="mb-1 inline-flex items-center gap-1.5 rounded-lg bg-hover px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-line"
            >
              <Pencil className="size-3.5" />
              Edit profile
            </button>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-rail/70 p-3.5">
          <p className="truncate text-lg leading-tight font-semibold">{user.displayName}</p>
          <p className="truncate text-sm text-muted">@{user.username}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <StatusDot status={user.status} size={8} />
            {STATUS_LABEL[user.status]}
          </p>

          {user.bio && (
            <>
              <div className="my-3 h-px bg-line" />
              <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">About me</h3>
              <p className="max-h-28 overflow-y-auto text-sm leading-relaxed break-words whitespace-pre-wrap">{user.bio}</p>
            </>
          )}

          <div className="my-3 h-px bg-line" />
          <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">Member since</h3>
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-muted" />
            {joined}
          </p>
        </div>
      </div>
    </div>
  );
}
