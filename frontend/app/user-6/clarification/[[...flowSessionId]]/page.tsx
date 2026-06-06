"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClarificationFlowPanel } from "@/components/clarification/ClarificationFlow";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createUserFlowSession, unwrap } from "@/lib/clarification/api";

export default function User6ClarificationPage() {
  const params = useParams<{ flowSessionId?: string }>();
  const router = useRouter();
  const param = params?.flowSessionId;
  const fromUrl = Array.isArray(param) ? param[0] : param;
  const [flowSessionId, setFlowSessionId] = useState(fromUrl ?? "");
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (fromUrl) {
      setFlowSessionId(fromUrl);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await createUserFlowSession({ region: "IN" });
        const data = unwrap(res);
        if (!cancelled) {
          setFlowSessionId(data.flowSessionId);
          router.replace(`/user-6/clarification/${data.flowSessionId}`);
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "Could not start User Flow 6 session");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromUrl, router]);

  return (
    <DashboardShell right={null}>
      <div className="p-4 sm:p-6">
        <h1 className="font-display text-2xl font-extrabold text-cg-text">
          User Flow 6 — Clarification
        </h1>
        <p className="mt-1 text-sm text-cg-muted">Phase 7.5 ambiguity resolution (Supabase-backed)</p>

        {bootError ? (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {bootError}
          </p>
        ) : null}

        {flowSessionId ? <ClarificationFlowPanel flowSessionId={flowSessionId} /> : null}
      </div>
    </DashboardShell>
  );
}
