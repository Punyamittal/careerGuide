export default function InstitutionStudentsPage() {
  return (
    <main className="space-y-6 px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Students</h1>
      <section className="overflow-x-auto rounded-2xl bg-white p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Age</th>
              <th>Level</th>
              <th>Top Skill</th>
              <th>Top Career Match</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">Maya Sharma</td>
              <td>11</td>
              <td>4</td>
              <td>Logic</td>
              <td>Architect</td>
              <td>1 hour ago</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
