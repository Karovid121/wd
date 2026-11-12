import { z } from "zod";

export const STATUSES = ["online", "idle", "busy", "offline"] as const;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9_.]+$/, "Use only letters, numbers, underscores and periods")
  .refine((v) => !v.includes(".."), "Username cannot contain two periods in a row");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(32, "Display name must be at most 32 characters")
  .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Display name contains invalid characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const bioSchema = z
  .string()
  .trim()
  .max(190, "About me must be at most 190 characters")
  .refine((v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v), "About me contains invalid characters");

export const registerSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(128),
});

export const profileUpdateSchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    bio: bioSchema,
    status: z.enum(STATUSES),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: passwordSchema,
});

/** First error message per field, for showing next to form inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
