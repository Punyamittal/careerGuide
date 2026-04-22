"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cg-canvas text-cg-muted">
      Opening profile settings…
    </div>
  );
}
