import Link from "next/link";

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-cg-canvas p-6">
      <section className="mx-auto max-w-4xl rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Career explorer</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-cg-text">Career Matches</h1>
        <p className="mt-3 text-sm text-cg-muted">
          Browse your career fit view and return to overview when you want the full dashboard context.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/overview?tab=career-matches"
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
          >
            Open Overview Career Tab
          </Link>
          <Link
            href="/overview"
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-3 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)]"
          >
            Back to Overview
          </Link>
        </div>
      </section>
    </main>
  );
}
