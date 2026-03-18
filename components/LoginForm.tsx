"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseAuth } from "@/lib/supabase/shared";

type AuthMode = "login" | "signup";

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination was not recognized.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This account still needs email confirmation before you can sign in.";
  }

  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Signup is temporarily rate-limited by Supabase. Try again shortly or use an existing account.";
  }

  return message;
}

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishAuth = () => {
    router.replace(nextPath as never);
    router.refresh();
  };

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.length < 6) return false;
    if (mode === "signup" && password !== confirmPassword) return false;
    return true;
  }, [confirmPassword, email, mode, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasSupabaseAuth) {
      setError("Supabase auth is not configured. Add the public project URL and a Supabase publishable or anon key first.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (loginError) {
          setError(getAuthErrorMessage(loginError.message));
          return;
        }

        finishAuth();
        return;
      }

      const { error: signUpError, data } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError.message));
        return;
      }

      if (data.session) {
        finishAuth();
        return;
      }

      setMessage("Account created. Check your inbox for a confirmation link, then sign in.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong while talking to the auth service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell rounded-[30px] p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Secure Access</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-slate-300">
            Sign in to manage searches, saved leads, exports, and your workspace settings in one place.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 app-card-grid">
        <label className="grid gap-2">
          <span className="field-label">Email</span>
          <div className="field-shell">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="field-input field-input-plain"
            />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="field-label">Password</span>
          <div className="field-shell">
            <LockKeyhole className="h-4 w-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="field-input field-input-plain"
            />
          </div>
        </label>

        {mode === "signup" ? (
          <label className="grid gap-2">
            <span className="field-label">Confirm password</span>
            <div className="field-shell">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                minLength={6}
                className="field-input field-input-plain"
              />
            </div>
          </label>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="cta-primary mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {mode === "login" ? "Sign in to LeadScout" : "Create account"}
        </button>
      </form>

      <div className="subtle-panel mt-8 app-card-grid-tight rounded-[24px] p-5 text-sm text-slate-300">
        <p className="font-medium text-white">What happens after login</p>
        <p>You’ll land in the dashboard, stay signed in across refreshes, and protected pages will redirect back here if your session expires.</p>
        <p className="text-slate-400">
          Need the public marketing site instead?{" "}
          <Link href="/" className="text-cyan-200 transition hover:text-white">
            Return home
          </Link>
        </p>
      </div>
    </div>
  );
}
