/** SIM-NEGOTIATION-NPC-V2 — scenario constants (MBS Clarification Simulation Library V2). */

export const SIM_ID = "SIM-NEGOTIATION-NPC-V2";

export const MAX_ROUNDS = 3;
export const DURATION_MAX_SEC = 480;

export const INITIAL_TRUST = 0.5;

/** NPC asks for +2 scope items and deadline moved 2 days earlier. */
export const SCOPE_ITEMS_ADDED = 2;
export const DEADLINE_DAYS_DELTA = -2;

export const NEGOTIATION_BRANCHES = [
  "probe_interests",
  "trade_scope_date",
  "concede_unilateral",
  "hardball",
  "walkaway",
  "facilitate_options_meeting"
] as const;

export type NegotiationBranch = (typeof NEGOTIATION_BRANCHES)[number];

export type TradePackage = "drop_nice_to_have" | "add_contractor_day" | "phased_launch";

export const TRADE_PACKAGES: Record<
  TradePackage,
  { label: string; scopePreserved: number; datePreserved: number; creative: boolean }
> = {
  drop_nice_to_have: {
    label: "Drop two nice-to-have features; keep core scope on original date",
    scopePreserved: 0.85,
    datePreserved: 0.92,
    creative: true
  },
  add_contractor_day: {
    label: "Add one contractor day to absorb extra scope on original deadline",
    scopePreserved: 1.0,
    datePreserved: 0.95,
    creative: true
  },
  phased_launch: {
    label: "Phased launch: critical scope now, remainder in phase 2 (+1 week)",
    scopePreserved: 0.95,
    datePreserved: 0.88,
    creative: true
  }
};

export const NPC_LINES = {
  setup:
    "We need two additional deliverables in this release, and the launch date moves up by two days. Here's our updated ask — what can you commit to?",
  round1_hardline:
    "That won't work for us as-is. If you want movement, you'll need to show you understand our constraints — not just push back.",
  round2_interest:
    "Between us: quality on the must-haves matters more than the nice-to-haves, but the exec sponsor is fixated on the earlier date. There's room if we trade scope for timeline.",
  round2_no_probe:
    "You're still leading with positions. We need to understand priorities before we talk packages.",
  round3_final:
    "Last round — if you can propose a concrete package (drop scope, add resource, or phase), we can close this today.",
  probe_ack:
    "Good — help me understand what you see as non-negotiable vs flexible on scope and timing.",
  trade_ack: "Walk me through how that package protects both sides.",
  facilitate_ack: "A short working session to map options could work — what's your opening proposal?",
  concede_ack: "So you're accepting everything we asked for? That's noted.",
  hardball_ack: "That's a hard line. We're not aligned yet.",
  walkaway_ack: "Understood — we're pausing here.",
  deal_accept: "Agreed. We'll document this package and confirm with the team.",
  deal_reject: "That package still leaves us exposed. One more concrete adjustment or we escalate."
} as const;

export const PLAYER_ACTION_LABELS: Record<
  NegotiationBranch,
  { label: string; description: string }
> = {
  probe_interests: {
    label: "Probe interests",
    description: "Ask about priorities, constraints, and what success looks like for them"
  },
  trade_scope_date: {
    label: "Propose scope–date trade",
    description: "Offer a structured trade between scope and timeline"
  },
  facilitate_options_meeting: {
    label: "Facilitate options meeting",
    description: "Suggest a brief joint session to map creative options"
  },
  concede_unilateral: {
    label: "Accept all terms",
    description: "Agree to full scope and earlier date without counter"
  },
  hardball: {
    label: "Hard line refuse",
    description: "Reject the ask outright without exploring interests"
  },
  walkaway: {
    label: "Pause / walk away",
    description: "End the negotiation for now"
  }
};

export const COMPOSITE_WEIGHTS = {
  "NEG-INT": 0.25,
  "NEG-TRADE": 0.25,
  "NEG-REL": 0.2,
  "NEG-ASSERT": 0.15,
  "NEG-JV": 0.15
} as const;
