import type { DashboardCategory } from "@/lib/dashboard-filters";

/** Curated “EdTech-style” rows for horizontal sections (dummy + mixed with live data in page). */
export const EXPLORE_RECENT = [
  {
    title: "Personality snapshot",
    subtitle: "Core traits in minutes",
    meta: "Self-paced · 10 min",
    tag: "featured" as const,
    thumb: "lavender" as const,
    filterTags: ["marketing", "design"] as const satisfies readonly DashboardCategory[]
  },
  {
    title: "Interest map",
    subtitle: "Career theme primer",
    meta: "Guide · 8 min",
    tag: "new" as const,
    thumb: "ocean" as const,
    filterTags: ["marketing"] as const satisfies readonly DashboardCategory[]
  },
  {
    title: "Aptitude warm-up drills",
    subtitle: "Logic & verbal",
    meta: "Practice · 15 min",
    tag: undefined,
    thumb: "mint" as const,
    filterTags: ["coding"] as const satisfies readonly DashboardCategory[]
  }
];

export const EXPLORE_NEW = [
  {
    title: "Motivation mapping",
    subtitle: "People, data, ideas, things",
    meta: "Worksheet · 6 min",
    tag: "new" as const,
    thumb: "coral" as const,
    filterTags: ["marketing", "coding"] as const satisfies readonly DashboardCategory[]
  },
  {
    title: "Writing your story",
    subtitle: "Reflect for reports",
    meta: "Prompt · 12 min",
    tag: "new" as const,
    thumb: "slate" as const,
    filterTags: ["design", "marketing"] as const satisfies readonly DashboardCategory[]
  },
  {
    title: "Interview alignment",
    subtitle: "Match scores to roles",
    meta: "Checklist · 9 min",
    tag: undefined,
    thumb: "sunset" as const,
    filterTags: ["coding", "marketing"] as const satisfies readonly DashboardCategory[]
  }
];
