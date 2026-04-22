import { KPICard } from "@/components/cireern/ui";

export default function InstitutionDashboardPage() {
  return (
    <main className="space-y-6 px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Dashboard</h1>
      <section className="grid gap-3 md:grid-cols-4">
        <KPICard title="Total Students" value="1,284" />
        <KPICard title="Avg Score This Month" value="78.4" />
        <KPICard title="Top Career Domain" value="STEM" />
        <KPICard title="Sessions This Week" value="4,932" />
      </section>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="font-display text-xl text-[var(--primary)]">Cohort Overview</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Toggle controls and cohort radar table scaffold are ready for Supabase-backed aggregation.
        </p>
      </section>
    </main>
  );
}
