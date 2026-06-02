"use client";

import dynamic from "next/dynamic";

const CoachChatLazy = dynamic(
  () => import("./coach-chat").then((mod) => mod.CoachChat),
  { ssr: false }
);

/** Client-only coach FAB + chat (portal, drag). Use this from the root layout. */
export function CoachChat() {
  return <CoachChatLazy />;
}

/** @deprecated Use `CoachChat` */
export const CoachChatRoot = CoachChat;
