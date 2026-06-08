"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CareerCard, CareerCardWide } from "@/components/dashboard/career-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel } from "@/components/dashboard/right-panel";
import { SectionBlock } from "@/components/dashboard/section-block";
import { MotivationModulesGrid } from "@/components/assessment-engine/MotivationModulesGrid";
import { UserFlowsGrid } from "@/components/assessment-engine/UserFlowsGrid";
import { resolveUserFlowFromTrack } from "@/lib/assessment-engine/user-flow-client";
import { api } from "@/lib/api";
import { gameCatalog } from "@/lib/career-data";
import { useCareerStore } from "@/lib/career-store";
const PROGRAMME_OVERVIEW = {
  eyebrow: "Learning stages · school-friendly documentation",
  title: "Assessment overview",
  lede:
    "CareerGuide offers four staged tracks—one for each phase from primary through senior secondary and early higher education. Together they support teachers and parents with structured insight and better career-fit visibility.",
  highlights: [
    {
      title: "Same scientific core",
      text: "Items combine personality dimensions, career-interest themes, aptitude, and motivation scenarios."
    },
    {
      title: "Adaptive flow",
      text: "The next question can branch from your prior response, so the path adapts to the learner."
    },
    {
      title: "Learner profile first",
      text: "Age, education, projects, preferences, and context are collected before questions and used in reports."
    }
  ]
};

const ASSESSMENTS = [
  {
    key: "early_g5",
    title: "Early Learner Snapshot",
    gradeLabel: "Grade 5",
    duration: "~30 min",
    tagline: "Early trait discovery without career labeling."
  },
  {
    key: "middle_g8",
    title: "Middle Learner Snapshot",
    gradeLabel: "Grade 8",
    duration: "~60 min",
    tagline: "Academic behavior, motivation, and stream readiness."
  },
  {
    key: "stream_g910",
    title: "Stream Suggestion",
    gradeLabel: "Grades 9–10",
    duration: "~2 hrs",
    tagline: "Diagnostic + directional support for stream choice."
  },
  {
    key: "career_g11",
    title: "Career Guidance",
    gradeLabel: "Grades 11–12 & undergrad",
    duration: "~3 hrs",
    tagline: "Full-spectrum profile mapped to career domains."
  }
] as const;

const OVERVIEW_SEARCH_ITEMS = [
  {
    id: "big-five",
    variant: "card" as const,
    title: "Big Five in 10 minutes",
    subtitle: "Personality dimensions",
    meta: "Self-paced · 10 min",
    tag: "featured" as const,
    thumb: "sunset" as const,
    href: "/overview?tab=assessments",
    categories: ["design", "marketing"] as const,
    keywords: ["personality", "big five", "psychometric", "traits"]
  },
  {
    id: "riasec",
    variant: "card" as const,
    title: "RIASEC interest map",
    subtitle: "Holland code primer",
    meta: "Guide · 8 min",
    tag: "new" as const,
    thumb: "mint" as const,
    href: "/overview?tab=assessments",
    categories: ["design", "marketing"] as const,
    keywords: ["riasec", "interests", "holland", "career"]
  },
  {
    id: "aptitude",
    variant: "card" as const,
    title: "Aptitude warm-up drills",
    subtitle: "Logic & verbal",
    meta: "Practice · 15 min",
    tag: "featured" as const,
    thumb: "ocean" as const,
    href: "/overview?tab=assessments",
    categories: ["coding", "accounting"] as const,
    keywords: ["aptitude", "logic", "verbal", "numerical", "practice"]
  },
  {
    id: "software-engineer",
    variant: "wide" as const,
    title: "Software Engineer",
    subtitle: "Vector similarity to your profile",
    meta: "88% alignment",
    tag: "featured" as const,
    thumb: "ocean" as const,
    href: "/career",
    categories: ["coding"] as const,
    keywords: ["software", "engineer", "developer", "tech"]
  },
  {
    id: "ux-designer",
    variant: "wide" as const,
    title: "UX / Product Designer",
    subtitle: "People + ideas cluster",
    meta: "81% alignment",
    tag: "new" as const,
    thumb: "lavender" as const,
    href: "/career",
    categories: ["design"] as const,
    keywords: ["ux", "design", "product", "creative"],
    tall: true
  }
] as const;

function matchesOverviewSearch(
  item: (typeof OVERVIEW_SEARCH_ITEMS)[number],
  query: string,
  category: string | null
) {
  if (category && !item.categories.includes(category as (typeof item.categories)[number])) {
    return false;
  }
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.title, item.subtitle, ...item.keywords].join(" ").toLowerCase();
  return haystack.includes(q);
}

function OverviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  useEffect(() => {
    if (tab === "life-journey") {
      router.replace("/life-journey");
    }
    if (tab === "profile" || tab === "settings") {
      router.replace("/profile");
    }
  }, [tab, router]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [gameSummary, setGameSummary] = useState<{
    totals: {
      sessions: number;
      actions: number;
      actionsSuccess: number;
      actionsFailure: number;
      actionAccuracy: number;
    };
  } | null>(null);
  const [gameSummaryLoading, setGameSummaryLoading] = useState(false);
  const profile = useCareerStore((state) => state.onboardingProfile);
  const sessions = useCareerStore((state) => state.sessions);
  const level = useCareerStore((state) => state.level);

  const filteredSearchItems = OVERVIEW_SEARCH_ITEMS.filter((item) =>
    matchesOverviewSearch(item, query, category)
  );
  const featuredCards = filteredSearchItems.filter((item) => item.variant === "card");
  const wideCards = filteredSearchItems.filter((item) => item.variant === "wide");

  useEffect(() => {
    let cancelled = false;
    async function loadGameSummary() {
      setGameSummaryLoading(true);
      try {
        const res = await api<{ totals?: { sessions?: number; actions?: number; actionsSuccess?: number; actionsFailure?: number; actionAccuracy?: number } }>(
          "/games/summary"
        );
        if (cancelled) return;
        const totals = res.data?.totals;
        if (!totals) {
          setGameSummary(null);
          return;
        }
        setGameSummary({
          totals: {
            sessions: Number(totals.sessions ?? 0),
            actions: Number(totals.actions ?? 0),
            actionsSuccess: Number(totals.actionsSuccess ?? 0),
            actionsFailure: Number(totals.actionsFailure ?? 0),
            actionAccuracy: Number(totals.actionAccuracy ?? 0)
          }
        });
      } catch {
        if (!cancelled) setGameSummary(null);
      } finally {
        if (!cancelled) setGameSummaryLoading(false);
      }
    }
    void loadGameSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const right = (
    <RightPanel
      userName="Punya Mittal"
      latestTitle={undefined}
      latestMeta="Complete an assessment to unlock your personalized report card here."
      latestHref={undefined}
      progressItems={[]}
    />
  );

  const renderTab = () => {
    if (tab === "career-dashboard") {
      return (
        <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]">
          <h2 className="font-display text-xl text-cg-text">Career Dashboard</h2>
          <p className="mt-2 text-sm text-cg-muted">
            {profile.name || "Student"} · level {level} · {sessions.length} sessions recorded.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">
            Open Full Career Dashboard
          </Link>
        </section>
      );
    }

    if (tab === "assessments") {
      return (
        <div className="space-y-6">
          <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{PROGRAMME_OVERVIEW.eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-cg-text">{PROGRAMME_OVERVIEW.title}</h2>
            <p className="mt-2 text-sm text-cg-muted">{PROGRAMME_OVERVIEW.lede}</p>
            <ul className="mt-4 space-y-3">
              {PROGRAMME_OVERVIEW.highlights.map((h) => (
                <li key={h.title} className="rounded-xl border border-[var(--cg-3d-border)] bg-white p-3">
                  <p className="text-sm font-semibold text-cg-text">{h.title}</p>
                  <p className="mt-1 text-xs text-cg-muted">{h.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <UserFlowsGrid />

          <MotivationModulesGrid />

          <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
            <h3 className="font-display text-xl font-bold text-cg-text">School track assessments</h3>
            <p className="mt-1 text-sm text-cg-muted">Grade-based full programmes with onboarding intake.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ASSESSMENTS.map((a) => (
                <article key={a.key} className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4 shadow-[2px_2px_0_0_var(--cg-3d-border)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                      {a.gradeLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-cg-muted">{a.duration}</span>
                  </div>
                  <p className="mt-2 font-display text-base font-bold text-cg-text">{a.title}</p>
                  <p className="mt-1 text-xs text-cg-muted">{a.tagline}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link href={`/assessment?track=${a.key}`} className="rounded-lg border border-[var(--cg-3d-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-cg-text">
                      Onboarding
                    </Link>
                    <Link href={`/user-flow/${resolveUserFlowFromTrack(a.key)}`} className="rounded-lg border border-[var(--cg-3d-border)] bg-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-white">
                      Start MBS journey
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (tab === "iq-games" || tab === "physiology-games") {
      const type = tab === "iq-games" ? "iq" : "physiology";
      const heading = tab === "iq-games" ? "IQ Games" : "Physiology Games";
      const games = gameCatalog.filter((game) => game.type === type);
      return (
        <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]">
          <h2 className="font-display text-xl text-cg-text">{heading}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {games.map((game) => (
              <article key={game.id} className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white p-4 shadow-[2px_2px_0_0_var(--cg-3d-border)]">
                <p className="font-semibold text-cg-text">{game.name}</p>
                <p className="mt-1 text-xs text-cg-muted">Ages {game.ageMin}-{game.ageMax} · {game.skills.join(", ")}</p>
                <Link href={`/play/${game.id}?level=${Math.max(1, Math.min(10, level))}`} className="mt-3 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-1.5 text-xs font-semibold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)]">
                  Play now
                </Link>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (tab === "career-matches") {
      return (
        <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]">
          <h2 className="font-display text-xl text-cg-text">Career Matches</h2>
          <p className="mt-2 text-sm text-cg-muted">View the career affinity explorer with match percentages.</p>
          <Link href="/career" className="mt-4 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">
            Open Career Explorer
          </Link>
        </section>
      );
    }

    if (tab === "reports") {
      const totals = gameSummary?.totals;
      return (
        <section className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]">
          <h2 className="font-display text-xl text-cg-text">Reports</h2>
          <p className="mt-2 text-sm text-cg-muted">Generate monthly and session-based reports for parents and learners.</p>
          {gameSummaryLoading ? (
            <p className="mt-3 text-xs text-cg-muted">Loading tracked data…</p>
          ) : totals ? (
            <div className="mt-3 space-y-1 text-xs text-cg-muted">
              <p>Sessions: {totals.sessions}</p>
              <p>Total actions: {totals.actions}</p>
              <p>Successful actions: {totals.actionsSuccess}</p>
              <p>Failed actions: {totals.actionsFailure}</p>
              <p>Action accuracy: {Math.round(totals.actionAccuracy)}%</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-cg-muted">No real report data available yet. Play a game session to start tracking.</p>
          )}
          <Link href="/reports" className="mt-4 inline-block rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]">
            Open Reports
          </Link>
        </section>
      );
    }

    return null;
  };

  return (
    <DashboardShell right={right}>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cg-text">Overview</h1>
        <p className="text-sm text-cg-muted">Explore matches, guided modules, and your mentor.</p>
      </div>

      {tab === "overview" ? (
        <DashboardHeader
          searchQuery={query}
          onSearchQueryChange={setQuery}
          activeCategory={category}
          onCategoryChange={setCategory}
        />
      ) : null}

      <div className={tab !== "overview" && tab !== "life-journey" ? "pt-2 md:pt-3" : ""}>
        {tab !== "overview" && tab !== "life-journey" ? renderTab() : null}
      </div>

      {tab === "overview" ? (
      <>
      <SectionBlock title={query.trim() || category ? "Search results" : "Recent search"}>
        {featuredCards.length ? (
          featuredCards.map((item) => (
            <CareerCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.meta}
              tag={item.tag}
              thumb={item.thumb}
              href={item.href}
            />
          ))
        ) : (
          <p className="text-sm text-cg-muted">No matches — try another keyword or category.</p>
        )}
      </SectionBlock>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-cg-text">Popular career fits</h2>
        </div>
        {wideCards.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {wideCards.map((item) => (
              <CareerCardWide
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                tag={item.tag}
                thumb={item.thumb}
                href={item.href}
                tall={"tall" in item ? Boolean(item.tall) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-cg-muted">No career fits match your filters.</p>
        )}
      </section>
      </>
      ) : null}
    </DashboardShell>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cg-canvas text-cg-muted">
          Loading overview...
        </div>
      }
    >
      <OverviewPageContent />
    </Suspense>
  );
}
