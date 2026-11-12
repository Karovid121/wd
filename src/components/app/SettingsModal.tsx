"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, KeyRound, LogOut, Trash2, UserRound, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button, Field } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { SelfUser } from "@/lib/types";
import { fieldErrors, passwordChangeSchema, profileUpdateSchema } from "@/lib/validation";

export type SettingsTab = "profile" | "account";

const TABS: { id: SettingsTab; label: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "account", label: "Account", icon: KeyRound },
];

const BIO_MAX = 190;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type Props = {
  me: SelfUser;
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  onClose: () => void;
  onUpdated: (user: SelfUser) => void;
  onLogout: () => Promise<void>;
};

export function SettingsModal({ me, tab, onTab, onClose, onUpdated, onLogout }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal aria-label="User settings" className="fixed inset-0 z-50 flex animate-fade flex-col bg-main md:flex-row">
      <nav className="flex shrink-0 gap-1 border-b border-line bg-side p-2 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-4 md:pt-14">
        <p className="mb-1 hidden px-3 text-xs font-semibold tracking-wide text-muted uppercase md:block">User settings</p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-hover text-fg" : "text-muted hover:bg-hover/60 hover:text-fg"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
        <div className="my-2 hidden h-px bg-line md:block" />
        <LogoutButton onLogout={onLogout} />
      </nav>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="absolute top-4 right-4 z-10 rounded-full border border-line p-2 text-muted transition-all hover:rotate-90 hover:border-faint hover:text-fg"
        >
          <X className="size-5" />
        </button>
        <div key={tab} className="mx-auto max-w-xl animate-rise px-5 py-8 md:px-10 md:py-14">
          {tab === "profile" ? <ProfileTab me={me} onUpdated={onUpdated} /> : <AccountTab />}
        </div>
      </div>
    </div>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void onLogout();
      }}
      className="ml-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60 md:ml-0"
    >
      <LogOut className="size-4" />
      Log out
    </button>
  );
}

function Notice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`animate-fade text-sm ${kind === "ok" ? "text-online" : "text-danger"}`}>
      {children}
    </p>
  );
}

function ProfileTab({ me, onUpdated }: { me: SelfUser; onUpdated: (user: SelfUser) => void }) {
  const [values, setValues] = useState({ displayName: me.displayName, username: me.username, bio: me.bio });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const changed = Object.fromEntries(
    (Object.keys(values) as (keyof typeof values)[])
      .filter((k) => values[k].trim() !== me[k])
      .map((k) => [k, values[k]]),
  );
  const dirty = Object.keys(changed).length > 0;

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setNotice(null);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileUpdateSchema.safeParse(changed);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      const { user } = await api<{ user: SelfUser }>("/api/me", { method: "PATCH", json: parsed.data });
      onUpdated(user);
      setValues({ displayName: user.displayName, username: user.username, bio: user.bio });
      setNotice({ kind: "ok", text: "Profile saved" });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setErrors(apiErr?.fields ?? {});
      if (!apiErr || Object.keys(apiErr.fields).length === 0) {
        setNotice({ kind: "error", text: apiErr?.message ?? "Something went wrong" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function avatarRequest(run: () => Promise<{ user: SelfUser }>) {
    setAvatarBusy(true);
    setAvatarError("");
    try {
      onUpdated((await run()).user);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setAvatarBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) return setAvatarError("Image must be 2 MB or smaller");
    const form = new FormData();
    form.append("file", file);
    void avatarRequest(() => api("/api/me/avatar", { method: "POST", form }));
  }

  return (
    <>
      <h2 className="text-xl font-semibold">My Profile</h2>
      <p className="mt-1 text-sm text-muted">This is how you appear to everyone on Nexora.</p>

      <div className="mt-6 flex items-center gap-5 rounded-2xl border border-line bg-side p-5">
        <div className={`transition-opacity ${avatarBusy ? "animate-pulse opacity-60" : ""}`}>
          <Avatar user={me} size={84} />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onFile}
              className="hidden"
              aria-label="Avatar image"
            />
            <Button type="button" loading={avatarBusy} onClick={() => fileRef.current?.click()}>
              {!avatarBusy && <Camera className="size-4" />}
              {me.avatarUrl ? "Change avatar" : "Upload avatar"}
            </Button>
            {me.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                disabled={avatarBusy}
                onClick={() => avatarRequest(() => api("/api/me/avatar", { method: "DELETE" }))}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
          </div>
          {avatarError ? <Notice kind="error">{avatarError}</Notice> : <p className="text-xs text-faint">PNG, JPEG, GIF or WebP, up to 2 MB.</p>}
        </div>
      </div>

      <form onSubmit={save} noValidate className="mt-6 space-y-5">
        <Field
          label="Display name"
          name="displayName"
          maxLength={32}
          value={values.displayName}
          onChange={set("displayName")}
          error={errors.displayName}
        />
        <Field
          label="Username"
          name="username"
          prefix="@"
          maxLength={20}
          autoCapitalize="none"
          spellCheck={false}
          value={values.username}
          onChange={set("username")}
          error={errors.username}
          hint="Unique to you. Letters, numbers, underscores and periods."
        />
        <div>
          <label htmlFor="settings-bio" className="mb-1.5 flex justify-between text-xs font-semibold tracking-wide text-muted uppercase">
            About me
            <span className={`font-normal tabular-nums ${values.bio.length > BIO_MAX ? "text-danger" : "text-faint"}`}>
              {values.bio.length}/{BIO_MAX}
            </span>
          </label>
          <textarea
            id="settings-bio"
            name="bio"
            rows={3}
            value={values.bio}
            onChange={(e) => set("bio")(e.target.value)}
            placeholder="Tell people a little about yourself"
            className={`w-full resize-none rounded-lg border bg-rail px-3 py-2.5 text-[15px] transition-colors outline-none placeholder:text-faint focus:border-accent ${
              errors.bio ? "border-danger/70" : "border-line hover:border-faint"
            }`}
          />
          {errors.bio && <p className="mt-1.5 text-xs text-danger">{errors.bio}</p>}
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
        </div>
      </form>
    </>
  );
}

function AccountTab() {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setNotice(null);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordChangeSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      await api("/api/me/password", { method: "POST", json: parsed.data });
      setValues({ currentPassword: "", newPassword: "" });
      setNotice({ kind: "ok", text: "Password changed. Your other devices were signed out." });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setErrors(apiErr?.fields ?? {});
      if (!apiErr || Object.keys(apiErr.fields).length === 0) {
        setNotice({ kind: "error", text: apiErr?.message ?? "Something went wrong" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold">Account</h2>
      <p className="mt-1 text-sm text-muted">Change the password you use to log in.</p>

      <form onSubmit={save} noValidate className="mt-6 space-y-5 rounded-2xl border border-line bg-side p-5">
        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          value={values.currentPassword}
          onChange={set("currentPassword")}
          error={errors.currentPassword}
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={values.newPassword}
          onChange={set("newPassword")}
          error={errors.newPassword}
          hint="At least 8 characters."
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" loading={saving} disabled={!values.currentPassword || !values.newPassword}>
            Change password
          </Button>
          {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
        </div>
      </form>
    </>
  );
}
