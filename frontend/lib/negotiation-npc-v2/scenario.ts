/** Client-side scenario mirror — keep aligned with backend constants/scenario.ts */

export const MAX_ROUNDS = 3;

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
  { label: string; scopePreserved: number; datePreserved: number }
> = {
  drop_nice_to_have: {
    label: "Drop two nice-to-have features; keep core scope on original date",
    scopePreserved: 0.85,
    datePreserved: 0.92
  },
  add_contractor_day: {
    label: "Add one contractor day to absorb extra scope on original deadline",
    scopePreserved: 1.0,
    datePreserved: 0.95
  },
  phased_launch: {
    label: "Phased launch: critical scope now, remainder in phase 2 (+1 week)",
    scopePreserved: 0.95,
    datePreserved: 0.88
  }
};

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

export const SETUP_CONTEXT =
  "Stakeholder request: +2 scope items, deadline moved 2 days earlier (3 rounds max).";
