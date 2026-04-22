export default function InstitutionReportsPage() {
  return (
    <main className="space-y-6 px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Reports</h1>
      <section className="rounded-2xl bg-white p-5">
        <p className="text-sm text-[var(--muted)]">Bulk report zip export and CSV export controls placeholder.</p>
        <div className="mt-4 flex gap-3">
          <button type="button" className="rounded-xl bg-[var(--btob)] px-4 py-2 text-sm font-semibold text-white">
            Download Reports ZIP
          </button>
          <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold">
            Export CSV
          </button>
        </div>
      </section>
    </main>
  );
}
