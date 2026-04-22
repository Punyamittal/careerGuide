import Link from "next/link";

const children = [
  { id: "maya", name: "Maya", age: 11, level: 4, lastPlayed: "Today", topCareer: "Architect" },
  { id: "arav", name: "Arav", age: 9, level: 3, lastPlayed: "Yesterday", topCareer: "Doctor" }
];

export default function ParentDashboardPage() {
  return (
    <main className="space-y-6 px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Parent Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-2">
        {children.map((child) => (
          <article key={child.id} className="rounded-2xl bg-white p-5">
            <p className="font-display text-xl text-[var(--primary)]">{child.name}</p>
            <p className="text-sm text-[var(--muted)]">Age {child.age} • Level {child.level}</p>
            <p className="mt-2 text-sm">Top career match: {child.topCareer}</p>
            <p className="text-sm">Last played: {child.lastPlayed}</p>
            <Link href={`/parent/child/${child.id}`} className="mt-4 inline-block rounded-xl bg-[var(--btoc)] px-4 py-2 text-sm font-semibold text-white">
              View Child Profile
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
