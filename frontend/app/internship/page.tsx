import Link from "next/link";
import { INTERNSHIP_BY_SLUG } from "@/lib/virtual-internships";

const cardClass =
  "rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[var(--cg-3d-shadow-hover)]";

export default function InternshipIndexPage() {
  const entries = Object.values(INTERNSHIP_BY_SLUG);

  return (
    <div className="min-h-screen bg-cg-canvas px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-emerald-800 underline decoration-emerald-800/40 underline-offset-4 hover:text-emerald-950"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-cg-text">Virtual internships</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-cg-muted">
            Short, choice-based simulations aligned with the career patterns in CareerGuide. They are educational
            fiction — useful for sensing day-to-day trade-offs, not for hiring outcomes.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {entries.map((sim) => (
            <li key={sim.slug}>
              <Link href={`/internship/${encodeURIComponent(sim.slug)}`} className={`${cardClass} block`}>
                <h2 className="font-display text-lg font-bold text-cg-text">{sim.roleTitle}</h2>
                <p className="mt-2 text-sm font-medium text-cg-muted">{sim.tagline}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                  Start simulation →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
