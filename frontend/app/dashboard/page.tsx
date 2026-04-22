"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/overview?tab=overview");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cg-canvas text-cg-muted">
      Opening dashboard in Overview format...
    </div>
  );
}
