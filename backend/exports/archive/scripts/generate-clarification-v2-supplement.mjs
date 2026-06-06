/**
 * Generates V2 supplemental clarification banks (QA fixes only).
 * Run: node backend/exports/archive/scripts/generate-clarification-v2-supplement.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..");

function item(base) {
  return {
    item_id: base.item_id,
    journey: base.journey,
    construct: base.construct,
    question_type: base.question_type,
    difficulty: base.difficulty,
    stem: base.stem,
    options: base.options,
    correct_answer: String(base.correct_answer),
    scoring_logic: base.scoring_logic,
    scoring_rubric: base.scoring_rubric ?? null,
    anti_bias_rationale: base.anti_bias_rationale,
    follow_up_trigger: base.follow_up_trigger ?? "",
    routing_rules: base.routing_rules ?? {},
    exposure_pool: base.exposure_pool ?? base.journey,
    version: 2
  };
}

// ─── J2 V2: 28 unique collaboration/conflict/ownership scenarios ─────────────
// Keys distributed 0-3; construct-specific rubrics; plausible distractors only.

const J2_V2 = [
  {
    id: "01",
    cat: "collaboration",
    construct: "TEAM-INC|TEAM-DA|EQ-OA",
    difficulty: "standard",
    stem: "Sprint planning: two seniors dominate story-point estimates. A quieter teammate has not spoken. You:",
    options: [
      "Ask them directly: \"What complexity do you see that we might be missing?\"",
      "Let the seniors decide — they have more experience",
      "Post your own estimate louder so the meeting moves on",
      "DM the quiet teammate after the meeting instead of in the room"
    ],
    key: 0,
    rubric: "inclusive_facilitation",
    scoring_logic: "TEAM-INC +1.0 if key; TEAM-DA +0.5 partial for post-meeting DM (key 3 → 0.4); silent deferral (1) → 0.2"
  },
  {
    id: "02",
    cat: "collaboration",
    construct: "TEAM-GT|TEAM-CON|COMM-ASRT",
    difficulty: "stretch",
    stem: "Release review: everyone nods to ship Friday though QA flagged a edge-case bug. You are the newest member. You:",
    options: [
      "Name the specific risk and ask what rollback plan exists before agreeing",
      "Nod along — challenging seniors this early looks difficult",
      "Agree verbally but document your concern in the ticket after the meeting",
      "Ask to delay without explaining the bug to avoid conflict"
    ],
    key: 0,
    rubric: "groupthink_resistance",
    scoring_logic: "TEAM-GT +1.0 if key; key 2 → 0.5 (private concern); key 1/3 → 0.15"
  },
  {
    id: "03",
    cat: "ownership",
    construct: "SS-SELF|WST-INIT|BIG5-C",
    difficulty: "standard",
    stem: "Your feature flag triggers a production alert at 9 PM. You are not on-call but you shipped the change. You:",
    options: [
      "Acknowledge in the incident channel, share what you know, offer to pair with on-call",
      "Wait for on-call to figure it out — it is their rotation",
      "Roll back immediately without posting context",
      "Message your manager privately only and disconnect"
    ],
    key: 0,
    rubric: "ownership_initiative",
    scoring_logic: "SS-SELF/WST-INIT keyed; TK not used. Partial credit key 2 if rollback justified with no comms → 0.35"
  },
  {
    id: "04",
    cat: "credit",
    construct: "TEAM-SL|WST-COOP|EQ-EM",
    difficulty: "beginner",
    stem: "In standup your manager praises you for a fix your pair partner did most of. They are on leave. You:",
    options: [
      "Thank them and clarify your partner's contribution and what you will finish when they return",
      "Accept praise briefly — correcting might embarrass your manager",
      "Deflect entirely: \"It was nothing\"",
      "Explain in detail only your own commits to sound competent"
    ],
    key: 0,
    rubric: "prosocial_credit",
    scoring_logic: "WST-COOP +1.0; key 1 → 0.45 (avoidance); key 3 → 0.25 (self-focus)"
  },
  {
    id: "05",
    cat: "conflict",
    construct: "CONF-COLL|CONF-COMP|COMM-WR",
    difficulty: "standard",
    stem: "A vendor missed an SLA. Your manager asks you to draft the email. You:",
    options: [
      "Facts, business impact, requested recovery plan with dates — firm but professional",
      "Threaten contract termination in the first paragraph",
      "Soften language so much the vendor ignores urgency",
      "CC the vendor's CEO before giving them a chance to respond"
    ],
    key: 0,
    rubric: "constructive_assertion",
    scoring_logic: "CONF-COLL/COMP keyed; not TK compete/avoid mapping"
  },
  {
    id: "06",
    cat: "conflict",
    construct: "CONF-COLL|COMM-DIF|EQ-SR",
    difficulty: "stretch",
    stem: "A peer says your handoff doc caused their rework. You believe the requirements changed after handoff. You:",
    options: [
      "Ask to walk through the timeline together and agree on a shared handoff template",
      "Reply-all defending your document line by line",
      "Apologize for everything to end the thread quickly",
      "Ask your manager to decide who is at fault"
    ],
    key: 0,
    rubric: "collaborative_problem_solve",
    scoring_logic: "CONF-COLL +1.0; key 2 → 0.4 (accommodate without root cause); key 1 → 0.2"
  },
  {
    id: "07",
    cat: "collaboration",
    construct: "TEAM-SL|SS-COLLAB|COMM-DIF",
    difficulty: "standard",
    stem: "Teammate asks you to finish their slides tonight; you have your own deadline tomorrow. You:",
    options: [
      "Share your constraint, offer 20 minutes to review structure or pair on one slide",
      "Take over all slides to preserve the relationship",
      "Decline bluntly with no alternative",
      "Do the work but complain in the team channel about unfairness"
    ],
    key: 0,
    rubric: "bounded_cooperation",
    scoring_logic: "SS-COLLAB +1.0; key 1 → 0.35 (social loafing enable); key 2 → 0.5"
  },
  {
    id: "08",
    cat: "conflict",
    construct: "CONF-AV|CONF-COMP|EQ-OA",
    difficulty: "standard",
    stem: "Cross-team partner keeps missing sync meetings. Your project slips one week. You:",
    options: [
      "Propose async update format + one shared 15-min slot with clear agenda",
      "Escalate to their director immediately",
      "Stop inviting them and work around them silently",
      "Send a passive-aggressive reminder about professionalism"
    ],
    key: 0,
    rubric: "structured_deescalation",
    scoring_logic: "CONF-COMP +0.9; key 1 → 0.55 if repeated misses documented; key 3 → 0.15"
  },
  {
    id: "09",
    cat: "ownership",
    construct: "SS-SELF|WST-INIT|DEC-RAT",
    difficulty: "stretch",
    stem: "You discover a minor data error in a report leadership already shared externally. Fixing it is embarrassing but not catastrophic. You:",
    options: [
      "Notify your manager promptly with corrected figures and suggested correction note",
      "Fix quietly in the next cycle — it is small",
      "Blame the extraction script without checking your own validation step",
      "Wait to see if anyone notices"
    ],
    key: 0,
    rubric: "accountability",
    scoring_logic: "SS-SELF + Integrity overlap 0.3 weight in fusion only"
  },
  {
    id: "10",
    cat: "collaboration",
    construct: "TEAM-AB|TEAM-CON|COMM-ASRT",
    difficulty: "stretch",
    stem: "Retro: everyone agrees the process is fine but privately people DM you complaints. You:",
    options: [
      "Raise one anonymized theme as a question: \"What would make handoffs safer?\"",
      "Stay silent — not your role as intern",
      "Name individuals who complained",
      "Suggest cancelling retros as a waste of time"
    ],
    key: 0,
    rubric: "abilene_paradox",
    scoring_logic: "TEAM-AB +1.0; psychological safety preserving option"
  },
  {
    id: "11",
    cat: "conflict",
    construct: "CONF-CMP|CONF-COLL|EQ-SR",
    difficulty: "standard",
    stem: "Design deadlock: your approach vs a senior's. Deadline is tomorrow. You:",
    options: [
      "Propose a time-boxed spike on both approaches with agreed decision criteria",
      "Insist your approach is better in the meeting",
      "Implement theirs without understanding to save time",
      "Work overnight on your version without telling anyone"
    ],
    key: 0,
    rubric: "task_conflict_not_personal",
    scoring_logic: "CONF-COLL +1.0; key 1 → 0.25 compete; key 2 → 0.4 accommodate"
  },
  {
    id: "12",
    cat: "collaboration",
    construct: "TEAM-VOT|TEAM-CON|DEC-RAT",
    difficulty: "beginner",
    stem: "Team votes 4-1 for a shortcut you think is risky. You were the one dissenting vote. Next step:",
    options: [
      "Ask to document the dissent and the monitoring plan if the shortcut is taken",
      "Re-open the vote until they agree with you",
      "Withdraw your concern publicly to fit in",
      "Slow-walk your tasks as protest"
    ],
    key: 0,
    rubric: "constructive_dissent",
    scoring_logic: "TEAM-DA +0.8; TEAM-CON +0.5 partial on key 1 if constructive"
  },
  {
    id: "13",
    cat: "ownership",
    construct: "SS-SELF|WST-INIT|COMM-AL",
    difficulty: "standard",
    stem: "Onboarding: unclear who owns client updates. Updates are inconsistent. You:",
    options: [
      "Draft a simple RACI proposal and share in channel for feedback",
      "Start sending updates without aligning anyone",
      "Wait until someone senior notices",
      "Only update your own tasks and ignore client comms"
    ],
    key: 0,
    rubric: "initiative_without_overreach",
    scoring_logic: "WST-INIT +1.0"
  },
  {
    id: "14",
    cat: "conflict",
    construct: "CONF-ACC|CONF-COLL|EQ-EM",
    difficulty: "standard",
    stem: "Client calls your demo \"disappointing.\" Your teammate built most of the demo. On the call you:",
    options: [
      "Acknowledge gap, ask one clarifying question, commit to written follow-up with owners",
      "Over-apologize and promise features not in scope",
      "Explain technical constraints at length without listening",
      "Let teammate take all blame since they built it"
    ],
    key: 0,
    rubric: "client_deescalation",
    scoring_logic: "EQ-EM + COMM-AL; key 1 → 0.35 over-accommodate"
  },
  {
    id: "15",
    cat: "collaboration",
    construct: "TEAM-INC|EQ-OA|COMM-NV",
    difficulty: "stretch",
    stem: "Hybrid meeting: remote teammates' chat is silent while in-room side conversations decide the plan. You:",
    options: [
      "Pause and ask remote colleagues explicitly for input before deciding",
      "Repeat in-room decision in chat after the meeting",
      "Assume silence means agreement",
      "Suggest remote people watch the recording later"
    ],
    key: 0,
    rubric: "inclusive_hybrid",
    scoring_logic: "TEAM-INC +1.0; fairness/accessibility aligned"
  },
  {
    id: "16",
    cat: "conflict",
    construct: "CONF-COMP|COMM-DIF|EQ-SR",
    difficulty: "standard",
    stem: "Manager assigns you overtime work with 2 hours notice. You have a non-work commitment you disclosed earlier. You:",
    options: [
      "Restate constraint, offer what you can finish before leaving plus morning completion plan",
      "Agree on call then miss the commitment without follow-up",
      "Refuse sharply: \"That is not my job\"",
      "Accept and cancel your commitment without telling work"
    ],
    key: 0,
    rubric: "boundary_with_alternative",
    scoring_logic: "CONF-COMP + COMM-DIF; socioeconomic fairness — valid boundary path"
  },
  {
    id: "17",
    cat: "ownership",
    construct: "SS-SELF|BIG5-C|DEC-RAT",
    difficulty: "beginner",
    stem: "You merged code that broke staging. CI is red. Team chat is active. You:",
    options: [
      "Post: \"I see the failure from my merge — investigating now, ETA 20 min\"",
      "Revert silently hoping nobody connects it to you",
      "Ask senior to fix without context",
      "Explain it is probably someone else's flaky test"
    ],
    key: 0,
    rubric: "transparent_ownership",
    scoring_logic: "SS-SELF +1.0"
  },
  {
    id: "18",
    cat: "collaboration",
    construct: "TEAM-SL|WST-COOP|SS-COLLAB",
    difficulty: "standard",
    stem: "Group project grade depends on shared doc. One member has not contributed in 5 days. You:",
    options: [
      "Direct message: check in, offer help, clarify deadline and split remaining work",
      "Rewrite their section without telling them",
      "Report to professor/ manager immediately without contact",
      "Do entire remainder alone and resent it in the group chat"
    ],
    key: 0,
    rubric: "accountability_with_support",
    scoring_logic: "TEAM-SL inverse; WST-COOP +1.0"
  },
  {
    id: "19",
    cat: "conflict",
    construct: "CONF-COLL|CONF-AV|EQ-OA",
    difficulty: "stretch",
    stem: "Senior stakeholder rejects your analysis in a public channel. You spent a week on it. You:",
    options: [
      "Ask which assumptions they disagree with and offer a 15-min walkthrough",
      "Delete your work and repost a version that matches their view without analysis",
      "Debate them point-by-point in the thread",
      "Escalate to your skip-level manager in the same channel"
    ],
    key: 0,
    rubric: "status_respect_with_evidence",
    scoring_logic: "CONF-COLL + COMM-ASRT; high-context valid path in key 0"
  },
  {
    id: "20",
    cat: "collaboration",
    construct: "TEAM-DA|TEAM-GT|DEC-UNC",
    difficulty: "standard",
    stem: "Architecture choice: build vs buy. Team prefers familiar build. You found a cheaper SaaS option with trade-offs. You:",
    options: [
      "Share one-page comparison with costs, risks, and recommendation — invite challenge",
      "Stay quiet — you are too new to influence architecture",
      "Push SaaS repeatedly without listening to integration concerns",
      "Share comparison only with your manager privately"
    ],
    key: 0,
    rubric: "devils_advocate_constructive",
    scoring_logic: "TEAM-DA +1.0"
  },
  {
    id: "21",
    cat: "conflict",
    construct: "CONF-ACC|CONF-COLL|EQ-EM",
    difficulty: "beginner",
    stem: "Teammate takes credit in a client email for your analysis. You:",
    options: [
      "Reply adding specific metrics you validated and tag them collaboratively",
      "Reply-all correcting them sharply",
      "Say nothing to keep peace",
      "Forward to HR"
    ],
    key: 0,
    rubric: "credit_restoration_diplomatic",
    scoring_logic: "WST-COOP + CONF-COLL"
  },
  {
    id: "22",
    cat: "ownership",
    construct: "SS-SELF|WST-INIT|LRN-META",
    difficulty: "stretch",
    stem: "You were asked to use a tool you never used. Deadline is 48 hours. You:",
    options: [
      "Block 2 hours for tutorial, list blockers early, deliver minimal viable output with caveats",
      "Pretend proficiency and deliver late",
      "Ask for full deadline extension without attempting learning",
      "Delegate entirely to a friend outside the company"
    ],
    key: 0,
    rubric: "learning_under_ownership",
    scoring_logic: "SS-SELF + LRN-META partial 0.4"
  },
  {
    id: "23",
    cat: "collaboration",
    construct: "TEAM-INC|EQ-OA|COMM-AL",
    difficulty: "standard",
    stem: "Brainstorm: two voices repeat ideas; a junior's idea was ignored 10 minutes ago. You:",
    options: [
      "\"Building on [name]'s idea earlier — what if we combined it with…\"",
      "Repeat the idea as your own",
      "Stop the meeting to lecture about inclusion",
      "Continue with dominant voices to finish on time"
    ],
    key: 0,
    rubric: " allyship_in_meeting",
    scoring_logic: "TEAM-INC + EQ-OA; gender fairness intervention pattern"
  },
  {
    id: "24",
    cat: "conflict",
    construct: "CONF-COMP|COMM-DIF|EQ-SR",
    difficulty: "standard",
    stem: "Timezone clash: Mumbai team needs your sign-off at 11 PM your time — recurring. You:",
    options: [
      "Propose rotating async approval doc + one weekly overlap window",
      "Always stay up without discussing pattern",
      "Refuse all late requests with no alternative",
      "Approve without reading to end messages quickly"
    ],
    key: 0,
    rubric: "global_team_norm",
    scoring_logic: "CONF-COMP + cultural/timezone fairness"
  },
  {
    id: "25",
    cat: "collaboration",
    construct: "TEAM-CON|TEAM-INC|DEC-RAT",
    difficulty: "stretch",
    stem: "Post-incident review: blame language appears in the doc draft. You:",
    options: [
      "Suggest replacing blame with timeline + system fixes + action owners",
      "Add more blame detail so lessons are \"clear\"",
      "Remove your sections to avoid association",
      "Skip the review meeting"
    ],
    key: 0,
    rubric: "blameless_postmortem",
    scoring_logic: "TEAM-CON + SS-SELF safety culture"
  },
  {
    id: "26",
    cat: "conflict",
    construct: "CONF-COLL|EQ-EM|COMM-DIF",
    difficulty: "standard",
    stem: "Manager gives vague feedback: \"Be more proactive.\" You are unsure what changed. You:",
    options: [
      "Ask for one concrete example and one expected behavior for next week",
      "Work longer hours generally to look proactive",
      "Interpret as criticism of your personality and withdraw",
      "Ask peers what they think you did wrong without manager context"
    ],
    key: 0,
    rubric: "feedback_clarification",
    scoring_logic: "COMM-FB + EQ-SA; neurodiversity-friendly explicit ask"
  },
  {
    id: "27",
    cat: "ownership",
    construct: "SS-SELF|WST-INIT|DEC-SPD",
    difficulty: "standard",
    stem: "Critical customer ticket unassigned in queue; everyone in standup said they are busy. You:",
    options: [
      "Take first triage step, post status update, ask who owns customer relationship",
      "Wait for manager assignment",
      "Close ticket as duplicate without verification",
      "Message customer promising resolution time you cannot confirm"
    ],
    key: 0,
    rubric: "initiative_with_escalation",
    scoring_logic: "WST-INIT +1.0; key 3 → integrity flag cross-check J4"
  },
  {
    id: "28",
    cat: "collaboration",
    construct: "TEAM-GT|TEAM-DA|CONF-COLL",
    difficulty: "beginner",
    stem: "Demo in 3 hours; team wants to skip final checklist. You see one unchecked security item. You:",
    options: [
      "Name the item, time to verify, offer to pair on 15-min check",
      "Skip check — group wants to ship",
      "Raise alarm without suggesting verification path",
      "Verify alone after demo without telling anyone"
    ],
    key: 0,
    rubric: "risk_voice_under_time",
    scoring_logic: "TEAM-DA + TEAM-GT"
  }
];

// ─── Negotiation construct (NEG-SKILL) — 10 SJT + routing to sim ─────────────

const NEG_V2 = [
  {
    id: "01",
    stem: "Stakeholder asks for two extra features in the same sprint without removing scope. First move:",
    options: [
      "Ask which outcome matters most and what can move to next sprint",
      "Say yes to everything to protect relationship",
      "Flat no without discussion",
      "Agree then miss deadline quietly"
    ],
    key: 0,
    construct: "NEG-INT|NEG-JV|COMM-ASRT",
    rubric: "interest_probing"
  },
  {
    id: "02",
    stem: "Client wants 30% discount; your manager set a 10% floor. You:",
    options: [
      "Explore volume term length trade-offs before discussing price",
      "Offer 30% immediately",
      "End meeting",
      "Quote 10% without understanding their constraints"
    ],
    key: 0,
    construct: "NEG-TRADE|NEG-INT|NEG-REL",
    rubric: "creative_trade"
  },
  {
    id: "03",
    stem: "Cross-team dependency will slip 3 days. Your commit is at risk. You:",
    options: [
      "Share impact, propose phased delivery or resource swap options",
      "Blame other team publicly in status report",
      "Hide slip until deadline day",
      "Accept slip without informing stakeholders"
    ],
    key: 0,
    construct: "NEG-JV|SS-SELF|COMM-WR",
    rubric: "joint_value"
  },
  {
    id: "04",
    stem: "Vendor offers rush fee for faster delivery. Budget is fixed. You:",
    options: [
      "Ask what scope reduction achieves same date within budget",
      "Pay rush fee without approval",
      "Cancel vendor",
      "Accept delay without telling internal stakeholders"
    ],
    key: 0,
    construct: "NEG-TRADE|NEG-BAT|DEC-RAT",
    rubric: "batna_exploration"
  },
  {
    id: "05",
    stem: "Manager assigns you to negotiate intern stipend with HR; range is undisclosed. You:",
    options: [
      "Ask HR for band and criteria; prepare rationale from role scope and market data",
      "Demand highest number with no data",
      "Accept first offer to avoid awkwardness",
      "Refuse to negotiate — say it feels uncomfortable"
    ],
    key: 0,
    construct: "NEG-INT|NEG-ASSERT|EQ-SR",
    rubric: "preparation_assertiveness"
  },
  {
    id: "06",
    stem: "Product wants launch date; engineering needs 1 week. Both escalate to you to facilitate. You:",
    options: [
      "Facilitate 30-min options meeting: MVP scope vs date with written decision",
      "Side with product — dates drive business",
      "Side with engineering — quality non-negotiable",
      "Pick a date in the middle without scope discussion"
    ],
    key: 0,
    construct: "NEG-FAC|NEG-JV|TEAM-INC",
    rubric: "facilitation"
  },
  {
    id: "07",
    stem: "Peer asks you to negotiate their workload with PM on their behalf. You:",
    options: [
      "Coach them to raise it with PM; offer to join as support if needed",
      "Negotiate secretly without PM knowing peer asked",
      "Tell PM peer is struggling without peer consent",
      "Ignore request"
    ],
    key: 0,
    construct: "NEG-REL|COMM-DIF|TEAM-INC",
    rubric: "relationship_boundary"
  },
  {
    id: "08",
    stem: "Client threatens churn unless feature added free. Feature costs 2 weeks. You:",
    options: [
      "Clarify churn driver; explore paid phase-2, success metrics, or pilot",
      "Add feature free with no scoping",
      "Match threat with legal language immediately",
      "Ghost until contract renewal"
    ],
    key: 0,
    construct: "NEG-INT|NEG-TRADE|NEG-REL",
    rubric: "interest_under_threat"
  },
  {
    id: "09",
    stem: "You need design review sign-off; designer is booked 2 days. Your demo is tomorrow. You:",
    options: [
      "Negotiate async review on critical screens + time-boxed sync for blockers",
      "Ship without review",
      "Escalate to designer's manager first",
      "Delay demo without telling sales"
    ],
    key: 0,
    construct: "NEG-TRADE|COMM-ASRT|DEC-SPD",
    rubric: "resource_negotiation"
  },
  {
    id: "10",
    stem: "After round 1, NPC stakeholder says \"That is my final offer.\" Best response:",
    options: [
      "Summarize shared interests, test if final on all terms or one dimension",
      "Accept immediately",
      "Walk away",
      "Repeat your first offer louder"
    ],
    key: 0,
    construct: "NEG-INT|NEG-BAT|EQ-OA",
    rubric: "final_offer_probe"
  }
];

// ─── Learning Agility J7 — Format Lab clar items ─────────────────────────────

const LRN_V2 = [
  {
    id: "01",
    stem: "Format Lab clarifier: After video tutorial, quiz score 40%; after diagram, 85%. Next task assigned in text-only format. You:",
    options: [
      "Request diagram supplement or sketch your own before starting",
      "Proceed text-only without adjustment",
      "Ask someone else to do it",
      "Complain format is unfair"
    ],
    key: 0,
    construct: "LRN-ADAPT|LRN-META|LRN-DEL",
    rubric: "format_self_advocacy"
  },
  {
    id: "02",
    stem: "Mid-project the team switches from Jira to Linear with new workflow labels. You:",
    options: [
      "Map old labels to new in a personal cheat sheet; ask one clarifying question in channel",
      "Wait weeks until comfortable",
      "Ignore new workflow",
      "Revert tickets to old format"
    ],
    key: 0,
    construct: "LRN-ADAPT|LRN-META",
    rubric: "tool_switch_adaptation"
  },
  {
    id: "03",
    stem: "Rule-change round in Format Lab: scoring now penalizes speed over accuracy. Your strategy:",
    options: [
      "Re-read instructions, slow first item, verify pattern on practice item",
      "Keep same speed strategy",
      "Skip instructions — rules are obvious",
      "Stop attempting"
    ],
    key: 0,
    construct: "LRN-META|LRN-DEL|DEC-MAX",
    rubric: "rule_change_metacognition"
  },
  {
    id: "04",
    stem: "You failed first attempt at spreadsheet task. Second attempt available. You:",
    options: [
      "Review error feedback, isolate one formula mistake, retry focused drill",
      "Retry immediately with same approach",
      "Ask for answer key without retry",
      "Skip task"
    ],
    key: 0,
    construct: "LRN-DEL|LRN-META",
    rubric: "deliberate_practice"
  },
  {
    id: "05",
    stem: "Manager changes success criteria after you delivered. You:",
    options: [
      "Confirm new criteria in writing, map gap, propose minimal delta plan",
      "Rebuild everything from scratch without scoping",
      "Push back emotionally",
      "Ignore new criteria"
    ],
    key: 0,
    construct: "LRN-ADAPT|SS-SELF|COMM-DIF",
    rubric: "criteria_shift_adaptation"
  },
  {
    id: "06",
    stem: "Pick more like you when learning a new API (both sound professional):",
    options: [
      "Build smallest working example before reading full docs",
      "Read full docs end-to-end before writing any code"
    ],
    key: "ipsative",
    construct: "LRN-STYLE|LRN-META",
    rubric: "thurstonian_ipsative",
    question_type: "forced-choice"
  }
];

// ─── Aptitude U13 micro-CAT items (8 anchors + 4 operational) ────────────────

const APT_V2 = [
  {
    id: "01",
    pool: "apt_verbal",
    stem: "Argument: \"All interns who completed the project received offers. Raj completed the project. Therefore Raj received an offer.\" Flaw:",
    options: [
      "Assumes completion is the only condition for offers",
      "Raj might be part-time",
      "Projects are too short",
      "Offers are always random"
    ],
    key: 0,
    construct: "I-VERB|SS-PS",
    difficulty: "standard",
    irt_b: 0.2
  },
  {
    id: "02",
    pool: "apt_numerical",
    stem: "Revenue grew 20% to ₹12L. Prior revenue was closest to:",
    options: ["₹9.0L", "₹10.0L", "₹11.0L", "₹9.6L"],
    key: 1,
    construct: "I-NUM|SS-PS",
    difficulty: "standard",
    irt_b: -0.1
  },
  {
    id: "03",
    pool: "apt_abstract",
    stem: "Sequence: 3, 6, 12, 24, ?",
    options: ["30", "36", "48", "42"],
    key: 2,
    construct: "I-ABS|SS-PS",
    difficulty: "beginner",
    irt_b: -0.5
  },
  {
    id: "04",
    pool: "apt_verbal",
    stem: "Passage: Policy allows WFH 2 days if deliverables on track. Deliverables on track but manager denies WFH citing \"team culture.\" Best inference:",
    options: [
      "Unwritten norms may override written policy",
      "Policy is illegal",
      "Employee should quit immediately",
      "Deliverables were not actually on track"
    ],
    key: 0,
    construct: "I-VERB|DEC-RAT",
    difficulty: "stretch",
    irt_b: 0.5
  },
  {
    id: "05",
    pool: "apt_numerical",
    stem: "Dashboard shows conversion 2.4% (240/10,000). After bot traffic removed (2,000 sessions, 0 conversions), new rate is:",
    options: ["2.4%", "3.0%", "2.7%", "3.2%"],
    key: 1,
    construct: "I-NUM|ECO-PRACTICE",
    difficulty: "stretch",
    irt_b: 0.4
  },
  {
    id: "06",
    pool: "apt_abstract",
    stem: "Which figure completes the pattern: ▲ ● ▲ ● ▲ ?",
    options: ["▲", "●", "■", "◆"],
    key: 1,
    construct: "I-ABS",
    difficulty: "beginner",
    irt_b: -0.8
  },
  {
    id: "07",
    pool: "apt_verbal",
    stem: "Statement: \"If A then B. B is true. Therefore A is true.\" Error type:",
    options: ["Affirming the consequent", "Denying the antecedent", "Ad hominem", "Straw man"],
    key: 0,
    construct: "I-VERB",
    difficulty: "standard",
    irt_b: 0.0
  },
  {
    id: "08",
    pool: "apt_numerical",
    stem: "Mean of 5 values is 20. One value 40 is replaced with 10. New mean:",
    options: ["16", "18", "17", "19"],
    key: 1,
    construct: "I-NUM",
    difficulty: "standard",
    irt_b: 0.1
  }
];

function buildJ2Items() {
  return J2_V2.map((s) =>
    item({
      item_id: `CLAR-J2-V2-${s.id}`,
      journey: "J2",
      construct: s.construct,
      question_type: "SJT",
      difficulty: s.difficulty,
      stem: s.stem,
      options: s.options,
      correct_answer: s.key,
      scoring_logic: s.scoring_logic,
      scoring_rubric: s.rubric,
      anti_bias_rationale: "Plausible distractors; construct-specific rubric (not blanket TK); key rotation across pool",
      follow_up_trigger: "conf(TEAM)<0.65 OR conf(CONF)<0.65 OR conf(SS-SELF)<0.65",
      routing_rules: {
        category: s.cat,
        replaces_v1: true,
        randomize_options: true,
        key_distribution: "balanced_0_3",
        sim_follow_up: s.cat === "conflict" ? "SIM-CONFLICT-BRANCH" : s.cat === "collaboration" ? "SIM-TEAM-CHAT-MICRO" : null
      },
      exposure_pool: "J2-V2"
    })
  );
}

function buildNegItems() {
  return NEG_V2.map((s) =>
    item({
      item_id: `CLAR-NEG-V2-${s.id}`,
      journey: "J2-NEG",
      construct: s.construct,
      question_type: "SJT",
      difficulty: "standard",
      stem: s.stem,
      options: s.options,
      correct_answer: s.key,
      scoring_logic: `NEG-SKILL rubric: ${s.rubric}; partial credit on suboptimal but professional distractors`,
      scoring_rubric: s.rubric,
      anti_bias_rationale: "Behavioural negotiation — not NEGT affect Likert",
      follow_up_trigger: "U12_negotiation_unknown OR conf(NEG-SKILL)<0.65 OR neg_sim_missing",
      routing_rules: {
        requires_sim: "SIM-NEGOTIATION-NPC-V2",
        randomize_options: true,
        block_neg_likert_fusion: true
      },
      exposure_pool: "NEG-V2"
    })
  );
}

function buildLrnItems() {
  return LRN_V2.map((s) =>
    item({
      item_id: `CLAR-J7-${s.id}`,
      journey: "J7",
      construct: s.construct,
      question_type: s.question_type ?? "SJT",
      difficulty: "standard",
      stem: s.stem,
      options: s.options,
      correct_answer: s.key === "ipsative" ? "ipsative_score" : s.key,
      scoring_logic: s.rubric === "thurstonian_ipsative" ? "Thurstonian-IRT ipsative; desirability-matched pair" : `LRN rubric: ${s.rubric}`,
      scoring_rubric: s.rubric,
      anti_bias_rationale: "Performance/adaptation evidence — not self-rated learning speed",
      follow_up_trigger: "U13_lrn_rule_change_low OR conf(LRN)<0.65",
      routing_rules: {
        sim_follow_up: "SIM-FORMAT-LAB-CLAR",
        randomize_options: s.question_type !== "forced-choice"
      },
      exposure_pool: "J7-LRN"
    })
  );
}

function buildAptItems() {
  return APT_V2.map((s) =>
    item({
      item_id: `CLAR-J8-${s.id}`,
      journey: "J8",
      construct: s.construct,
      question_type: "micro-CAT",
      difficulty: s.difficulty,
      stem: s.stem,
      options: s.options,
      correct_answer: s.key,
      scoring_logic: `IRT b=${s.irt_b}; 2PL micro-CAT; no negative marking`,
      scoring_rubric: "aptitude_micro_cat",
      anti_bias_rationale: "Figural/numeric minimal verbal load where possible; culture-fair stems",
      follow_up_trigger: "U14_aptitude_split OR conf(APT)<0.65",
      routing_rules: {
        pool: s.pool,
        cat_max_items: 6,
        cat_stop_se: 0.35,
        randomize_options: true
      },
      exposure_pool: "J8-APT"
    })
  );
}

const supplement = {
  meta: {
    version: 2,
    generated: new Date().toISOString(),
    purpose: "QA-critical/high fixes only; merge with V1 bank at runtime",
    counts: {
      J2_V2: J2_V2.length,
      NEG_V2: NEG_V2.length,
      J7_LRN: LRN_V2.length,
      J8_APT: APT_V2.length
    },
    v1_deprecation: {
      CLAR_J2_v1: "retire on merge; exclude item_ids CLAR-J2-01..CLAR-J2-35",
      NEGT_likert_primary: "block from negotiation fusion; use NEG-SKILL only"
    }
  },
  journeys_added: [
    { journey_id: "J2-NEG", name: "Negotiation & Scope", pool: "NEG-V2", items_per_session: { min: 4, max: 8 } },
    { journey_id: "J7", name: "Learning Agility Clarification", pool: "J7-LRN", items_per_session: { min: 4, max: 6 } },
    { journey_id: "J8", name: "Aptitude Micro-Clarification", pool: "J8-APT", items_per_session: { min: 4, max: 6 } }
  ],
  j2_v2_replacement: buildJ2Items(),
  negotiation: buildNegItems(),
  learning_agility: buildLrnItems(),
  aptitude: buildAptItems()
};

writeFileSync(join(OUT, "MBS_QBank_User_6_Clarification_V2_Supplement.json"), JSON.stringify(supplement, null, 2));
console.log("Wrote supplement:", supplement.meta.counts);
