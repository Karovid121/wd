import type { Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const DOT: Record<Status, string> = {
  online: "bg-online",
  idle: "bg-idle",
  busy: "bg-busy",
  offline: "bg-offline",
};

type DotProps = { status: Status; size?: number; className?: string };

export function StatusDot({ status, size = 10, className = "" }: DotProps) {
  return (
    <span
      style={{ width: size, height: size }}
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
      className={`inline-block rounded-full transition-colors duration-300 ${DOT[status]} ${className}`}
    />
  );
}

function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

/** A stable per-user gradient, used for avatars without an image and for profile banners. */
export function userGradient(id: string) {
  const h = hue(id);
  return `linear-gradient(135deg, hsl(${h} 72% 58%), hsl(${(h + 48) % 360} 70% 42%))`;
}

type Props = {
  user: { id: string; displayName: string; avatarUrl: string | null };
  size?: number;
  status?: Status;
  /** Border colour class for the status dot; should match the surface behind the avatar. */
  ring?: string;
};

export function Avatar({ user, size = 40, status, ring = "border-side" }: Props) {
  const dot = Math.min(18, Math.max(10, Math.round(size * 0.28)));
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          width={size}
          height={size}
          className="size-full rounded-full bg-elev object-cover"
          draggable={false}
        />
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center rounded-full font-semibold text-white/95 select-none"
          style={{ background: userGradient(user.id), fontSize: size * 0.42 }}
        >
          {(Array.from(user.displayName.trim())[0] ?? "?").toUpperCase()}
        </span>
      )}
      {status && (
        <StatusDot
          status={status}
          size={dot}
          className={`absolute -right-0.5 -bottom-0.5 box-content border-[3px] ${ring}`}
        />
      )}
    </span>
  );
}
