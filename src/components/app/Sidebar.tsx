"use client";

import { useEffect, useRef, useState } from "react";
import { Check, House, Settings, UserRound } from "lucide-react";
import { Avatar, StatusDot } from "@/components/Avatar";
import type { SelfUser, Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import type { SettingsTab } from "./SettingsModal";

const STATUS_OPTIONS: { value: Status; label: string; hint?: string }[] = [
  { value: "online", label: "Online" },
  { value: "idle", label: "Idle" },
  { value: "busy", label: "Do Not Disturb" },
  { value: "offline", label: "Invisible", hint: "You'll appear offline to everyone" },
];

type Props = {
  me: SelfUser;
  onStatus: (status: Status) => Promise<void>;
  onOpenSettings: (tab: SettingsTab) => void;
};

export function Sidebar({ me, onStatus, onOpenSettings }: Props) {
  return (
    <div className="flex w-60 shrink-0 flex-col bg-side">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <span className="text-[15px] font-semibold tracking-tight">Nexora</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div
          aria-current="page"
          className="flex items-center gap-3 rounded-lg bg-hover px-3 py-2 text-sm font-medium text-fg"
        >
          <House className="size-[18px] text-accent-soft" />
          Home
        </div>
        <p className="mt-6 px-3 text-xs leading-relaxed text-faint">
          Your servers and conversations will be listed here once you have some.
        </p>
      </div>

      <UserPanel me={me} onStatus={onStatus} onOpenSettings={onOpenSettings} />
    </div>
  );
}

function UserPanel({ me, onStatus, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Status | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(status: Status) {
    setPending(status);
    try {
      await onStatus(status);
      setOpen(false);
    } catch {
      // Leave the menu open; the tick stays on the status that is actually saved.
    } finally {
      setPending(null);
    }
  }

  const statusText = me.preferredStatus === "offline" ? "Invisible" : STATUS_LABEL[me.preferredStatus];

  return (
    <div ref={ref} className="relative border-t border-line bg-rail/60 p-2">
      {open && (
        <div
          role="menu"
          aria-label="Set status"
          className="absolute inset-x-2 bottom-full z-20 mb-2 origin-bottom animate-pop rounded-xl border border-line bg-elev p-1.5 shadow-2xl shadow-black/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="menuitemradio"
              aria-checked={me.preferredStatus === opt.value}
              disabled={pending !== null}
              onClick={() => choose(opt.value)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-hover disabled:opacity-60"
            >
              <StatusDot status={opt.value} size={10} />
              <span className="flex-1">
                {opt.label}
                {opt.hint && <span className="block text-xs text-faint">{opt.hint}</span>}
              </span>
              {me.preferredStatus === opt.value && <Check className="size-4 text-accent-soft" />}
            </button>
          ))}
          <div className="my-1.5 h-px bg-line" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings("profile");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-hover"
          >
            <UserRound className="size-4 text-muted" />
            Edit profile
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${me.displayName}, ${statusText}. Change status`}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-hover"
        >
          <Avatar user={me} size={34} status={me.preferredStatus} ring="border-side" />
          <span className="min-w-0">
            <span className="block truncate text-sm leading-tight font-semibold">{me.displayName}</span>
            <span className="block truncate text-xs leading-tight text-muted">{statusText}</span>
          </span>
        </button>
        <button
          onClick={() => onOpenSettings("profile")}
          aria-label="User settings"
          className="rounded-lg p-2 text-muted transition-all hover:bg-hover hover:text-fg [&:hover>svg]:rotate-45"
        >
          <Settings className="size-[18px] transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
