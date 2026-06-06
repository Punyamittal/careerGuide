/**
 * Generates MBS_QBank_User_6_Clarification.json and companion matrices.
 * Run: node backend/exports/archive/scripts/generate-clarification-bank.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..");

const JOURNEYS = {
  J1: { id: "J1", name: "Communication & EQ", target: 35 },
  J2: { id: "J2", name: "Collaboration & Conflict", target: 35 },
  J3: { id: "J3", name: "Decision Making & Stress", target: 35 },
  J4: { id: "J4", name: "Integrity & Evidence Validation", target: 30 },
  J5: { id: "J5", name: "Career Path Clarification", target: 32 },
  J6: { id: "J6", name: "Domain Readiness Validation", target: 35 }
};

function item(base) {
  return {
    item_id: base.item_id,
    journey: base.journey,
    construct: base.construct,
    question_type: base.question_type,
    difficulty: base.difficulty,
    stem: base.stem,
    options: base.options ?? [],
    correct_answer: base.correct_answer ?? "",
    scoring_logic: base.scoring_logic,
    anti_bias_rationale: base.anti_bias_rationale,
    follow_up_trigger: base.follow_up_trigger ?? "",
    routing_rules: base.routing_rules ?? {}
  };
}

// ─── Journey 1: Communication & EQ ───────────────────────────────────────────

const J1_TEMPLATES = {
  email: [
    {
      stem: (ctx) =>
        `Email scenario (${ctx.role}): Your manager replies "See me." at 4:47 PM Friday with no context. You have a family commitment at 6 PM. Best first reply:`,
      options: [
        "Reply: \"On my way now — should I bring the Q3 deck?\"",
        "Reply: \"Can we do Monday 10 AM? I can share a written update tonight if urgent.\"",
        "Ignore until Monday",
        "Forward to a teammate asking them to cover"
      ],
      key: 1,
      construct: "COMM-AUD|COMM-DIF|EQ-SR",
      difficulty: "standard"
    },
    {
      stem: (ctx) =>
        `Email: A client writes "Your update is confusing and late." You delivered on time but the attachment was the wrong version. Best response:`,
      options: [
        "Apologize for the wrong file, attach correct version, summarize changes in 3 bullets",
        "Explain the client didn't read carefully",
        "Blame internal review process publicly",
        "Ask manager to reply instead"
      ],
      key: 0,
      construct: "COMM-WR|COMM-FB|EQ-EM",
      difficulty: "standard"
    },
    {
      stem: (ctx) =>
        `Email: You need to push back on an unrealistic deadline from a senior stakeholder. Tone that fits a ${ctx.role}:`,
      options: [
        "Data + impact + proposed alternative date with scope trade-off",
        "Emotional appeal about team burnout only",
        "Accept silently and hope for extension later",
        "CC their manager without discussion"
      ],
      key: 0,
      construct: "COMM-ASRT|COMM-PREP|EQ-OA",
      difficulty: "stretch"
    }
  ],
  chat: [
    {
      stem: (ctx) =>
        `Slack/Teams: Channel thread goes off-topic during incident response. You are ${ctx.role}. You:`,
      options: [
        "Post: \"Moving troubleshooting to #inc-123 — summary every 15 min here.\"",
        "Argue about who caused the bug in the main channel",
        "Mute channel and work solo",
        "Emoji-react only"
      ],
      key: 0,
      construct: "COMM-AL|COMM-AUD|EQ-SR",
      difficulty: "beginner"
    },
    {
      stem: (ctx) =>
        `Chat: Peer DMs you "Can you just do my slide? I'm swamped." You already have your own deadline. You:`,
      options: [
        "Ask what they tried + offer 15-min pair on structure, not full takeover",
        "Do entire slide to avoid conflict",
        "Screenshot and post in group chat to shame them",
        "Ignore message"
      ],
      key: 0,
      construct: "COMM-DIF|EQ-EM|SS-COMM",
      difficulty: "standard"
    }
  ],
  manager: [
    {
      stem: (ctx) =>
        `Manager 1:1: They say "You're too quiet in meetings." As a ${ctx.role}, best response in the moment:`,
      options: [
        "Thank them, ask for one meeting where you'll prepare one question in advance",
        "Defend that quiet people are smarter",
        "Promise to talk more without changing behavior",
        "Ask why others aren't criticized"
      ],
      key: 0,
      construct: "COMM-FB|EQ-SA|LRN-FB",
      difficulty: "standard"
    },
    {
      stem: (ctx) =>
        `Manager gives vague praise: "Good job lately." You need clearer growth signal. You:`,
      options: [
        "Ask: \"Which deliverable helped most — and what would 'great' look like next month?\"",
        "Assume you are promotion-ready",
        "Complain HR doesn't recognize you",
        "Say nothing — praise is enough"
      ],
      key: 0,
      construct: "COMM-AL|EQ-SA|WST-INIT",
      difficulty: "standard"
    }
  ],
  client: [
    {
      stem: (ctx) =>
        `Client call: They interrupt you mid-explanation. Best move:`,
      options: [
        "Pause, confirm their concern in one sentence, then offer to finish point or jump to theirs",
        "Talk louder to finish your point",
        "End call early",
        "Let them monologue without redirect"
      ],
      key: 0,
      construct: "COMM-NV|EQ-OA|COMM-DIF",
      difficulty: "stretch"
    }
  ],
  forced_choice: [
    {
      stem: () => `Pick the response more like you when explaining a mistake to your manager:`,
      options: ["Lead with facts, impact, fix, prevention", "Wait until asked directly"],
      key: 0,
      construct: "COMM-WR|EQ-SR|BIG5-C",
      difficulty: "beginner",
      type: "forced-choice"
    },
    {
      stem: () => `Pick more like you when a teammate's tone feels sharp in chat:`,
      options: ["Assume positive intent; ask clarifying question", "Match sharp tone to show strength"],
      key: 0,
      construct: "EQ-SR|COMM-DIF|EQ-OA",
      difficulty: "beginner",
      type: "forced-choice"
    }
  ],
  eq_affect: [
    {
      stem: () =>
        `Read-the-room: Message says "Fine. Ship it." after a long debate. Most likely intent:`,
      options: ["Genuine agreement", "Resigned agreement with lingering concern", "Sarcasm", "Anger"],
      key: 1,
      construct: "EQ-OA|COMM-NV|EQ-EM-COG",
      difficulty: "standard",
      type: "affect-recognition"
    },
    {
      stem: () =>
        `Peer voice note sounds flat after their idea was rejected. Best empathic opener:`,
      options: [
        "\"I can see that landed hard — want to walk through what you were aiming for?\"",
        "\"Don't take it personally\"",
        "\"Management is like that\"",
        "Change topic to lunch"
      ],
      key: 0,
      construct: "EQ-EM|COMM-DIF|EQ-EMB",
      difficulty: "standard",
      type: "SJT"
    }
  ],
  ranking: [
    {
      stem: () => `Rank these feedback approaches (best → worst) after a missed deadline you caused:`,
      options: [
        "Notify early with revised plan",
        "Stay silent until demo",
        "Blame tooling",
        "Fix quietly without telling stakeholders"
      ],
      key: [0, 3, 1, 2],
      construct: "COMM-FB|SS-SELF|BIG5-C",
      difficulty: "standard",
      type: "ranking"
    }
  ]
};

const ROLES = [
  "software intern",
  "data analyst fresher",
  "marketing associate",
  "operations trainee",
  "UX design intern",
  "finance analyst (0-1 yr)"
];

function expandJ1() {
  const items = [];
  let n = 0;
  const cats = ["email", "chat", "manager", "client", "forced_choice", "eq_affect", "ranking"];
  while (items.length < JOURNEYS.J1.target) {
    for (const cat of cats) {
      if (items.length >= JOURNEYS.J1.target) break;
      const pool = J1_TEMPLATES[cat];
      const tpl = pool[n % pool.length];
      const ctx = { role: ROLES[n % ROLES.length] };
      const seq = String(items.length + 1).padStart(2, "0");
      const qType = tpl.type ?? (cat === "forced_choice" ? "forced-choice" : cat === "ranking" ? "ranking" : "SJT");
      items.push(
        item({
          item_id: `CLAR-J1-${seq}`,
          journey: "J1",
          construct: tpl.construct,
          question_type: qType,
          difficulty: tpl.difficulty,
          stem: typeof tpl.stem === "function" ? tpl.stem(ctx) : tpl.stem(),
          options: tpl.options,
          correct_answer: Array.isArray(tpl.key) ? JSON.stringify(tpl.key) : String(tpl.key),
          scoring_logic:
            qType === "forced-choice"
              ? "Thurstonian-IRT ipsative; both options desirability-matched"
              : qType === "ranking"
                ? "Spearman vs expert rank [0,3,1,2]; partial credit per position"
                : `Keyed option ${tpl.key}; latency >8s flags faking on desirable traits`,
          anti_bias_rationale: "Scenario-based or ipsative — not self-rated Likert on communication/EQ",
          follow_up_trigger: "conf(COMM)<0.65 OR conf(EQ)<0.65 OR method_divergence_z>1.0",
          routing_rules: {
            pool: cat,
            next_on_correct: `CLAR-J1-${String((items.length + 2) % JOURNEYS.J1.target || 1).padStart(2, "0")}`,
            skip_if: "conf(COMM)>=0.75 AND conf(EQ)>=0.75",
            randomize_options: true
          }
        })
      );
      n++;
    }
  }
  return items;
}

// ─── Journey 2: Collaboration & Conflict ─────────────────────────────────────

const J2_SCENARIOS = [
  {
    cat: "group_project",
    stems: [
      "Group project: Two teammates want different architectures. Stand-up is in 10 minutes. You:",
      "Sprint planning: Story points disagree by 3x between devs. You facilitate by:",
      "Team demo prep: One member hasn't pushed code. You:"
    ],
    options: [
      ["Propose spike + decision criteria before choosing", "Side with senior dev", "Delay stand-up", "Escalate to skip retro"],
      ["Time-box discussion; capture assumptions; pick experiment", "Let loudest voice win", "Cancel planning", "Split team permanently"],
      ["Offer pair session; clarify blocker; adjust scope with PM", "Do their part secretly", "Call them out publicly", "Remove them from repo"]
    ],
    keys: [0, 0, 0],
    construct: "TEAM-INC|TEAM-CON|SS-COLLAB"
  },
  {
    cat: "disagreement",
    stems: [
      "Team disagrees on releasing with known minor bug. You:",
      "Design review: UX and eng deadlock on scope. You:",
      "Retrospective: blame game starts. You:"
    ],
    options: [
      ["Frame user impact + rollback plan; decide with data", "Ship anyway to look decisive", "Refuse to participate", "Quit channel"],
      ["Map user journey; propose phased release", "Pick UX always", "Pick eng always", "Ask manager to decide without context"],
      ["Redirect to process: what signal we missed", "Join blame", "Stay silent", "Leave meeting"]
    ],
    keys: [0, 0, 0],
    construct: "TEAM-DA|TEAM-GT|CONF-COMP"
  },
  {
    cat: "ownership",
    stems: [
      "You find a production bug you may have introduced last week. You:",
      "Handoff doc from previous intern is wrong. You:",
      "On-call alert fires on your feature flag. You:"
    ],
    options: [
      ["Alert team, document timeline, propose fix + postmortem", "Revert quietly hoping no one notices", "Blame previous release", "Wait for manager"],
      ["Verify, update doc, notify owner + consumers", "Delete doc", "Ignore — not your job", "Complain in chat"],
      ["Acknowledge in channel, triage, rollback if needed", "Disable flag without telling anyone", "Assign to senior only", "Snooze alert"]
    ],
    keys: [0, 0, 0],
    construct: "SS-SELF|WST-INIT|BIG5-C"
  },
  {
    cat: "credit",
    stems: [
      "Manager credits you for fix that was pair work. You:",
      "Teammate presents your analysis as theirs. You:",
      "Launch post: only your name tagged. You:"
    ],
    options: [
      ["Redirect credit to pair + describe split", "Accept full credit", "Embarrass them in reply-all", "Resign from project"],
      ["Private chat: clarify attribution; offer co-present", "Public call-out", "Never help again", "Escalate immediately"],
      ["Ask to update post with contributors", "Ignore", "Sabotage launch", "Post angry comment"]
    ],
    keys: [0, 0, 0],
    construct: "TEAM-SL|WST-COOP|EQ-EM"
  },
  {
    cat: "conflict_missed_deadline",
    stems: [
      "Peer missed deadline causing your rework. First conversation:",
      "Vendor missed SLA. Your manager asks you to email. You:",
      "Cross-team dependency slipped silently. You:"
    ],
    options: [
      ["Ask what blocked them; agree shared checkpoint", "Send angry Slack", "Do rework silently", "Escalate without talking"],
      ["Fact-based email + impact + ask recovery plan", "Threaten legal action", "Ghost vendor", "Blame manager"],
      ["Document slip; propose visibility ritual", "Accept silently forever", "Public shaming", "Quit task"]
    ],
    keys: [0, 0, 0],
    construct: "CONF-COLL|CONF-COMP|COMM-ASRT"
  },
  {
    cat: "conflict_escalation",
    stems: [
      "Stakeholder demands feature out of scope. You:",
      "Senior dev dismisses your bug report. You:",
      "HR policy blocks your preferred WFH day. You:"
    ],
    options: [
      ["Clarify goal; show trade-off matrix; escalate with options", "Build secretly", "Argue in all-hands", "Complain anonymously"],
      ["Reproduce with logs; ask for 15-min debug together", "Give up", "Email their boss", "Mock expertise"],
      ["Ask policy rationale; propose pilot data", "Ignore policy", "Rage quit channel", "Fake sick daily"]
    ],
    keys: [0, 0, 0],
    construct: "CONF-AV|CONF-CMP|COMM-DIF"
  }
];

function expandJ2() {
  const items = [];
  let idx = 0;
  while (items.length < JOURNEYS.J2.target) {
    for (const block of J2_SCENARIOS) {
      if (items.length >= JOURNEYS.J2.target) break;
      const si = idx % block.stems.length;
      const seq = String(items.length + 1).padStart(2, "0");
      const diff = ["beginner", "standard", "stretch"][idx % 3];
      items.push(
        item({
          item_id: `CLAR-J2-${seq}`,
          journey: "J2",
          construct: block.construct,
          question_type: idx % 5 === 0 ? "forced-choice" : "SJT",
          difficulty: diff,
          stem:
            idx % 5 === 0
              ? `Pick more like you in team conflict: (A) Address issue directly with specific example (B) Avoid until it blows over`
              : block.stems[si],
          options:
            idx % 5 === 0
              ? ["Address directly with example", "Avoid until it blows over"]
              : block.options[si],
          correct_answer: idx % 5 === 0 ? "0" : "0",
          scoring_logic:
            idx % 5 === 0
              ? "Thurstonian-IRT ipsative"
              : "Thomas-Kilmann style mapping; collaborate/problem-solve weighted highest",
          anti_bias_rationale: "Workplace scenario reveals conflict/collaboration style indirectly",
          follow_up_trigger: "conf(TEAM)<0.65 OR conf(CONF)<0.65 OR TEAM-COOP vs CONF-CMP divergence",
          routing_rules: {
            category: block.cat,
            sim_follow_up: idx % 4 === 0 ? "SIM-TEAM-CHAT-MICRO" : null,
            randomize_options: true
          }
        })
      );
      idx++;
    }
  }
  return items;
}

// ─── Journey 3: Decision Making & Stress ─────────────────────────────────────

const J3_SCENARIOS = [
  {
    stem: "In-tray mini: Items — (1) angry enterprise client (2) CEO vague 'thoughts?' (3) newsletter trap (4) teammate blocker. Rank top priority:",
    type: "ranking",
    construct: "BIG5-C|DEC-RAT|stress",
    options: ["Client revenue risk", "CEO request", "Newsletter", "Teammate blocker"],
    key: [0, 3, 2, 1]
  },
  {
    stem: "Two Doors: Launch feature with 85% test coverage vs delay 2 days for edge cases. 3 clue cards available. You typically:",
    type: "behavioural-game-ref",
    construct: "DEC-MAX|DEC-SAT|DEC-UNC",
    options: ["Open all clues then decide", "Decide in <15s", "Open 1 clue", "Avoid choosing — ask manager"],
    key: "telemetry:clues_opened,time_to_decide"
  },
  {
    stem: "Production incident + demo in 1 hour. You:",
    type: "SJT",
    construct: "DEC-SPD|stress|SS-PS",
    options: [
      "Communicate status; fix critical path; defer demo slice if needed",
      "Hide incident until demo ends",
      "Cancel demo without notice",
      "Fix only cosmetic demo issues"
    ],
    key: 0
  },
  {
    stem: "Limited info: Analytics dashboard down; leadership wants numbers for board deck in 30 min. You:",
    type: "SJT",
    construct: "DEC-UNC|DEC-RAT|SS-PS",
    options: [
      "State confidence intervals from partial export + caveats + ETA for full fix",
      "Fabricate trend to match last month",
      "Go silent",
      "Blame vendor in deck footnote only"
    ],
    key: 0
  },
  {
    stem: "Pick more like you under time pressure:",
    type: "forced-choice",
    construct: "DEC-SPD|DEC-MAX",
    options: ["Ship good-enough with documented risks", "Delay until perfect"],
    key: 0
  }
];

function expandJ3() {
  const items = [];
  const pressures = [
    "Sprint ends today; two P1 bugs and one nice-to-have polish.",
    "Manager asks for estimate on unfamiliar API integration.",
    "Customer escalation while you are sole on-call fresher.",
    "Budget cut removes contractor; scope unchanged.",
    "Regulatory audit sample requested by EOD."
  ];
  const actions = [
    ["Triage P1s; descope polish with written comms", "Polish UI first", "Leave early", "Push all to next sprint silently"],
    ["Break into spikes; share range estimate with assumptions", "Guess single number", "Refuse task", "Copy last project's estimate"],
    ["Follow runbook; loop senior; customer update every 30 min", "Restart server only", "Ignore ticket", "Close ticket as duplicate"],
    ["Renegotiate scope with impact table", "Work unpaid overtime indefinitely", "Quit", "Blame finance in stand-up"],
    ["Pull sample with audit trail; flag gaps", "Delay without telling", "Delete logs", "Ask intern to forge timestamp"]
  ];
  let idx = 0;
  while (items.length < JOURNEYS.J3.target) {
    const base = J3_SCENARIOS[idx % J3_SCENARIOS.length];
    const seq = String(items.length + 1).padStart(2, "0");
    if (base.type === "behavioural-game-ref") {
      items.push(
        item({
          item_id: `CLAR-J3-${seq}`,
          journey: "J3",
          construct: base.construct,
          question_type: "simulation-ref",
          difficulty: ["beginner", "standard", "stretch"][idx % 3],
          stem: `${base.stem} (variant ${Math.floor(idx / 5) + 1})`,
          options: base.options,
          correct_answer: base.key,
          scoring_logic: "Telemetry: clues_opened, revisions, time_to_decide → DEC-MAX/SAT indices",
          anti_bias_rationale: "Pure behavioural decision task — cannot fake maximiser/satisficer claim",
          follow_up_trigger: "in_tray_rank_corr<0.5 OR dec_divergence OR stress_split",
          routing_rules: { sim_module: "TWO_DOORS", rounds: 2, difficulty: ["beginner", "standard", "stretch"][idx % 3] }
        })
      );
    } else if (base.type === "ranking") {
      items.push(
        item({
          item_id: `CLAR-J3-${seq}`,
          journey: "J3",
          construct: base.construct,
          question_type: "ranking",
          difficulty: "standard",
          stem: base.stem.replace("mini", `mini #${idx + 1}`),
          options: base.options,
          correct_answer: JSON.stringify(base.key),
          scoring_logic: "Weighted rank vs expert key; trap item penalty",
          anti_bias_rationale: "Revealed prioritisation under pressure",
          follow_up_trigger: "conf(BIG5-C)<0.65",
          routing_rules: { sim_module: "IN_TRAY_MINI", item_count: 3 + (idx % 3) }
        })
      );
    } else {
      const pi = idx % pressures.length;
      items.push(
        item({
          item_id: `CLAR-J3-${seq}`,
          journey: "J3",
          construct: base.construct,
          question_type: base.type,
          difficulty: ["beginner", "standard", "stretch"][idx % 3],
          stem: base.type === "forced-choice" ? base.stem : `Time pressure: ${pressures[pi]}`,
          options: base.type === "forced-choice" ? base.options : actions[pi],
          correct_answer: String(base.key),
          scoring_logic: base.type === "forced-choice" ? "Ipsative IRT" : "Keyed SJT + latency",
          anti_bias_rationale: "Decision under load — not self-report decisiveness",
          follow_up_trigger: "stress_split OR conf(DEC)<0.65",
          routing_rules: {
            sim_module: idx % 3 === 0 ? "CRISIS_COMMANDER" : idx % 3 === 1 ? "IN_TRAY_MINI" : "TWO_DOORS",
            randomize_options: true
          }
        })
      );
    }
    idx++;
  }
  return items;
}

// ─── Journey 4: Integrity ────────────────────────────────────────────────────

const J4_SCENARIOS = [
  {
    stem: "You shipped a bug affecting ~200 users. No one noticed yet. You:",
    options: ["Disclose, fix, postmortem", "Fix silently", "Wait for support ticket", "Revert and blame deploy tool"],
    construct: "Integrity|SS-SELF|OB-022"
  },
  {
    stem: "Resume lists 'Advanced Kubernetes' but you've only run kubectl get pods. In interview skills check you:",
    options: ["Clarify exposure level honestly", "Deflect to team lead", "Pretend expertise", "Cancel interview"],
    construct: "ECO-DOMAIN:over-claim|Integrity"
  },
  {
    stem: "Rate familiarity 1-5: [Real: Git rebase] [FAKE: Quantum JIRA pipeline] [Real: SQL joins] [FAKE: Neural OKR matrix]",
    options: ["Honest ratings; fake concepts rated low/unknown", "Rate all 4-5 to look strong"],
    construct: "ECO-DOMAIN:over-claim|Integrity",
    type: "overclaiming"
  },
  {
    stem: "Manager asks you to backdate a report timestamp. You:",
    options: ["Refuse; propose accurate timeline", "Comply", "Do it but tell peer", "Anonymous leak"],
    construct: "Integrity|ECO-COMPLIANCE|OB-022"
  },
  {
    stem: "Honest Dice: System shows you rolled 3; reporting screen asks your roll for points. You:",
    options: ["Report 3", "Report 5 or 6"],
    construct: "Integrity|Honest-Dice",
    type: "simulation-ref"
  },
  {
    stem: "Pick more like you when you don't know an answer in a client meeting:",
    options: ["Say you'll verify and follow up with source", "Bluff confidently"],
    construct: "Integrity|COMM-WR|EQ-SR",
    type: "forced-choice"
  }
];

function expandJ4() {
  const items = [];
  const variants = [
    "dataset you cleaned",
    "API certificate expiry",
    "expense receipt",
    "user PII in log file",
    "plagiarized slide from blog",
    "time sheet hours",
    "open-source license violation",
    "fake demo data shown as real"
  ];
  let idx = 0;
  while (items.length < JOURNEYS.J4.target) {
    const base = J4_SCENARIOS[idx % J4_SCENARIOS.length];
    const seq = String(items.length + 1).padStart(2, "0");
    const v = variants[idx % variants.length];
    const qType = base.type ?? "SJT";
    items.push(
      item({
        item_id: `CLAR-J4-${seq}`,
        journey: "J4",
        construct: base.construct,
        question_type: qType,
        difficulty: ["beginner", "standard", "stretch"][idx % 3],
        stem:
          qType === "overclaiming"
            ? base.stem
            : qType === "simulation-ref"
              ? base.stem
              : base.stem.replace("bug", `issue with ${v}`).replace("Resume", `Resume claims expertise on ${v};`),
        options: base.options,
        correct_answer: "0",
        scoring_logic:
          qType === "simulation-ref"
            ? "over_report = reported - actual; aggregate trials"
            : qType === "overclaiming"
              ? "fake_familiarity_index = mean(rating on planted fakes)"
              : "Keyed ethical action; integrity index private",
        anti_bias_rationale: "Behavioural integrity — ground truth or planted fakes; never punitive UI",
        follow_up_trigger: "honest_dice_flag OR eco_d02_fake OR resume_mismatch OR validity_caution",
        routing_rules: {
          sim_module: qType === "simulation-ref" ? "HONEST_DICE" : null,
          trials: 2,
          never_surface_cheat_label: true
        }
      })
    );
    idx++;
  }
  return items;
}

// ─── Journey 5: Career Path ──────────────────────────────────────────────────

const J5_SCENARIOS = [
  {
    stem: "Offer A: Stable enterprise role, clear ladder. Offer B: Startup, ambiguous title, higher learning. You lean:",
    options: ["A — predictability", "B — learning upside", "Need more info — compare 90-day goals", "Reject both quickly"],
    construct: "OWV-IND|OWV-ACH|ENT-RT"
  },
  {
    stem: "Trade-off Island (4 tokens): allocate across Income / Learning / Stability / Impact",
    type: "allocation-game-ref",
    construct: "OWV-*|path_branch",
    options: ["Token allocation vectors — no single key"],
    key: "revealed_preference"
  },
  {
    stem: "Manager path vs expert IC path opens. You prefer:",
    options: ["People leadership", "Deep technical mastery", "Hybrid — lead small projects", "Undecided — trial both"],
    construct: "WST-LEAD|OWV-IND|path_branch"
  },
  {
    stem: "Pick more like you:",
    options: ["Initiate pilot without full budget approval when upside clear", "Wait for formal greenlight always"],
    construct: "ENT-PRO|WST-INIT",
    type: "forced-choice"
  },
  {
    stem: "Enterprise compliance slows you. You:",
    options: ["Learn system; find compliant shortcuts", "Chafe and disengage", "Break rules for speed", "Quit immediately"],
    construct: "ENT-AMB|OWV-IND|adaptability"
  }
];

function expandJ5() {
  const items = [];
  const paths = [
    "specialist deep-dive in data engineering",
    "generalist rotational program",
    "intrapreneurship lab",
    "consulting travel-heavy role",
    "remote-first global team",
    "government sector stability"
  ];
  let idx = 0;
  while (items.length < JOURNEYS.J5.target) {
    const base = J5_SCENARIOS[idx % J5_SCENARIOS.length];
    const seq = String(items.length + 1).padStart(2, "0");
    const qType = base.type ?? (base.type === "forced-choice" ? "forced-choice" : base.type === "allocation-game-ref" ? "allocation-game-ref" : "SJT");
    items.push(
      item({
        item_id: `CLAR-J5-${seq}`,
        journey: "J5",
        construct: base.construct,
        question_type: qType === "allocation-game-ref" ? "allocation-game" : base.type ?? "SJT",
        difficulty: ["beginner", "standard", "stretch"][idx % 3],
        stem:
          qType === "allocation-game-ref"
            ? `Trade-off Island: distribute 4 life tokens across values (variant: ${paths[idx % paths.length]})`
            : typeof base.stem === "string"
              ? `${base.stem} Context: ${paths[idx % paths.length]}.`
              : base.stem,
        options: base.options ?? ["Income", "Learning", "Stability", "Impact"],
        correct_answer: base.key ?? "0",
        scoring_logic:
          qType === "allocation-game-ref"
            ? "Normalize allocations → OWV rank; entropy flags indecision"
            : base.type === "forced-choice"
              ? "Ipsative → ENT vs employee path signal"
              : "Path signal weights toward job vs intrapreneur",
        anti_bias_rationale: "Revealed preference and trade-offs — not 'are you entrepreneurial?' Likert",
        follow_up_trigger: "path_branch_confidence<0.65 OR ent_job_signal_delta<0.12",
        routing_rules: { sim_module: idx % 2 === 0 ? "TRADE_OFF_ISLAND" : "ENT_MICRO_SCENE", randomize_options: true }
      })
    );
    idx++;
  }
  return items;
}

// ─── Journey 6: Domain Readiness ─────────────────────────────────────────────

const J6_SECTORS = [
  { sector: "IT services / GCC", tools: ["Jira", "Git", "Power BI"], trend: "GenAI code assist" },
  { sector: "Fintech / BFSI", tools: ["SQL", "PCI-DSS awareness", "UPI flows"], trend: "RBI digital lending norms" },
  { sector: "E-commerce / D2C", tools: ["Shopify", "GA4", "CRM"], trend: "ONDC adoption" },
  { sector: "Healthcare ops", tools: ["EHR basics", "HIPAA/DPDP awareness"], trend: "Telehealth scale" },
  { sector: "Manufacturing supply chain", tools: ["ERP", "Excel advanced"], trend: "Industry 4.0 sensors" }
];

const J6_TEMPLATES = [
  {
    type: "matching",
    stem: (s) => `Sector Match: How does a ${s.sector} firm PRIMARILY earn revenue?`,
    options: ["Subscription SaaS only", "Project/hours + outcome SLAs", "Ad revenue only", "Government grants only"],
    key: 1,
    construct: "ECO-SECTOR"
  },
  {
    type: "SJT",
    stem: (s) => `Compliance: Handling customer PAN data in ${s.sector} — first step:`,
    options: ["Check data minimization + consent + secure storage policy", "Email PAN in plain text for speed", "Store in personal Notion", "Ignore — intern task"],
    key: 0,
    construct: "ECO-COMPLIANCE|ECO-PRACTICE"
  },
  {
    type: "matching",
    stem: (s) => `Tool Bench: Best primary use of ${s.tools[0]} in ${s.sector}:`,
    options: ["Issue tracking & sprint visibility", "Payroll only", "Video editing", "Hardware design"],
    key: 0,
    construct: "ECO-TOOLS"
  },
  {
    type: "multi-select",
    stem: (s) => `Trend Radar 2026: Select forces reshaping ${s.sector}:`,
    options: (s) => [s.trend, "Return to fax machines", "Decline of cloud", "Paper-only audits"],
    key: [0],
    construct: "ECO-TREND-2026"
  },
  {
    type: "SJT",
    stem: () => `AI adoption: Your team wants to paste client data into a public LLM. You:`,
    options: ["Propose approved enterprise tool + redaction policy", "Do it for speed", "Share API keys in chat", "Ignore policy"],
    key: 0,
    construct: "ECO-COMPLIANCE|ECO-TREND-2026:AI"
  },
  {
    type: "SJT",
    stem: () => `Data literacy: Dashboard shows 20% uplift but sample size n=12. You:`,
    options: ["Flag confidence interval; request larger sample", "Present as definitive win", "Hide chart", "Change axis to exaggerate"],
    key: 0,
    construct: "I-NUM|ECO-PRACTICE|SS-PS"
  }
];

function expandJ6() {
  const items = [];
  let idx = 0;
  while (items.length < JOURNEYS.J6.target) {
    for (const s of J6_SECTORS) {
      if (items.length >= JOURNEYS.J6.target) break;
      for (const tpl of J6_TEMPLATES) {
        if (items.length >= JOURNEYS.J6.target) break;
        const seq = String(items.length + 1).padStart(2, "0");
        items.push(
          item({
            item_id: `CLAR-J6-${seq}`,
            journey: "J6",
            construct: tpl.construct,
            question_type: tpl.type,
            difficulty: ["beginner", "standard", "stretch"][idx % 3],
            stem: tpl.stem(s),
            options: typeof tpl.options === "function" ? tpl.options(s) : tpl.options,
            correct_answer: Array.isArray(tpl.key) ? JSON.stringify(tpl.key) : String(tpl.key),
            scoring_logic:
              tpl.type === "multi-select"
                ? "Partial credit: +1 per correct selection, -0.5 per wrong"
                : tpl.type === "matching"
                  ? "Exact match = 1.0"
                  : "Keyed SJT",
            anti_bias_rationale: "Applied domain knowledge — not self-rated sector awareness",
            follow_up_trigger: "eco_role_accuracy<0.60 OR resume_sector_mismatch",
            routing_rules: {
              role_weighted: true,
              sim_module: idx % 4 === 0 ? "MARKET_MOVER" : idx % 4 === 1 ? "SECTOR_MATCH" : null,
              randomize_options: true
            }
          })
        );
        idx++;
      }
    }
  }
  return items;
}

// ─── Simulation library ───────────────────────────────────────────────────────

const SIMULATION_LIBRARY = {
  IN_TRAY_MINI: {
    sim_id: "SIM-IN-TRAY-MINI",
    module: "M4 Environment Simulator",
    journeys: ["J3"],
    setup: "Day-1 inbox: 3-6 items including trap (newsletter), angry client, vague exec ask, teammate blocker.",
    npc_responses: {
      angry_client: "Escalates if no ack in 5 min; de-escalates with timeline + owner",
      exec_vague: "Rewards clarifying questions; penalizes silent acceptance",
      trap_newsletter: "Low priority — penalizes ranking first"
    },
    branches: ["prioritize_only", "prioritize_plus_one_line_reply"],
    scoring_rubric: {
      priority_order: "Kendall tau vs expert [client, teammate, exec, newsletter]",
      trap_avoidance: "+0.2 if newsletter not top-2",
      stress_index: "performance_delta_last_60s vs first_60s"
    },
    telemetry: ["drag_order", "action_tags", "reshuffle_count", "time_to_first_action", "reply_text", "timeout"],
    success: "tau>=0.6 AND trap_rank>=3",
    failure: "tau<0.4 OR client_unacked>300s"
  },
  TEAM_CHAT_MICRO: {
    sim_id: "SIM-TEAM-CHAT-MICRO",
    module: "teamwork branching",
    journeys: ["J2"],
    setup: "Group chat: shortcut vs quality debate; embedded groupthink moment.",
    npc_responses: {
      senior_dev: "Pushes ship-now",
      qa: "Requests regression",
      pm: "Asks for risk summary"
    },
    branches: {
      voice_dissent: "→ collaborative path",
      go_along: "→ groupthink path",
      private_fix: "→ ownership path with trust penalty"
    },
    scoring_rubric: {
      TEAM_DA: "weight 1.0 if constructive dissent",
      TEAM_GT: "penalty if silent agreement after red flag",
      TEAM_INC: "bonus for inclusive synthesis message"
    },
    telemetry: ["message_choice", "latency_ms", "dissent_flag", "credit_share_flag"],
    success: "dissent_constructive OR inclusive_synthesis",
    failure: "public_blame OR silent_go_along_on_critical_risk"
  },
  CONFLICT_BRANCH: {
    sim_id: "SIM-CONFLICT-BRANCH",
    module: "conflict SJT branching",
    journeys: ["J2"],
    setup: "Missed handoff caused rework; 3-node dialogue tree.",
    npc_responses: { peer_defensive: "Escalates if accused; opens if curiosity shown" },
    branches: ["compete", "collaborate", "avoid", "accommodate"],
    scoring_rubric: "Thomas-Kilmann mapping; collaborate/compromise highest for workplace norm",
    telemetry: ["path", "latency_per_node", "escalation_flag"],
    success: "collaborate_or_compromise_with_specific_next_step",
    failure: "avoid_on_critical OR compete_with_personal_attack"
  },
  NEGOTIATION_NPC: {
    sim_id: "SIM-NEGOTIATION-NPC",
    module: "negotiation economic sim",
    journeys: ["J2", "J1"],
    setup: "Stakeholder wants scope +2 days earlier; 2 rounds offer/counter.",
    npc_responses: {
      round1_hardline: "Reject unless interest probe",
      round2: "Accept trade: drop nice-to-have OR add resource"
    },
    branches: ["probe_interests", "concede_immediately", "hardball", "walkaway"],
    scoring_rubric: {
      joint_value: "scope_time_pareto_score",
      relationship: "npc_trust_meter",
      NEGT: "interest_probing + creative_trade flags"
    },
    telemetry: ["offers", "concessions", "probe_count", "walk_away", "latency_ms"],
    success: "joint_value>=0.7 AND trust>=0.5",
    failure: "walkaway_without_probe OR zero_sum_only"
  },
  TWO_DOORS: {
    sim_id: "SIM-TWO-DOORS",
    module: "decision game",
    journeys: ["J3"],
    setup: "Timed dilemma; 0-3 clue cards optional before choice.",
    npc_responses: {},
    branches: ["door_a", "door_b", "timeout"],
    scoring_rubric: {
      DEC_MAX: "clues_opened>=2 AND slow_decide",
      DEC_SPD: "decide<10s clues=0",
      DEC_SAT: "1 clue + moderate time"
    },
    telemetry: ["clues_opened", "time_to_decide", "revisions"],
    success: "informed_choice OR justified_fast_satificing",
    failure: "timeout OR random_flip_flop"
  },
  CRISIS_COMMANDER: {
    sim_id: "SIM-CRISIS-COMMANDER",
    module: "K9 Crisis Commander",
    journeys: ["J3"],
    setup: "5 incidents; rank now/next/later under 90s timer.",
    npc_responses: { ops_channel: "Floods with noise if no structured updates" },
    branches: ["rank_only", "rank_plus_comms_template"],
    scoring_rubric: {
      stress_tolerance: "accuracy_under_timer",
      DEC_RAT: "critical_incident_top_rank"
    },
    telemetry: ["rank_order", "time_remaining", "accuracy", "comms_sent"],
    success: "critical_first AND accuracy>=0.7",
    failure: "cosmetic_first OR timeout_zero_done"
  },
  TRADE_OFF_ISLAND: {
    sim_id: "SIM-TRADE-OFF-ISLAND",
    module: "workvalues allocation",
    journeys: ["J5"],
    setup: "4 tokens across Income/Learning/Stability/Impact; animated consequences.",
    npc_responses: {},
    branches: ["allocation_vectors"],
    scoring_rubric: "Normalize → OWV-ACH/IND/etc.; entropy for ambiguity",
    telemetry: ["allocations", "reallocations", "latency_ms"],
    success: "complete_allocation",
    failure: "timeout_incomplete"
  },
  SECTOR_MATCH: {
    sim_id: "SIM-SECTOR-MATCH",
    module: "ECO-SECTOR",
    journeys: ["J6"],
    setup: "Match 5 businesses to revenue models; role-weighted sector from intake.",
    scoring_rubric: "accuracy role-weighted x1.25 for target sector items",
    telemetry: ["matches", "latency_ms", "hints_used"],
    success: "accuracy>=0.75 target_sector",
    failure: "accuracy<0.5"
  },
  TREND_RADAR: {
    sim_id: "SIM-TREND-RADAR",
    module: "ECO-TREND",
    journeys: ["J6"],
    setup: "Sort 2026 forces vs decoys for target sector.",
    scoring_rubric: "partial credit multi-select",
    telemetry: ["selections", "latency_ms"],
    success: "precision>=0.8",
    failure: "decoy_selection>1"
  },
  TOOL_BENCH: {
    sim_id: "SIM-TOOL-BENCH",
    module: "ECO-TOOLS",
    journeys: ["J6"],
    setup: "Match tools to primary job tasks for role_target.",
    scoring_rubric: "exact match scoring",
    telemetry: ["pairings", "latency_ms"],
    success: "accuracy>=0.8",
    failure: "accuracy<0.55"
  },
  MARKET_MOVER: {
    sim_id: "SIM-MARKET-MOVER",
    module: "K2 Market Mover",
    journeys: ["J6"],
    setup: "1-2 business scenarios; pricing/inventory decision moves simulated metric.",
    npc_responses: { market: "Reacts to discount depth vs margin" },
    branches: ["price_cut", "hold_margin", "bundle_offer"],
    scoring_rubric: "metric_delta + rationale quality (AI optional)",
    telemetry: ["decisions", "metric_series", "latency_ms"],
    success: "positive_metric_without_compliance_breach",
    failure: "metric_collapse OR unethical_choice"
  },
  HONEST_DICE: {
    sim_id: "SIM-HONEST-DICE",
    module: "integrity game",
    journeys: ["J4"],
    setup: "Report dice roll for points; system knows ground truth. 2-3 trials.",
    scoring_rubric: "over_report aggregate; never shown to candidate as cheat",
    telemetry: ["actual_roll", "reported_roll", "latency_ms"],
    success: "exact_reporting",
    failure: "systematic_over_report"
  },
  READ_THE_ROOM: {
    sim_id: "SIM-READ-THE-ROOM",
    module: "EQ affect",
    journeys: ["J1"],
    setup: "4 micro-clips/snippets; pick emotion + best response.",
    scoring_rubric: "accuracy + speed-accuracy composite",
    telemetry: ["emotion_choice", "response_choice", "latency_ms"],
    success: "accuracy>=0.75",
    failure: "accuracy<0.55"
  }
};

// ─── Routing matrix ───────────────────────────────────────────────────────────

function buildRoutingMatrix() {
  return {
    version: 1,
    phase_id: "7.5",
    max_journeys_per_session: 2,
    max_items_per_journey: 12,
    entry_evaluation: "POST /v6/session/{id}/clarify/evaluate",
    journeys: Object.entries(JOURNEYS).map(([k, v]) => ({
      journey_id: k,
      name: v.name,
      target_pool_size: v.target,
      items_per_session: { min: 6, max: 12 },
      triggers: {
        J1: ["conf(COMM)<0.65", "conf(EQ)<0.65", "method_divergence(COMM,EQ)>1.0"],
        J2: ["conf(TEAM)<0.65", "conf(CONF)<0.65", "TEAM-COOP vs CONF-CMP divergence"],
        J3: ["in_tray_tau<0.5", "dec_divergence", "stress_split"],
        J4: ["honest_dice_overreport", "eco_fake_familiarity", "resume_mismatch", "validity_caution"],
        J5: ["path_branch_conf<0.65", "abs(ent_signal-job_signal)<0.12"],
        J6: ["eco_accuracy<0.60", "resume_sector_mismatch"]
      }[k],
      priority: { J4: 1, J1: 2, J2: 3, J3: 4, J5: 5, J6: 6 }[k],
      sim_injection: {
        J1: ["READ_THE_ROOM"],
        J2: ["TEAM_CHAT_MICRO", "CONFLICT_BRANCH", "NEGOTIATION_NPC"],
        J3: ["IN_TRAY_MINI", "TWO_DOORS", "CRISIS_COMMANDER"],
        J4: ["HONEST_DICE"],
        J5: ["TRADE_OFF_ISLAND"],
        J6: ["SECTOR_MATCH", "TREND_RADAR", "TOOL_BENCH", "MARKET_MOVER"]
      }[k]
    })),
    rotation: {
      strategy: "stratified_random",
      exclude_recent: 5,
      balance_difficulty: true,
      randomize_option_order: true
    },
    adaptive_rules: {
      construct_confidence_floor: 0.65,
      method_divergence_z: 1.0,
      after_journey_refusion: "confidence_weighted_v2",
      stop_journey_if: "conf(target_construct)>=0.75 OR items_answered>=12"
    }
  };
}

// ─── Scoring matrix ───────────────────────────────────────────────────────────

function buildScoringMatrix() {
  const constructs = [
    "COMM", "EQ", "TEAM", "CONF", "NEGT", "DEC", "BIG5-C", "stress", "Integrity",
    "LRN", "SS-SELF", "ENT", "OWV", "WST", "ECO-SECTOR", "ECO-TOOLS", "ECO-TREND", "ECO-COMPLIANCE", "path_branch"
  ];
  return {
    version: 1,
    fusion: "confidence_weighted_v2",
    method_weights: { simulation: 1.0, sjt: 0.85, forced_choice: 0.8, ranking: 0.75, overclaiming: 0.9, cat: 0.95 },
    construct_map: Object.fromEntries(
      constructs.map((c) => [
        c,
        {
          primary_journey: {
            COMM: "J1", EQ: "J1", TEAM: "J2", CONF: "J2", NEGT: "J2",
            DEC: "J3", "BIG5-C": "J3", stress: "J3", Integrity: "J4",
            LRN: "J3", "SS-SELF": "J2", ENT: "J5", OWV: "J5", WST: "J5",
            "ECO-SECTOR": "J6", "ECO-TOOLS": "J6", "ECO-TREND": "J6", "ECO-COMPLIANCE": "J6",
            path_branch: "J5"
          }[c],
          bands: { developing: [0, 0.45], capable: [0.45, 0.72], strong: [0.72, 1.0] },
          clarification_boost_cap: 0.15
        }
      ])
    ),
    validity_interactions: {
      interpret_with_caution: { downweight_methods: ["likert_residual"], force_journey: "J4" },
      integrity_flag: { cap_band: "capable", note: "interpret_with_caution_on_integrity" }
    }
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const allItems = [
  ...expandJ1(),
  ...expandJ2(),
  ...expandJ3(),
  ...expandJ4(),
  ...expandJ5(),
  ...expandJ6()
];

const bank = {
  meta: {
    title: "MBS Clarification Question Bank — User Flow 6",
    phase_id: "7.5",
    user_flow: "User 6 — Fresher / 1st-Year / Intern",
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    total_items: allItems.length,
    items_per_journey: Object.fromEntries(
      Object.keys(JOURNEYS).map((k) => [k, allItems.filter((i) => i.journey === k).length])
    ),
    behaviour_first: true,
    supports: ["randomization", "multiple_attempts", "adaptive_routing", "question_rotation"],
    sources: ["MBS_QBank_User_6.json", "MBS_Intern_Flow_Design_Spec.docx", "MBS_Bias_Reduction_and_Game_Strategy.md"],
    bias_controls: {
      no_work_readiness_likert: true,
      thurstonian_forced_choice: true,
      sim_weight_above_self_report: true,
      validity_band: ["high", "interpret-with-caution"]
    }
  },
  journeys: Object.entries(JOURNEYS).map(([id, j]) => ({
    journey_id: id,
    name: j.name,
    item_ids: allItems.filter((i) => i.journey === id).map((i) => i.item_id)
  })),
  items: allItems,
  simulation_library: SIMULATION_LIBRARY
};

mkdirSync(join(OUT, "..", "..", "..", "docs", "clarification"), { recursive: true });

writeFileSync(join(OUT, "MBS_QBank_User_6_Clarification.json"), JSON.stringify(bank, null, 2));
writeFileSync(join(OUT, "MBS_Clarification_Routing_Matrix.json"), JSON.stringify(buildRoutingMatrix(), null, 2));
writeFileSync(join(OUT, "MBS_Clarification_Scoring_Matrix.json"), JSON.stringify(buildScoringMatrix(), null, 2));
writeFileSync(join(OUT, "MBS_Clarification_Simulation_Library.json"), JSON.stringify(SIMULATION_LIBRARY, null, 2));

console.log(`Generated ${allItems.length} clarification items`);
console.log("Per journey:", bank.meta.items_per_journey);
