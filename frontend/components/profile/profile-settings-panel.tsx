"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dicebearLoreleiAvatar } from "@/components/dashboard/card-art";
import { innerCardClass } from "@/components/life-journey/ui";
import { useAuth } from "@/contexts/auth-context";
import { useCareerStore } from "@/lib/career-store";
import type { SkillAxis } from "@/lib/career-data";
import { getLearnerProfile, saveLearnerProfile } from "@/lib/learner-profile-storage";
import { cn } from "@/lib/utils";

const AGE_BANDS = ["Under 12", "12–14", "15–17", "18–21", "22+"] as const;

const SKILL_LABELS: Record<SkillAxis, string> = {
  memory: "Memory",
  processingSpeed: "Processing speed",
  logic: "Logic",
  balance: "Balance",
  coordination: "Coordination",
  creativity: "Creativity"
};

const inputClass =
  "mt-1.5 w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2.5 text-sm font-medium text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] outline-none focus:ring-2 focus:ring-emerald-400/40";

function Toggle({
  id,
  label,
  description,
  checked,
  onChange
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-3 shadow-[2px_2px_0_0_var(--cg-3d-border)]">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-cg-text">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-cg-muted">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-2 border-[var(--cg-3d-border)] transition",
          checked ? "bg-emerald-700" : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function ProfileSettingsPanel() {
  const router = useRouter();
  const { user, loading, patchProfile, logout } = useAuth();
  const skills = useCareerStore((s) => s.skills);
  const level = useCareerStore((s) => s.level);
  const xp = useCareerStore((s) => s.xp);
  const streak = useCareerStore((s) => s.streak);
  const sessions = useCareerStore((s) => s.sessions);
  const actions = useCareerStore((s) => s.actions);
  const onboardingProfile = useCareerStore((s) => s.onboardingProfile);
  const setOnboardingProfile = useCareerStore((s) => s.setOnboardingProfile);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"Student" | "Parent">("Student");
  const [ageBand, setAgeBand] = useState("");
  const [emailDigest, setEmailDigest] = useState(false);
  const [compactHints, setCompactHints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const syncFromSources = useCallback(() => {
    if (user) {
      setName(user.name);
      setEmailDigest(user.preferences.emailDigest);
      setCompactHints(user.preferences.compactSidebarHints);
    }
    const local = getLearnerProfile();
    const fromStore = onboardingProfile;
    setRole(fromStore.role ?? local.role ?? "Student");
    setAgeBand(fromStore.ageBand || local.ageBand || "");
    setDirty(false);
  }, [user, onboardingProfile]);

  useEffect(() => {
    if (!user) return;
    syncFromSources();
  }, [user, syncFromSources]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const actionAccuracy = useMemo(() => {
    if (!actions.length) return 0;
    const ok = actions.filter((a) => a.success).length;
    return Math.round((ok / actions.length) * 100);
  }, [actions]);

  const topSkills = useMemo(
    () =>
      (Object.entries(skills) as [SkillAxis, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    [skills]
  );

  const markDirty = () => setDirty(true);

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await patchProfile({
        name: name.trim() || user.name,
        preferences: { emailDigest, compactSidebarHints: compactHints }
      });
      const learner = saveLearnerProfile({ role, ageBand });
      setOnboardingProfile({
        role: learner.role,
        name: name.trim() || user.name,
        ageBand: learner.ageBand
      });
      setMessage({ type: "ok", text: "Profile and settings saved." });
      setDirty(false);
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Could not save changes"
      });
    } finally {
      setSaving(false);
    }
  };

  if (user) {
    const avatarSeed = name.trim() || user.email;
    return (
      <ProfileSettingsContent
        user={user}
        avatarSeed={avatarSeed}
        name={name}
        setName={setName}
        role={role}
        setRole={setRole}
        ageBand={ageBand}
        setAgeBand={setAgeBand}
        emailDigest={emailDigest}
        setEmailDigest={setEmailDigest}
        compactHints={compactHints}
        setCompactHints={setCompactHints}
        saving={saving}
        dirty={dirty}
        message={message}
        markDirty={markDirty}
        saveAll={saveAll}
        logout={logout}
        router={router}
        level={level}
        xp={xp}
        streak={streak}
        sessionsCount={sessions.length}
        actionsCount={actions.length}
        actionAccuracy={actionAccuracy}
        skills={skills}
        topSkills={topSkills}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-sm text-cg-muted">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-cg-muted">Sign in to view and edit your profile.</p>
      <Link
        href="/login"
        className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_#14532d]"
      >
        Go to sign in
      </Link>
    </div>
  );
}

function ProfileSettingsContent({
  user,
  avatarSeed,
  name,
  setName,
  role,
  setRole,
  ageBand,
  setAgeBand,
  emailDigest,
  setEmailDigest,
  compactHints,
  setCompactHints,
  saving,
  dirty,
  message,
  markDirty,
  saveAll,
  logout,
  router,
  level,
  xp,
  streak,
  sessionsCount,
  actionsCount,
  actionAccuracy,
  skills,
  topSkills
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  avatarSeed: string;
  name: string;
  setName: (v: string) => void;
  role: "Student" | "Parent";
  setRole: (v: "Student" | "Parent") => void;
  ageBand: string;
  setAgeBand: (v: string) => void;
  emailDigest: boolean;
  setEmailDigest: (v: boolean) => void;
  compactHints: boolean;
  setCompactHints: (v: boolean) => void;
  saving: boolean;
  dirty: boolean;
  message: { type: "ok" | "err"; text: string } | null;
  markDirty: () => void;
  saveAll: () => void;
  logout: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
  level: number;
  xp: number;
  streak: number;
  sessionsCount: number;
  actionsCount: number;
  actionAccuracy: number;
  skills: Record<SkillAxis, number>;
  topSkills: [SkillAxis, number][];
}) {

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <header className="relative overflow-hidden rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)] md:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--cg-3d-border)] bg-white shadow-[3px_3px_0_0_var(--cg-3d-border)]">
            <Image
              src={dicebearLoreleiAvatar(avatarSeed)}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
              Account
            </p>
            <h1 className="font-display text-2xl font-bold text-cg-text md:text-3xl">
              Profile &amp; settings
            </h1>
            <p className="mt-1 truncate text-sm text-cg-muted">{user.email}</p>
            <span className="mt-2 inline-flex rounded-md border-2 border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
              {user.role}
            </span>
          </div>
        </div>
      </header>

      {message ? (
        <p
          className={cn(
            "rounded-xl border-2 px-4 py-2.5 text-sm font-medium",
            message.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-cg-text">Personal details</h2>
        <div className={`${innerCardClass} space-y-4 p-5`}>
          <div>
            <label htmlFor="profile-name" className="text-sm font-semibold text-cg-text">
              Display name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              className={inputClass}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="text-sm font-semibold text-cg-text">
              Email
            </label>
            <input
              id="profile-email"
              value={user.email}
              readOnly
              className={cn(inputClass, "cursor-not-allowed bg-zinc-50 text-cg-muted")}
            />
            <p className="mt-1 text-[11px] text-cg-muted">Email is managed through your sign-in account.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm font-semibold text-cg-text">I am a</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["Student", "Parent"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      markDirty();
                    }}
                    className={cn(
                      "rounded-full border-2 px-3 py-1.5 text-xs font-bold transition",
                      role === r
                        ? "border-emerald-800 bg-emerald-700 text-white shadow-[2px_2px_0_0_#14532d]"
                        : "border-[var(--cg-3d-border)] bg-white text-cg-text"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="profile-age" className="text-sm font-semibold text-cg-text">
                Age band
              </label>
              <select
                id="profile-age"
                value={ageBand}
                onChange={(e) => {
                  setAgeBand(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              >
                <option value="">Select…</option>
                {AGE_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-cg-text">Preferences</h2>
        <div className="space-y-3">
          <Toggle
            id="email-digest"
            label="Email digest"
            description="Occasional summaries when new reports or milestones are ready (coming soon)."
            checked={emailDigest}
            onChange={(v) => {
              setEmailDigest(v);
              markDirty();
            }}
          />
          <Toggle
            id="compact-hints"
            label="Compact sidebar"
            description="Hide the short tagline under the logo for a tighter navigation menu."
            checked={compactHints}
            onChange={(v) => {
              setCompactHints(v);
              markDirty();
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-cg-text">Learning snapshot</h2>
        <div className={`${innerCardClass} p-5`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Level" value={String(level)} />
            <Stat label="XP" value={String(xp)} />
            <Stat label="Streak" value={`${streak}d`} />
            <Stat label="Accuracy" value={`${actionAccuracy}%`} />
          </div>
          <p className="mt-4 text-xs text-cg-muted">
            {sessionsCount} game sessions · {actionsCount} tracked actions
          </p>
          <div className="mt-4 space-y-2.5">
            {(Object.entries(skills) as [SkillAxis, number][]).map(([axis, score]) => (
              <div key={axis}>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-cg-text">{SKILL_LABELS[axis]}</span>
                  <span className="text-cg-muted">{score}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full border border-[var(--cg-3d-border)] bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {topSkills.length > 0 ? (
            <p className="mt-4 text-xs text-cg-muted">
              Strongest areas right now:{" "}
              <span className="font-semibold text-emerald-900">
                {topSkills.map(([a]) => SKILL_LABELS[a]).join(", ")}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-cg-text">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/overview?tab=assessments" label="Assessments" />
          <QuickLink href="/life-journey" label="Life journey" />
          <QuickLink href="/overview?tab=reports" label="Reports" />
          <QuickLink href="/career" label="Career matches" />
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t-2 border-[var(--cg-3d-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={saving || !dirty}
          className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-6 py-3 text-sm font-bold text-white shadow-[4px_4px_0_0_#14532d] transition hover:-translate-x-px hover:-translate-y-px disabled:opacity-50"
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
        <button
          type="button"
          onClick={() => void logout().then(() => router.push("/login"))}
          className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-5 py-3 text-sm font-bold text-rose-800 shadow-[3px_3px_0_0_var(--cg-3d-border)]"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cg-3d-border)] bg-white/90 px-2 py-2 text-center shadow-[1px_1px_0_0_var(--cg-3d-border)]">
      <p className="text-[9px] font-bold uppercase text-cg-muted">{label}</p>
      <p className="font-display text-lg font-bold text-cg-text">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border-2 border-[var(--cg-3d-border)] bg-white px-3 py-1.5 text-xs font-semibold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:-translate-y-px"
    >
      {label}
    </Link>
  );
}
