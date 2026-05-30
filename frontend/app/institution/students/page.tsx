 "use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type InstitutionStudent = {
  userId: string;
  topSkill: string;
  topSkillScore: number;
  topCareer: string;
  updatedAt: string;
};

export default function InstitutionStudentsPage() {
  const [students, setStudents] = useState<InstitutionStudent[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await api<{ students: InstitutionStudent[] }>("/dashboard/institution/overview");
      if (!cancelled) setStudents(res.data?.students ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl text-[var(--primary)]">Institution Students</h1>
      <section className="overflow-x-auto rounded-2xl bg-white p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Top Skill</th>
              <th>Skill Score</th>
              <th>Top Career Match</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.userId} className="border-b last:border-b-0">
                <td className="py-2 font-medium">Student {student.userId.slice(0, 6)}</td>
                <td>{student.topSkill}</td>
                <td>{Math.round(student.topSkillScore)}</td>
                <td>{student.topCareer}</td>
                <td>{new Date(student.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
