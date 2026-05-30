"use client";

import { useParams } from "next/navigation";
import { AssessmentShell } from "@/components/assessment-engine/AssessmentShell";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AssessmentModulePage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "M01";

  return (
    <DashboardShell right={null}>
      <AssessmentShell moduleId={moduleId} />
    </DashboardShell>
  );
}
