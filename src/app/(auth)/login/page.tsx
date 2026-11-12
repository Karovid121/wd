import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Log in · Nexora" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
