import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";
import { toSelfUser } from "@/lib/users";

async function App() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell initialUser={toSelfUser(user)} />;
}

function Splash() {
  return (
    <div className="flex h-dvh items-center justify-center bg-main">
      <Logo className="size-14 animate-pulse" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Splash />}>
      <App />
    </Suspense>
  );
}
