"use client";

import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel } from "@/components/dashboard/right-panel";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";
import { useAuth } from "@/contexts/auth-context";

function ProfileRight() {
  const { user } = useAuth();
  return (
    <RightPanel
      userName={user?.name || "Learner"}
      latestTitle={undefined}
      latestMeta="Update your details and preferences in the main panel."
      progressItems={[]}
    />
  );
}

export default function ProfilePage() {
  return (
    <DashboardShell
      right={
        <Suspense fallback={null}>
          <ProfileRight />
        </Suspense>
      }
    >
      <ProfileSettingsPanel />
    </DashboardShell>
  );
}
