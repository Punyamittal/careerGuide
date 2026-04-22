export type InternshipChoice = {
  id: string;
  label: string;
  /** Short educator-style note on what this choice exercises */
  reflection: string;
};

export type InternshipScene = {
  id: string;
  title: string;
  situation: string;
  choices: InternshipChoice[];
};

export type VirtualInternship = {
  slug: string;
  roleTitle: string;
  tagline: string;
  intro: string;
  scenes: InternshipScene[];
  wrapUp: { title: string; bullets: string[] };
};

const sim = (
  slug: string,
  roleTitle: string,
  tagline: string,
  intro: string,
  scenes: InternshipScene[],
  wrapUp: { title: string; bullets: string[] }
): VirtualInternship => ({ slug, roleTitle, tagline, intro, scenes, wrapUp });

export const INTERNSHIP_BY_SLUG: Record<string, VirtualInternship> = {
  "software-engineer": sim(
    "software-engineer",
    "Software Engineer",
    "Ship a small fix under time pressure — safely.",
    "You are paired with a mentor for your first sprint day. The team uses short stand-ups, tickets, and code review. Nothing here grades you; choices show how real trade-offs feel.",
    [
      {
        id: "s1",
        title: "Morning: the ticket",
        situation:
          "Stand-up ends. Your ticket: a button crashes the checkout page on mobile Safari. Logs are noisy; the repro steps are flaky.",
        choices: [
          {
            id: "a",
            label: "Reproduce first in a clean browser profile, then narrow with breakpoints.",
            reflection: "Mirrors disciplined debugging — isolate environment before editing code."
          },
          {
            id: "b",
            label: "Rewrite the whole component so it “can’t break again.”",
            reflection: "Big-bang refactors risk new bugs; good teams prefer smallest safe change."
          },
          {
            id: "c",
            label: "Ask the team to reassign — you are blocked.",
            reflection: "Escalation helps sometimes, but engineers first show a concrete repro attempt."
          }
        ]
      },
      {
        id: "s2",
        title: "Midday: code review",
        situation:
          "Your PR fixes the crash. A reviewer asks for unit tests and questions a magic number you introduced.",
        choices: [
          {
            id: "a",
            label: "Add tests, extract the constant with a clear name, reply in the thread.",
            reflection: "Tests + naming are how teams keep velocity without fear."
          },
          {
            id: "b",
            label: "Merge as-is — the bug is fixed and the deadline is today.",
            reflection: "Short-term speed often creates long-term debt; review exists to catch that."
          },
          {
            id: "c",
            label: "Debate style preferences in chat for an hour.",
            reflection: "Healthy disagreement is fine; scope it and land the fix."
          }
        ]
      },
      {
        id: "s3",
        title: "Afternoon: production",
        situation:
          "After deploy, error rates tick up — unrelated to your change, but you are on support rotation.",
        choices: [
          {
            id: "a",
            label: "Open the incident channel, post impact + timeline, follow the rollback playbook.",
            reflection: "Incident hygiene (communicate, mitigate, learn) is core senior thinking."
          },
          {
            id: "b",
            label: "Silently roll back without telling anyone.",
            reflection: "Stakeholders need visibility during customer-facing issues."
          },
          {
            id: "c",
            label: "Wait to see if it fixes itself.",
            reflection: "Rarely true at scale; active monitoring drives action."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Narrowing bugs before coding",
        "Code review as collaboration, not gatekeeping",
        "Balancing fix size with tests and clarity",
        "Incident response habits"
      ]
    }
  ),

  "data-analyst": sim(
    "data-analyst",
    "Data Analyst",
    "Turn a vague question into a chart your manager trusts.",
    "Stakeholders want “insights” from last quarter’s funnel. You have SQL access and a dashboard tool. The simulation walks clarification → query → sanity checks → storytelling.",
    [
      {
        id: "s1",
        title: "Clarify the ask",
        situation:
          "Your manager says: “Which channel is best?” You have three channel definitions in different spreadsheets.",
        choices: [
          {
            id: "a",
            label: "Ask what “best” means (conversion, cost, volume) and agree on one metric + time window.",
            reflection: "Analysts win by defining success before touching data."
          },
          {
            id: "b",
            label: "Plot everything so they can pick visually.",
            reflection: "Can overwhelm; alignment on a metric saves rework."
          },
          {
            id: "c",
            label: "Answer with whichever channel has the highest clicks.",
            reflection: "Vanity metrics mislead; tie to business outcomes."
          }
        ]
      },
      {
        id: "s2",
        title: "Build the dataset",
        situation: "You join events to campaigns. Row counts look 12% higher than finance’s report.",
        choices: [
          {
            id: "a",
            label: "Compare filters, document definitions, reconcile with finance on one sample day.",
            reflection: "Reconciliation builds trust — the hardest part of analytics."
          },
          {
            id: "b",
            label: "Ship the chart now; differences are normal.",
            reflection: "Silent mismatch erodes credibility in meetings."
          },
          {
            id: "c",
            label: "Delete rows until it matches.",
            reflection: "Never fudge; fix logic or document exclusions transparently."
          }
        ]
      },
      {
        id: "s3",
        title: "Present",
        situation: "Leadership wants a one-slide takeaway for Monday.",
        choices: [
          {
            id: "a",
            label: "One headline, one chart, three caveats in the speaker notes.",
            reflection: "Executives need clarity and honest limits."
          },
          {
            id: "b",
            label: "Paste twelve charts so they see you worked hard.",
            reflection: "Signal-to-noise beats effort display."
          },
          {
            id: "c",
            label: "Let the data speak for itself with no narrative.",
            reflection: "Data rarely speaks alone; context is your job."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Defining metrics with stakeholders",
        "Join logic and reconciliation",
        "Ethical, transparent reporting",
        "Communication under ambiguity"
      ]
    }
  ),

  "ux-designer": sim(
    "ux-designer",
    "UX / Product Designer",
    "Balance user evidence with shipping constraints.",
    "You join a product squad improving onboarding. You’ll see research, ideation, and critique — the emotional core of design work.",
    [
      {
        id: "s1",
        title: "Research snapshot",
        situation:
          "Five user interviews show confusion at step 2, but analytics show most users complete the flow.",
        choices: [
          {
            id: "a",
            label: "Triangulate: watch session replays for step 2, check drop-off by segment.",
            reflection: "Mixing qual + quant is standard; neither alone tells the full story."
          },
          {
            id: "b",
            label: "Ignore interviews — numbers say it works.",
            reflection: "Analytics miss “confused but successful” paths."
          },
          {
            id: "c",
            label: "Redesign entirely based on the loudest quote.",
            reflection: "Representativeness matters before big bets."
          }
        ]
      },
      {
        id: "s2",
        title: "Ideation",
        situation: "Engineering can ship one medium change this sprint.",
        choices: [
          {
            id: "a",
            label: "Prototype the smallest test that validates the hypothesis about step 2.",
            reflection: "Lean experiments reduce waste."
          },
          {
            id: "b",
            label: "Design a full multi-step wizard because it’s more “modern.”",
            reflection: "Scope creep hurts users if not validated."
          },
          {
            id: "c",
            label: "Let engineers pick what is easiest.",
            reflection: "Ease without user value is misaligned UX."
          }
        ]
      },
      {
        id: "s3",
        title: "Critique",
        situation: "A teammate says your copy is unclear; you spent hours on it.",
        choices: [
          {
            id: "a",
            label: "Ask what they misunderstood, run a five-second test with two variants.",
            reflection: "Critique + quick validation improves outcomes."
          },
          {
            id: "b",
            label: "Defend every word — it’s your craft.",
            reflection: "Ego slows iteration; users arbitrate."
          },
          {
            id: "c",
            label: "Change nothing to avoid conflict.",
            reflection: "Design is collaborative; integrate feedback selectively."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Blending qualitative and quantitative insight",
        "Scoping experiments to learning goals",
        "Receiving critique productively"
      ]
    }
  ),

  "people-operations": sim(
    "people-operations",
    "People Operations / HR Partner",
    "Navigate fairness, policy, and a real human moment.",
    "You support a hiring manager and an employee question. HR is part law, part coaching, part operations.",
    [
      {
        id: "s1",
        title: "Hiring",
        situation:
          "A manager wants to “move fast” and skip structured interview questions for a friend referral.",
        choices: [
          {
            id: "a",
            label: "Align on role criteria, use the same rubric for all finalists, document decisions.",
            reflection: "Structured process reduces bias and legal risk."
          },
          {
            id: "b",
            label: "Approve the skip — referrals are faster.",
            reflection: "Fair process matters for culture and compliance."
          },
          {
            id: "c",
            label: "Reject the referral outright.",
            reflection: "Referrals can be great; standard evaluation is the lever."
          }
        ]
      },
      {
        id: "s2",
        title: "Employee concern",
        situation:
          "Someone says they feel excluded in meetings. You do not have full context.",
        choices: [
          {
            id: "a",
            label: "Listen, summarise, offer formal channels, involve appropriate partners, follow up.",
            reflection: "Psychological safety starts with careful triage, not instant solutions."
          },
          {
            id: "b",
            label: "Tell them to toughen up — work is hard.",
            reflection: "Invalidates experience; escalates harm."
          },
          {
            id: "c",
            label: "Promise a specific outcome before investigating.",
            reflection: "Avoid over-committing; gather facts respectfully."
          }
        ]
      },
      {
        id: "s3",
        title: "Policy rollout",
        situation: "Leadership announces a remote-work policy with one week’s notice; managers panic.",
        choices: [
          {
            id: "a",
            label: "Create FAQs, office hours, manager talking points, feedback loop.",
            reflection: "Change management is a core HR skill."
          },
          {
            id: "b",
            label: "Post the PDF and log off.",
            reflection: "People need dialogue and clarity."
          },
          {
            id: "c",
            label: "Delay the policy silently.",
            reflection: "Transparency beats uncertainty; adjust timeline openly if needed."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Fair hiring guardrails",
        "Sensitive conversations",
        "Policy communication and change support"
      ]
    }
  ),

  "operations-technician": sim(
    "operations-technician",
    "Field / Operations Technician",
    "Safety first — then diagnose, fix, document.",
    "You’re dispatched to a site with intermittent equipment faults. Operations roles reward calm procedure and clear handoffs.",
    [
      {
        id: "s1",
        title: "Arrival",
        situation: "The site lead pressures you to skip lockout/tagout to save downtime.",
        choices: [
          {
            id: "a",
            label: "Refuse unsafe work; follow lockout procedure and escalate to supervisor.",
            reflection: "Safety non-negotiables protect life and liability."
          },
          {
            id: "b",
            label: "Skip it just this once — you’ve done it before.",
            reflection: "Normalising shortcuts is how incidents happen."
          },
          {
            id: "c",
            label: "Walk away without explaining.",
            reflection: "Assert boundaries with communication, not abandonment."
          }
        ]
      },
      {
        id: "s2",
        title: "Diagnosis",
        situation: "Symptoms point to two possible subsystems; you have one hour before peak load.",
        choices: [
          {
            id: "a",
            label: "Run the ordered checklist, log readings, swap the most likely failed part if safe.",
            reflection: "Structured troubleshooting beats random swaps."
          },
          {
            id: "b",
            label: "Replace everything that might be wrong.",
            reflection: "Costly and hides root cause."
          },
          {
            id: "c",
            label: "Guess based on intuition alone.",
            reflection: "Intuition starts hypotheses; data confirms."
          }
        ]
      },
      {
        id: "s3",
        title: "Handoff",
        situation: "Night shift arrives; the issue is mitigated but not fully solved.",
        choices: [
          {
            id: "a",
            label: "Written handoff: symptoms, actions, readings, remaining risk, next tests.",
            reflection: "Operations continuity depends on logs."
          },
          {
            id: "b",
            label: "Verbally say “it’s fine.”",
            reflection: "Verbal-only handoffs lose detail."
          },
          {
            id: "c",
            label: "Leave without talking to shift lead.",
            reflection: "Respect the next operator’s situational awareness."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Safety culture under pressure",
        "Methodical fault finding",
        "Documentation and shift handover"
      ]
    }
  ),

  "stream-pcm": sim(
    "stream-pcm",
    "Stream fit — PCM",
    "Experience how PCM strengths show up in a STEM-heavy week.",
    "You imagine a focused week leaning on Math, Physics, and Chemistry — typical of many engineering pathways.",
    [
      {
        id: "s1",
        title: "Problem set",
        situation: "A mechanics problem and a stoichiometry puzzle are both due tomorrow; you’re tired.",
        choices: [
          {
            id: "a",
            label: "Time-box each, attempt hardest parts first, seek one targeted hint per subject.",
            reflection: "Interleaved practice builds exam resilience."
          },
          {
            id: "b",
            label: "Only work the subject you like; skip the other.",
            reflection: "Streams still require breadth until you specialise."
          },
          {
            id: "c",
            label: "Copy answers to finish faster.",
            reflection: "Undermines the self-check this simulation is for."
          }
        ]
      },
      {
        id: "s2",
        title: "Lab",
        situation: "Your result is off by 8% from theory.",
        choices: [
          {
            id: "a",
            label: "Repeat measurement, check apparatus, discuss error sources in the report.",
            reflection: "Error analysis is core scientific thinking."
          },
          {
            id: "b",
            label: "Fake the table to match theory.",
            reflection: "Integrity matters; learn from discrepancy."
          },
          {
            id: "c",
            label: "Ignore because 8% seems fine.",
            reflection: "Ask when tolerance is acceptable vs when to investigate."
          }
        ]
      },
      {
        id: "s3",
        title: "Pathway chat",
        situation: "A relative pushes medicine; you lean toward engineering.",
        choices: [
          {
            id: "a",
            label: "Share evidence of your interests + plan to explore both through projects/opportunities.",
            reflection: "Articulating fit beats arguing labels."
          },
          {
            id: "b",
            label: "Agree outwardly, plan secretly — avoid conflict.",
            reflection: "Long-term, honest alignment reduces stress."
          },
          {
            id: "c",
            label: "Dismiss them — it’s your life only.",
            reflection: "Balance autonomy with respectful conversation."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Managing workload across STEM subjects",
        "Honest lab reasoning",
        "Talking about stream choice with adults"
      ]
    }
  ),

  "stream-pcb": sim(
    "stream-pcb",
    "Stream fit — PCB",
    "Taste how biology-chemistry-physics combine in pre-med style thinking.",
    "You’re juggling life-science depth with exam pressure — a flavour of PCB pathways.",
    [
      {
        id: "s1",
        title: "Reading load",
        situation: "Three chapters across bio and chem clash on the same night.",
        choices: [
          {
            id: "a",
            label: "Skim structure first, note diagrams, teach-back summary in your own words.",
            reflection: "Active recall beats passive highlighting."
          },
          {
            id: "b",
            label: "Read every word linearly until done.",
            reflection: "Often unsustainable; strategic depth wins."
          },
          {
            id: "c",
            label: "Only read the shortest chapter.",
            reflection: "Avoid avoidance; balance time across subjects."
          }
        ]
      },
      {
        id: "s2",
        title: "Ethics prompt",
        situation: "A case study asks how you’d prioritise limited resources.",
        choices: [
          {
            id: "a",
            label: "Weigh transparent criteria, acknowledge trade-offs, seek supervision in real practice.",
            reflection: "Bioethics is reasoning under uncertainty."
          },
          {
            id: "b",
            label: "Choose emotionally whoever seems nicest.",
            reflection: "Fair frameworks exist for hard calls."
          },
          {
            id: "c",
            label: "Avoid answering — it’s hypothetical.",
            reflection: "Engaging hypotheticals builds judgment."
          }
        ]
      },
      {
        id: "s3",
        title: "Exploration",
        situation: "You can join one Saturday activity: hospital shadowing vs research lab tour.",
        choices: [
          {
            id: "a",
            label: "Pick based on which unknown you want to test (patient care vs inquiry).",
            reflection: "Exploration clarifies PCB-related futures."
          },
          {
            id: "b",
            label: "Skip both — rest only.",
            reflection: "Rest matters, but sampling careers reduces drift."
          },
          {
            id: "c",
            label: "Do whichever friend picks.",
            reflection: "Use your own curiosity signal."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Study strategy for dense reading",
        "Ethical reasoning",
        "Sampling career exposures deliberately"
      ]
    }
  ),

  "stream-commerce": sim(
    "stream-commerce",
    "Stream fit — Commerce",
    "Numbers, markets, and decisions — a commerce-flavoured simulation.",
    "You explore how commerce pathways blend numeracy with people and systems thinking.",
    [
      {
        id: "s1",
        title: "Case",
        situation: "A local shop’s costs rose; owners want to cut staff hours first.",
        choices: [
          {
            id: "a",
            label: "Model revenue, variable vs fixed costs, test smaller levers (pricing, waste) before people cuts.",
            reflection: "Commerce is structured problem solving with stakeholders."
          },
          {
            id: "b",
            label: "Cut hours immediately — fastest.",
            reflection: "People impacts ripple; explore alternatives."
          },
          {
            id: "c",
            label: "Ignore numbers; advise from gut.",
            reflection: "Combine judgment with spreadsheets."
          }
        ]
      },
      {
        id: "s2",
        title: "Ethics",
        situation: "You could recommend a tax workaround that is legal but harmful to trust.",
        choices: [
          {
            id: "a",
            label: "Present transparent options with long-term reputation risk called out.",
            reflection: "Professional ethics are part of commerce careers."
          },
          {
            id: "b",
            label: "Maximise short-term savings for the client no matter what.",
            reflection: "Trust and reputation are assets."
          },
          {
            id: "c",
            label: "Refuse to engage without explaining.",
            reflection: "Explain trade-offs clearly."
          }
        ]
      },
      {
        id: "s3",
        title: "Presentation",
        situation: "You must pitch a recommendation to non-finance family members.",
        choices: [
          {
            id: "a",
            label: "Story first, one number per claim, invite questions.",
            reflection: "Translation is a commerce superpower."
          },
          {
            id: "b",
            label: "Show fifty slides of tables.",
            reflection: "Audience-appropriate framing wins."
          },
          {
            id: "c",
            label: "Let them read the appendix alone.",
            reflection: "Guided narrative helps decisions."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Cost reasoning",
        "Ethical client advice",
        "Communicating finance to laypeople"
      ]
    }
  ),

  "stream-humanities": sim(
    "stream-humanities",
    "Stream fit — Humanities",
    "Argument, evidence, and empathy — the humanities muscle.",
    "You practise skills that power law, policy, media, and social research.",
    [
      {
        id: "s1",
        title: "Essay",
        situation: "You disagree strongly with a source text for class.",
        choices: [
          {
            id: "a",
            label: "Steel-man the author, cite evidence, then argue precisely where you diverge.",
            reflection: "Strong humanities writing is fair before it is clever."
          },
          {
            id: "b",
            label: "Attack the author personally.",
            reflection: "Ad hominem weakens academic credibility."
          },
          {
            id: "c",
            label: "Agree with the teacher’s view only.",
            reflection: "Authentic analysis beats pleasing authority."
          }
        ]
      },
      {
        id: "s2",
        title: "Discussion",
        situation: "Peers dominate airtime; quieter students have better points.",
        choices: [
          {
            id: "a",
            label: "Facilitate: summarise, invite round-robin, amplify a quiet voice.",
            reflection: "Humanities classrooms need inclusive dialogue skills."
          },
          {
            id: "b",
            label: "Talk more to win the debate.",
            reflection: "Listening changes outcomes."
          },
          {
            id: "c",
            label: "Stay silent to avoid risk.",
            reflection: "Participation can be prepared and brief."
          }
        ]
      },
      {
        id: "s3",
        title: "Project",
        situation: "Your group project topic overlaps with a real community issue.",
        choices: [
          {
            id: "a",
            label: "Consult guidelines, anonymise stories, prioritise dignity in representation.",
            reflection: "Ethics of representation matters in social research."
          },
          {
            id: "b",
            label: "Use real names for drama.",
            reflection: "Consent and privacy are non-optional."
          },
          {
            id: "c",
            label: "Avoid the topic entirely.",
            reflection: "Engage responsibly rather than ignore."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Fair-minded argumentation",
        "Inclusive discussion leadership",
        "Ethical representation"
      ]
    }
  ),

  "stream-hybrid": sim(
    "stream-hybrid",
    "Stream fit — Hybrid",
    "Blend domains — like many future careers that refuse single labels.",
    "Hybrid paths need translation between disciplines: tech + design, science + business, etc.",
    [
      {
        id: "s1",
        title: "Team",
        situation: "Engineers and designers argue about a feature; both feel unheard.",
        choices: [
          {
            id: "a",
            label: "Restate each side’s constraint in neutral language, propose a cheap experiment.",
            reflection: "Hybrid roles often broker understanding."
          },
          {
            id: "b",
            label: "Pick the engineers — code is truth.",
            reflection: "User value needs both lenses."
          },
          {
            id: "c",
            label: "Avoid the meeting — not your fight.",
            reflection: "Integration is exactly hybrid work."
          }
        ]
      },
      {
        id: "s2",
        title: "Learning plan",
        situation: "You can deepen one skill this month: coding vs visual storytelling.",
        choices: [
          {
            id: "a",
            label: "Choose based on the bottleneck in your current project, track progress weekly.",
            reflection: "Hybrid growth is project-anchored."
          },
          {
            id: "b",
            label: "Do both halfway.",
            reflection: "Depth sometimes beats breadth short-term."
          },
          {
            id: "c",
            label: "Only do what feels easy.",
            reflection: "Stretch deliberately."
          }
        ]
      },
      {
        id: "s3",
        title: "Story",
        situation: "You must explain your hybrid interests to a scholarship panel in two minutes.",
        choices: [
          {
            id: "a",
            label: "One concrete project, your role, what you learned, why the blend matters.",
            reflection: "Specificity convinces faster than labels."
          },
          {
            id: "b",
            label: "List every subject you like.",
            reflection: "Curate for coherence."
          },
          {
            id: "c",
            label: "Mimic a trendy buzzword salad.",
            reflection: "Clarity beats jargon."
          }
        ]
      }
    ],
    {
      title: "What you practised",
      bullets: [
        "Cross-functional facilitation",
        "Choosing learning focus",
        "Narrating an interdisciplinary identity"
      ]
    }
  )
};

/** Resolve slug for simulation: prefer API slug, else infer from title keywords. */
export function resolveInternshipSlug(slug?: string | null, title?: string): string | null {
  if (slug && INTERNSHIP_BY_SLUG[slug]) return slug;
  const t = (title || "").toLowerCase();
  const rules: [RegExp, string][] = [
    [/software|developer|programming|engineer/, "software-engineer"],
    [/\bdata\b|analyst/, "data-analyst"],
    [/ux|design|designer/, "ux-designer"],
    [/hr\b|human resources|people ops|people operations/, "people-operations"],
    [/technician|operations|field\//, "operations-technician"],
    [/pcm|math.*phys|physics.*chem/, "stream-pcm"],
    [/pcb|biology|bio.*chem|medicine|pre-med/, "stream-pcb"],
    [/commerce|business studies|economics/, "stream-commerce"],
    [/humanities|liberal arts/, "stream-humanities"],
    [/hybrid|interdisciplin/, "stream-hybrid"]
  ];
  for (const [re, key] of rules) {
    if (re.test(t) && INTERNSHIP_BY_SLUG[key]) return key;
  }
  return null;
}

export function getInternshipOrNull(slug: string): VirtualInternship | null {
  return INTERNSHIP_BY_SLUG[slug] ?? null;
}
