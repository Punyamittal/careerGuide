"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Client hash for /dashboard#section links (Schedule / Wishlist active states). */
export function useHash() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  return hash;
}
