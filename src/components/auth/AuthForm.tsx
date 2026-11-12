"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [values, setValues] = useState({ username: "", displayName: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = (isRegister ? registerSchema : loginSchema).safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));

    setLoading(true);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", json: parsed.data });
      router.replace("/");
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        setErrors(err.fields);
        if (Object.keys(err.fields).length === 0) setFormError(err.message);
      } else {
        setFormError("Something went wrong");
      }
    }
  }

  return (
    // method="post" keeps credentials out of the URL if the form is submitted before the page is interactive.
    <form method="post" onSubmit={submit} noValidate className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {isRegister ? "Pick a name and you're in." : "Good to see you again."}
        </p>
      </div>

      {formError && (
        <div role="alert" className="animate-pop rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </div>
      )}

      {isRegister && (
        <Field
          label="Display name"
          name="displayName"
          autoComplete="name"
          maxLength={32}
          placeholder="How others see you"
          value={values.displayName}
          onChange={set("displayName")}
          error={errors.displayName}
          autoFocus
        />
      )}
      <Field
        label="Username"
        name="username"
        prefix="@"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={isRegister ? 20 : 64}
        value={values.username}
        onChange={set("username")}
        error={errors.username}
        hint={isRegister ? "3–20 characters: letters, numbers, underscores, periods." : undefined}
        autoFocus={!isRegister}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        maxLength={128}
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        hint={isRegister ? "At least 8 characters." : undefined}
      />

      <Button type="submit" loading={loading} className="w-full">
        {isRegister ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted">
        {isRegister ? "Already have an account? " : "New to Nexora? "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-accent-soft transition-colors hover:text-fg hover:underline"
        >
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
