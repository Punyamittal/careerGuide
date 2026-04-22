export default async function ParentChildPage({
  params
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  return (
    <main className="space-y-6 px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Child Profile: {childId}</h1>
      <section className="rounded-2xl bg-white p-5">
        <p className="text-sm text-[var(--muted)]">
          Parent insight: Your child is showing strong spatial reasoning and steady processing speed gains this month.
        </p>
        <button type="button" className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Download Report
        </button>
      </section>
    </main>
  );
}
