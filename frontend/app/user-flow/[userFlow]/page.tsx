"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserFlowShell } from "@/components/assessment-engine/UserFlowShell";
import { normalizeUserFlowParam } from "@/lib/assessment-engine/user-flow-client";

export default function UserFlowPage() {
  const params = useParams<{ userFlow: string }>();
  const userFlow = normalizeUserFlowParam(params?.userFlow ?? "user-1");

  return (
    <DashboardShell right={null}>
      <UserFlowShell userFlow={userFlow} />
    </DashboardShell>
  );
}
