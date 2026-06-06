"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NegotiationNpcV2Simulation } from "@/components/negotiation-npc-v2/NegotiationNpcV2Simulation";

export default function NegotiationV2Page() {
  return (
    <DashboardShell right={null}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <NegotiationNpcV2Simulation autoStart />
      </div>
    </DashboardShell>
  );
}
