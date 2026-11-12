export type Status = "online" | "idle" | "busy" | "offline";

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  /** What other people see: the chosen status, or offline when the user is not connected. */
  status: Status;
  createdAt: string;
};

export type SelfUser = PublicUser & {
  /** The status the user picked, regardless of whether they are connected. */
  preferredStatus: Status;
};

export const STATUS_LABEL: Record<Status, string> = {
  online: "Online",
  idle: "Idle",
  busy: "Do Not Disturb",
  offline: "Offline",
};
