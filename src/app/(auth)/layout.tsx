import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh items-center justify-center overflow-y-auto bg-rail px-4 py-10">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 size-[34rem] animate-drift rounded-full bg-accent/25 blur-[120px]" />
        <div className="absolute -right-32 -bottom-48 size-[30rem] animate-drift rounded-full bg-cyan/15 blur-[120px] [animation-delay:-8s]" />
      </div>
      <div className="relative m-auto w-full max-w-md animate-rise">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo className="size-10" />
          <span className="text-2xl font-semibold tracking-tight">Nexora</span>
        </div>
        <div className="rounded-2xl border border-line bg-side/90 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
