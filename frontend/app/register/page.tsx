"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const inputField =
  "w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2.5 text-sm font-medium text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] outline-none transition placeholder:text-cg-muted focus:ring-2 focus:ring-blue-500/35";
const inputClass = `mt-2 ${inputField}`;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await registerUser(name, email, password);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:py-16">
      <div className="rounded-3xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-8 shadow-[var(--cg-3d-shadow)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[var(--cg-3d-shadow-hover)] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cg-muted">CareerGuide</p>
        <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-cg-text">Create account</h1>
        <p className="mt-2 text-sm font-medium text-cg-muted">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold text-emerald-900 underline decoration-emerald-900/40 underline-offset-4 hover:text-emerald-950"
          >
            Sign in
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-cg-text">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-cg-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-cg-text">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputField} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-cg-muted outline-none transition hover:bg-black/[0.04] hover:text-cg-text focus-visible:ring-2 focus-visible:ring-blue-500/35"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
            <p className="mt-2 text-xs font-medium text-cg-muted">
              8+ chars, uppercase, lowercase, and a number (API rule).
            </p>
          </div>
          {error ? (
            <p className="rounded-lg border-2 border-red-800/30 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 py-3 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-emerald-700 hover:shadow-[5px_5px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--cg-3d-border)]"
          >
            {pending ? "Creating…" : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}
