import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create an account · Nexora" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
