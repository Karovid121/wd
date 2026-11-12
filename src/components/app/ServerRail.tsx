import { Logo } from "@/components/Logo";

export function ServerRail() {
  return (
    <nav aria-label="Servers" className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-rail py-3">
      <div className="group relative flex w-full justify-center">
        <span className="absolute top-1/2 left-0 h-9 w-1 -translate-y-1/2 rounded-r-full bg-fg" />
        <span
          title="Home"
          aria-current="page"
          className="flex size-12 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-accent/20 transition-transform duration-200 group-hover:scale-105"
        >
          <Logo className="size-12" />
        </span>
      </div>
      <span className="h-0.5 w-8 rounded-full bg-line" />
    </nav>
  );
}
