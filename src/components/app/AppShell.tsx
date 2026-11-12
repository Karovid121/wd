"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Users } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { PublicUser, SelfUser, Status } from "@/lib/types";
import { HomeView } from "./HomeView";
import { MemberList } from "./MemberList";
import { ProfileCard, type ProfileAnchor } from "./ProfileCard";
import { ServerRail } from "./ServerRail";
import { SettingsModal, type SettingsTab } from "./SettingsModal";
import { Sidebar } from "./Sidebar";

const HEARTBEAT_MS = 30_000;
const CARD_WIDTH = 320;
const CARD_HEIGHT = 400;

export type OpenProfile = (user: PublicUser, anchor: HTMLElement) => void;

export function AppShell({ initialUser }: { initialUser: SelfUser }) {
  const [me, setMe] = useState(initialUser);
  const [users, setUsers] = useState<PublicUser[] | null>(null);
  const [profile, setProfile] = useState<ProfileAnchor | null>(null);
  const [settings, setSettings] = useState<SettingsTab | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [membersInline, setMembersInline] = useState(true);
  const [membersDrawer, setMembersDrawer] = useState(false);
  const router = useRouter();

  const beat = useCallback(async () => {
    try {
      const res = await api<{ me: SelfUser; users: PublicUser[] }>("/api/presence", { method: "POST" });
      setMe(res.me);
      setUsers(res.users);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    // Deferred a tick so the first heartbeat runs as a callback rather than inside the effect body.
    const first = setTimeout(beat, 0);
    const timer = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => document.visibilityState === "visible" && void beat();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [beat]);

  // The roster is refreshed on a timer, so overlay the freshest copy of the signed-in user.
  const roster = useMemo(() => users?.map((u) => (u.id === me.id ? { ...u, ...me } : u)) ?? null, [users, me]);

  const setStatus = useCallback(async (status: Status) => {
    const res = await api<{ user: SelfUser }>("/api/me", { method: "PATCH", json: { status } });
    setMe(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }, [router]);

  const openProfile = useCallback<OpenProfile>((user, anchor) => {
    const rect = anchor.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;
    // Prefer the side of the anchor with more room; centre the card on small screens.
    let x = rect.left > vw / 2 ? rect.left - CARD_WIDTH - 12 : rect.right + 12;
    if (vw < 640 || x < 8 || x + CARD_WIDTH > vw - 8) x = (vw - CARD_WIDTH) / 2;
    const y = Math.max(8, Math.min(rect.top - 24, vh - CARD_HEIGHT - 8));
    setProfile({ userId: user.id, x: Math.max(8, x), y });
  }, []);

  const toggleMembers = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setMembersInline((v) => !v);
    else setMembersDrawer((v) => !v);
  };

  const profileUser = profile ? (roster?.find((u) => u.id === profile.userId) ?? null) : null;
  const overlayOpen = navOpen || membersDrawer;

  return (
    <div className="flex h-dvh overflow-hidden bg-main text-fg">
      {overlayOpen && (
        <button
          aria-label="Close panel"
          onClick={() => {
            setNavOpen(false);
            setMembersDrawer(false);
          }}
          className="fixed inset-0 z-30 animate-fade bg-black/60 lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ServerRail />
        <Sidebar
          me={me}
          onStatus={setStatus}
          onOpenSettings={(tab) => {
            setNavOpen(false);
            setSettings(tab);
          }}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="font-semibold">Home</h1>
          <div className="flex-1" />
          <button
            onClick={toggleMembers}
            aria-label="Toggle member list"
            aria-pressed={membersInline}
            className={`rounded-md p-1.5 transition-colors hover:bg-hover hover:text-fg ${
              membersInline ? "lg:text-fg" : ""
            } text-muted`}
          >
            <Users className="size-5" />
          </button>
        </header>
        <HomeView me={me} users={roster} onOpenProfile={openProfile} onOpenSettings={setSettings} />
      </main>

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 border-l border-line bg-side transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          membersDrawer ? "translate-x-0" : "translate-x-full"
        } ${membersInline ? "" : "lg:hidden"}`}
      >
        <MemberList users={roster} onOpenProfile={openProfile} />
      </aside>

      {profile && profileUser && (
        <ProfileCard
          user={profileUser}
          anchor={profile}
          isSelf={profileUser.id === me.id}
          onClose={() => setProfile(null)}
          onEdit={() => {
            setProfile(null);
            setSettings("profile");
          }}
        />
      )}

      {settings && (
        <SettingsModal
          me={me}
          tab={settings}
          onTab={setSettings}
          onClose={() => setSettings(null)}
          onUpdated={setMe}
          onLogout={logout}
        />
      )}
    </div>
  );
}
