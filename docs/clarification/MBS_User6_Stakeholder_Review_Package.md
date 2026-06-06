# MBS User Flow 6 — Final Review Package for Management

**Prepared by:** MBS Assessment Lead  
**Date:** 4 June 2026  
**Audience:** Bikram Sir, Product Management, Assessment Science, Engineering Leadership  
**Scope:** Fresher / Intern / First-Year Job Seeker flow (User 6) including Clarification Phase 7.5 V2  
**Purpose:** Stakeholder decision on pilot readiness and production path — not a content generation exercise

---

# Executive Summary

## What was built?

User Flow 6 is a **simulation-first work-readiness assessment** (~165 minutes) for fresh graduates and interns. It measures how candidates behave in realistic workplace scenarios — not how they describe themselves — across communication, collaboration, conflict, negotiation, decision-making, emotional intelligence, learning agility, integrity, stress tolerance, ownership, work values, entrepreneurial orientation, domain literacy, and confirmatory aptitude.

The assessment comprises:

| Layer | Description | Artifact status |
|-------|-------------|-----------------|
| **Primary flow** | 10 phases (0–8 + S3 router): intake, workday sims, construct blocks, ecosystem/domain, aptitude, wellness | Spec + question bank complete (`MBS_UserFlow_User_6.json`, `MBS_QBank_User_6.json`) |
| **Clarification Phase 7.5** | Adaptive 15–35 min phase after aptitude; resolves score ambiguity before report finalization | Framework V2 complete; V1 bank (202 items) + V2 supplement (52 items) |
| **Governance** | Bias strategy, routing (U1–U17), scoring fusion v3, simulation library | V2 matrices and rules in `backend/exports/archive/` |

Total content inventory: **~149 primary-flow items** + **254 clarification items** (202 V1 + 52 V2, with V1 J2 retirement on merge) + **20+ simulation specifications**.

## What problems were fixed?

An independent QA review (June 2026) identified Critical and High severity gaps. Clarification V2 and primary-flow patches address:

1. **Invalid negotiation measurement** — Primary bank used negative-affect Likert (`NEGT-*`) instead of behavioural negotiation. V2 introduces `NEG-SKILL` construct, negotiation sim V2, and blocks affect items from the negotiation report (U12).
2. **Clarification J2 quality failure** — 80% duplicate stems and coachable answer patterns. V2 replaces with 28 unique, rubric-scored scenarios.
3. **Missing clarification pathways** — Learning agility (J7/Format Lab), aptitude micro-CAT (J8/U14), and six additional clarification simulations now specified.
4. **Routing and confidence weaknesses** — U1–U17 ambiguity rules, three-journey extended mode, exposure control, accommodation (U15), and fusion v3 with reduced boost cap (+0.10).
5. **Phase 7.5 integration** — Clarification phase now documented in User Flow JSON (previously spec-only).

## What still needs validation?

| Area | Validation required |
|------|---------------------|
| Psychometric | Pilot N≥500: reliability (α), IRT calibration, DIF, coach-rating convergence |
| Negotiation construct | Confirm NEG-SKILL correlates with behavioural criteria; NEGT affect does not |
| Engineering | Clarification API, bank merge loader, sim telemetry pipeline — **not yet in production codebase** |
| Primary bank patch | `NEGT-*` retirement must be applied in live bank loader (patch spec exists; Archive 2 QBank not yet updated) |
| Simulations | Several clar sims are design-complete; runtime build status varies in CareerGUIDE platform |

## Is User Flow 6 ready for pilot?

**Conditional yes — Amber.**

Content and design are sufficient to begin a **controlled pilot** once Phase 2 engineering integration completes (clarification router, bank merge, negotiation patch, core sim telemetry). Pilot should not start on content alone.

**Recommended:** Pilot entry after Engineering exit criteria for Phase 2 (see §6).

## Is User Flow 6 ready for production?

**No — Red.**

Production requires pilot calibration, DIF review, engineering hardening, and sign-off on Critical risk mitigations (negotiation fusion guard, J2-V2 live merge, validity band enforcement). Estimated minimum: **12–16 weeks** from engineering start to production launch if resourced.

---

# 1. Traceability Audit

*Maps original MBS Concept Note / Intern Flow / Bias Strategy requirements to implementation.*

| Original MBS Requirement | Where Implemented | Status |
|--------------------------|-------------------|--------|
| **Behaviour-first assessment** (~85% sim/SJT/game; no work-readiness Likert) | User Flow 6 phases 1–7; Bias Strategy §3 User 6; delivery field in `MBS_UserFlow_User_6.json` | **Green** — Design aligned; wellness only self-report |
| **Bias reduction** (forced-choice, SJTs, telemetry, validity band) | `MBS_Bias_Reduction_and_Game_Strategy.md`; flow `bias_controls`; Clarification U10/U15/U16 | **Amber** — U15 accommodation designed; DIF monitoring pending pilot |
| **Triangulation** (≥2 methods per important trait) | Primary sims + SJTs; Clarification Phase 7.5; Scoring Matrix V2 method weights | **Amber** — Strong for most constructs; negotiation was broken (now patched in spec) |
| **Confidence scoring** (fusion by confidence, not naive mean) | Scoring Matrix V1/V2 `confidence_weighted_v3`; validity band on report | **Amber** — Algorithm specified; thresholds need pilot calibration |
| **Negotiation** (branching economic sim, not self-report) | Primary: `NEG-S-001/002` + `SIM-NEGOTIATION-NPC-V2` in UserFlow patch; Clar: J2-NEG (10 items); U12 | **Amber** — V2 design fixes invalid NEGT; **Archive 2 QBank still has NEGT Likert until patch applied** |
| **Learning agility** (Format Lab performance) | Primary Phase 5: LRND-001–008 + Format Lab; Clar J7 + `SIM-FORMAT-LAB-CLAR`; U13 | **Amber** — Clar pathway new in V2; Format Lab clar sim not in live app |
| **Communication** (tone SJT, not Likert) | Phase 2: COMM-001–010; Clar J1 (35 items); Read-the-Room sim | **Green** — Adequate coverage; clar pool has known V1 duplication (acceptable with J1 only) |
| **Teamwork** (team-chat sim) | Phase 3: TEAM-001–008 + Team Chat sim; Clar J2-V2 (28 unique items) | **Green** — V2 fixes J1 clar weakness |
| **Conflict** (SJT + branching) | Phase 3: CONF-001–008 + Conflict Branch; Clar J2-V2 conflict rubrics | **Green** — TK scoring restricted to conflict-tagged items in V2 |
| **Decision making** (Two Doors, in-tray, crisis) | Phase 1 + 4: M4, DEC-001–008, K9, M20; Clar J3 + U3/U4/U11/U17 | **Green** — U17 prevents duplicate in-tray fatigue |
| **Integrity** (Honest Dice, over-claiming) | Phase 5 Honest Dice; Phase E ECO-D02; Clar J4 (30 items); U5/U10 | **Green** — Strongest-aligned journey; fake concept rotation in V2 |
| **Work values** (Trade-off Island, revealed preference) | Phase 6: OWV-001–006 + Trade-off Island; Clar J5; U6 | **Green** — Entropy rule specified in V2 |
| **Entrepreneurial orientation** | Phase 5: ENT-001–006; Clar J5; path_branch in report | **Green** — Adequate |
| **Domain readiness** (applied, not self-rated) | Phase E: ECO-* blocks + K2/K3 games; Clar J6; U7/U8 | **Amber** — India-specific items need region gate at runtime |
| **Aptitude** (short confirmatory CAT) | Phase 7: I-* tasks; Clar J8 micro-CAT; U14 | **Amber** — Clar pathway new; micro-CAT engine not built |
| **Wellness separation** (clinical self-report last; never resolves work-readiness) | Phase 8 after Phase 7.5; Bias Strategy §6 exception | **Green** — Phase order enforced in User Flow JSON |

**Traceability summary:** 8 Green · 8 Amber · 0 Red at design level. Amber items depend on engineering integration and pilot validation.

---

# 2. User Flow 6 Journey Map

## End-to-end flow (visual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER FLOW 6 — FRESHER / INTERN / FIRST-YEAR     Total budget: ~165 min     │
└─────────────────────────────────────────────────────────────────────────────┘

 PHASE 0          PHASE 1                 PHASE 2              PHASE 3
 Intake           Workday Sim             Comm & EQ              Collab / Conflict / Negotiation
 ~10 min          ~25 min                 ~20 min                ~30 min
 ─────────        ─────────               ─────────              ─────────
 • Consent (4)    • In-tray (M4)          • COMM SJT (10)        • Team SJT (8) + Team Chat sim
 • Resume upload  • Day-as-joiner (6)     • EQ affect (8)        • Conflict SJT (8) + Conflict Branch
                  Constructs:             Constructs:            • Negotiation sim + anchors (2)
                  BIG5-C, DEC,            COMM-*, EQ-*           Constructs: TEAM-*, CONF-*,
                  stress, SS-SELF                                  NEG-SKILL (V2)
       │                  │                      │                        │
       └──────────────────┴──────────────────────┴────────────────────────┘
                                          │
 PHASE 4                    PHASE 5                    PHASE 6
 Decision & Stress          Ownership / LRN / Integ      Work Orientation + Ecosystem
 ~25 min                    ~25 min                      ~35 min
 ─────────                  ─────────                    ─────────
 • Two Doors (8)            • Format Lab + LRND (8)      • Work Styles Arena (8)
 • Spot the Break (M20)     • Ownership SJT (8)          • Trade-off Island (6)
 • Crisis Commander (K9)    • Honest Dice                • Work context (6)
 Constructs: DEC-*,         • Entrepreneur (6)           • ECO sector/trend/practice/
 stress                     Constructs: LRN-*,            tools/compliance/domain
                            SS-SELF, Integrity, ENT      • K2 Market Mover, K3 Architect
                                          │
 PHASE 7                    PHASE 7.5 ★ CLARIFICATION     PHASE 8
 Aptitude (CAT)             Adaptive (V2)                  Wellness
 ~15 min                    15–35 min (0 if no flags)     ~10 min
 ─────────                  ─────────                      ─────────
 • Numerical (2–6)          Triggers: U1–U17              • PHQ/GAD screener (6)
 • Verbal (6)               Journeys (max 2–3):           Self-report ONLY
 • Abstract (6)             J4 Integrity | J2-NEG Neg      Distress → counsellor
 Constructs: I-NUM,         J1 Comm/EQ | J7 LRN          Constructs: wellness flags
 I-VERB, I-ABS              J2 Collab | J3 Decision
                            J8 Aptitude | J5 Career | J6 Domain
                            Output: fusion v3 + confidence bands
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  REPORT OUTPUT        │
                              │  Work-readiness       │
                              │  scorecard + validity │
                              │  band + 30-60-90 plan │
                              │  + job/intrapreneur   │
                              │  signal + domain fit  │
                              └───────────────────────┘
```

## Phase summary table

| Phase | Duration | Key simulations | Question banks | Clarification triggers (examples) | Output constructs |
|-------|----------|-----------------|----------------|-----------------------------------|-------------------|
| **0** Intake | ~10 min | — | Q0-001–004; resume | — | DEMO-*, routing tags |
| **1** Workday | ~25 min | In-tray (M4), Day-as-joiner | SC-001–006 SJT | U3, U11, U17 (if re-run) | BIG5-C, DEC-RAT, stress, SS-SELF |
| **2** Comm & EQ | ~20 min | Read-the-Room | COMM-001–010, EQD-001–008 | U1 | COMM-*, EQ-* |
| **3** Team / Conflict / Neg | ~30 min | Team Chat, Conflict Branch, Negotiation NPC V2 | TEAM, CONF, NEG-S anchors | U2, U12 | TEAM-*, CONF-*, **NEG-SKILL** |
| **4** Decision | ~25 min | Two Doors, Spot the Break, Crisis Commander | DEC-001–008 | U3, U4, U11 | DEC-*, stress |
| **5** Ownership / LRN / Integrity | ~25 min | Format Lab, Honest Dice | LRND, SS, ENT | U5, U13 | LRN-*, SS-SELF, Integrity, ENT |
| **6** Fit & Ecosystem | ~35 min | Work Styles Arena, Trade-off Island, Market Mover, Ecosystem Architect | WST, OWV, OWC, ECO-* | U6, U7, U8, U9 | OWV-*, WST-*, ECO-*, path_branch |
| **7** Aptitude | ~15 min | CAT items | I-070, I-007, I-008, etc. | U14 | I-NUM, I-VERB, I-ABS |
| **7.5** Clarification | 0–35 min | Up to 3 clar sims per session | V1 (202) + V2 (52) merged | U1–U17 router | Refines low-confidence constructs |
| **8** Wellness | ~10 min | — | W-001–006 | Never for work-readiness | Wellness flags only |

---

# 3. Clarification Summary (Management Brief)

## Why clarification exists

Primary assessment produces **multi-method evidence** (simulations, SJTs, games, CAT). Methods sometimes disagree — e.g., strong communication SJT but weak emotion-reading, or fast in-tray but wrong priorities. Finalizing a report without resolving these splits would mislabel candidates and undermine employer trust.

Clarification Phase 7.5 runs **after aptitude, before wellness**, adding targeted evidence only where confidence is low or ambiguity rules fire.

## What ambiguities it resolves

| Rule family | Example ambiguity | Resolution |
|-------------|-------------------|--------------|
| Cross-method (U1, U2, U14) | COMM high / EQ low | J1 items + Read-the-Room |
| Validity (U5, U10) | Over-claiming, careless responding | J4 Integrity + Honest Dice |
| Negotiation (U12) | No sim telemetry / invalid NEGT | J2-NEG + Negotiation sim V2 |
| Learning (U13) | Format Lab rule-change failure | J7 + Format Lab clar |
| Stress/decision (U3, U4, U11) | Speed vs quality; stress split | J3 + conditional sim swap (U17) |
| Career/domain (U6–U9) | Values flat; domain vs resume | J5/J6 + clar sims |

**17 ambiguity rules (U1–U17)** including accommodation (U15) and item exposure (U16).

## How many journeys exist

| Version | Journeys | Items in pool |
|---------|----------|---------------|
| V1 | 6 (J1–J6) | 202 |
| V2 (adds/replaces) | 9 routable paths (J1–J8 + J2-NEG) | 254 merged (V1 J2 retired) |

Per session: **0–3 journeys**, **4–12 items each**, plus **0–2 clarification simulations**.

## How routing works

1. **Evaluate** session telemetry against U1–U17 after Phase 7.
2. **Prioritize** journeys: Integrity (J4) → Negotiation (J2-NEG) → Comm (J1) → Learning (J7) → Team/Conflict (J2) → Decision (J3) → Aptitude (J8) → Career (J5) → Domain (J6).
3. **Allocate** 2 journey slots (3 if validity + integrity/negotiation or ≥4 rules fire).
4. **Draw** items with exposure control (max 3 lifetime exposures), difficulty balance, randomized option order.
5. **Re-fuse** scores with confidence_weighted_v3 (boost cap +0.10).
6. **Stop** when confidence ≥0.78 or max items reached (minimum 4 items before early stop).

## Estimated candidate impact

| Metric | Estimate |
|--------|----------|
| Candidates receiving any clarification | **35–45%** (based on 0.65 confidence floor) |
| Candidates receiving 2+ journeys | **12–18%** |
| Candidates receiving 3 journeys (extended) | **3–5%** |
| Additional time (when clar fires) | **+15–35 min** (mean ~22 min) |
| Candidates with zero clar | **55–65%** (high-confidence primary path) |
| Report band changes post-clar | **8–12%** (design estimate; pilot will calibrate) |

Clarification is **candidate-protective**: it reduces false precision on borderline scores rather than adding punishment items.

---

# 4. Readiness Assessment

| Area | Rating | Rationale |
|------|--------|-----------|
| **Content** | **Amber** | Primary bank (~149 items) and clarification V1+V2 complete in archive. J2-V2, negotiation, J7, J8 are design-ready. Archive 2 primary QBank still contains retired NEGT items. J1/J3–J6 clar V1 pools have acceptable but not ideal duplication. |
| **Psychometrics** | **Amber** | Framework sound (triangulation, fusion v3, U1–U17). No pilot data yet — reliability targets, IRT parameters, threshold calibration, and DIF analysis pending. QA identified and V2 addressed design flaws; empirical validation outstanding. |
| **Simulations** | **Amber** | 12 V1 + 8 V2 clar sim specs complete. Core platform has MBS modules (M4, K9, etc.) but clarification micro-sims (Format Lab clar, Expert Challenge clar, etc.) are **spec-only** in CareerGUIDE repo. |
| **Routing** | **Amber** | Routing Matrix V2 + U1–U17 JSON complete and Phase 7.5 in User Flow. **No runtime router implemented** in backend/frontend. |
| **Scoring** | **Amber** | Scoring Matrix V2 defines fusion v3, NEG-SKILL dimensions, partial credit rubrics. Scoring engine integration and NEGT block guard **not deployed**. |
| **Bias controls** | **Amber** | Bias Strategy fully reflected in design; U15 accommodation, U16 exposure, region gate specified. Empirical fairness evidence requires pilot DIF. Some V1 stems retain corporate/urban framing. |
| **Accessibility** | **Amber** | U15 modifiers designed (extended time, tap-rank, latency waiver). Intake accommodation flag and mobile UX for timed sims **not built**. |
| **Engineering readiness** | **Red** | Clarification APIs (`/clarify/evaluate`, `/next`, `/finalize`), bank merge loader, exposure counter, and sim telemetry pipeline exist only in specification. Primary assessment partially exists in platform; User 6 end-to-end path not wired. |

**Overall readiness:** **Amber for pilot planning · Red for production**

---

# 5. Remaining Risks

| Severity | Risk | Impact | Mitigation |
|----------|------|--------|------------|
| **Critical** | Negotiation NEGT Likert still in Archive 2 QBank if patch not applied at load time | Invalid "negotiation" scores; legal/reputational risk with employers | Enforce `MBS_QBank_User_6_Negotiation_Primary_Patch.json` in loader; U12 block on report; QA gate before pilot |
| **Critical** | Clarification engine not implemented in production codebase | Phase 7.5 non-functional; confidence bands meaningless | Phase 2 engineering (see roadmap); block report finalize until router live or clar skipped with flag |
| **High** | No pilot empirical data (reliability, DIF, threshold validity) | Mis-calibrated bands; potential adverse impact | 500+ candidate pilot with pre-specified go/no-go (Design doc §10) |
| **High** | Clarification sims spec-only (8 V2 sims) | Rules U13, U17, U9 fire but cannot resolve ambiguity | Prioritize Format Lab clar, Negotiation V2, Expert Challenge clar for Phase 2 build |
| **High** | Session fatigue (~165 min + up to 35 min clar) | Dropout, careless responding, validity flags | Monitor attrition by phase; 60s break before 3rd journey; consider split session for pilot |
| **Medium** | V1 clarification pools (J1, J3–J6) retain template duplication | Coaching over repeated attempts | U16 exposure control; V2 merge retires worst offenders (J2); expand J1 post-pilot if needed |
| **Medium** | India-specific domain items without region gate in live app | Unfair disadvantage for non-India cohorts | Implement `region_gate` from Routing V2 before multi-region pilot |
| **Medium** | AI scoring variance (Market Mover rationale, open items) | Inconsistent construct scores | Keyed scoring primary; AI as supplementary with inter-rater calibration sample |
| **Low** | Tool/trend content aging (2026 → 2027) | Domain items become stale | Annual ECO pool review; Trend Radar rotation schedule |
| **Low** | J2-V2-B alternate pool not yet authored | Exposure limits exhaust pool over high-volume retakes | Author 28-item B pool during pilot Phase 1 freeze extension |

---

# 6. Implementation Roadmap

## Phase 1: Content freeze

| | |
|--|--|
| **Deliverables** | Apply negotiation primary patch to QBank; merge V2 supplement spec; retire CLAR-J2-01..35; sign-off J2-V2 + NEG-V2 items; region gate copy for ECO items |
| **Owner** | Assessment Science + Content Lead |
| **Entry criteria** | V2 design approved by stakeholders (this review) |
| **Exit criteria** | Single authoritative bank manifest; no open Critical content defects; Archive 2 QBank updated OR loader patch documented |

## Phase 2: Engineering integration

| | |
|--|--|
| **Deliverables** | Clarification router (U1–U17); bank merge loader; fusion v3 scoring; exposure counter; NEGT block guard; Phase 7.5 in session state machine; Negotiation sim V2 + Format Lab clar + Honest Dice telemetry |
| **Owner** | Engineering Lead + Backend + Frontend |
| **Entry criteria** | Phase 1 exit; API contract frozen from V2 design doc |
| **Exit criteria** | End-to-end session completes Phase 0–8 with clar on synthetic ambiguity profiles; telemetry logged; report shows validity band |

## Phase 3: Internal QA

| | |
|--|--|
| **Deliverables** | Test matrix for all U1–U17 paths; accessibility U15 path; mobile tap-rank; load test 100 concurrent sessions |
| **Owner** | QA + Assessment Science |
| **Entry criteria** | Phase 2 exit |
| **Exit criteria** | Zero open Critical/High bugs; all U-rules fire correctly on test profiles; accommodation path verified |

## Phase 4: Pilot (500+ candidates)

| | |
|--|--|
| **Deliverables** | 500+ completions (250 intern, 250 fresher); 2 metro + 1 tier-2 site; coach rating subset n≥100; attrition/fatigue report |
| **Owner** | Product + Assessment Science + Partner institutions |
| **Entry criteria** | Phase 3 exit; ethics/consent; counsellor pathway for Phase 8 flags |
| **Exit criteria** | α targets met (J2-V2 ≥0.75); NEG-SKILL coach r≥0.35; DIF flagged items <5%; go/no-go decision recorded |

## Phase 5: Calibration

| | |
|--|--|
| **Deliverables** | Threshold adjustment (0.65 floor, 0.78 stop); IRT item params for J8; boost cap confirmation; employer norm tables by sector |
| **Owner** | Assessment Science |
| **Entry criteria** | Phase 4 exit with go decision |
| **Exit criteria** | Scoring Matrix V2.1 published; band cut scores approved; adverse impact review complete |

## Phase 6: Production launch

| | |
|--|--|
| **Deliverables** | Production deployment; employer report template; ops runbook; item retirement pipeline; monitoring dashboard (DIF, attrition, rule fire rates) |
| **Owner** | Product + Engineering + Ops |
| **Entry criteria** | Phase 5 exit; stakeholder sign-off (Bikram Sir / PM / Assessment / Eng) |
| **Exit criteria** | 30-day production stability; no Critical incidents; validity band displayed on 100% reports |

**Indicative timeline (from Phase 1 start):** Phase 1–2: 4–6 weeks · Phase 3: 2 weeks · Phase 4: 8 weeks · Phase 5: 4 weeks · Phase 6: 2 weeks → **~20–22 weeks to production**

---

# 7. Stakeholder Decision Points

| Decision | Recommendation | Needed from |
|----------|----------------|-------------|
| Approve pilot scope (500+ candidates) | **Yes**, after Phase 2 | Bikram Sir / Product |
| Authorize engineering sprint for Clarification Phase 7.5 | **Yes — prerequisite for pilot** | Engineering Lead |
| Accept Amber content for pilot (not waiting for J1/J3 V2 expansion) | **Yes** — V2 fixes Critical paths only | Assessment Science |
| Production launch without pilot | **No** | All |
| Multi-region launch before region gate | **No** | Product |

---

# Appendix: Key artifact index

| Artifact | Path |
|----------|------|
| User Flow 6 | `backend/exports/archive/MBS_UserFlow_User_6.json` |
| Primary question bank | `backend/exports/archive/Archive 2/MBS_QBank_User_6.json` |
| Clarification V1 bank | `backend/exports/archive/MBS_QBank_User_6_Clarification.json` |
| Clarification V2 supplement | `backend/exports/archive/MBS_QBank_User_6_Clarification_V2_Supplement.json` |
| Clarification V2 design | `docs/clarification/MBS_User6_Clarification_V2_Design.md` |
| Ambiguity rules U1–U17 | `backend/exports/archive/MBS_Ambiguity_Rules_U1_U17.json` |
| Routing Matrix V2 | `backend/exports/archive/MBS_Clarification_Routing_Matrix_V2.json` |
| Scoring Matrix V2 | `backend/exports/archive/MBS_Clarification_Scoring_Matrix_V2.json` |
| Simulation Library V2 | `backend/exports/archive/MBS_Clarification_Simulation_Library_V2.json` |
| Negotiation primary patch | `backend/exports/archive/MBS_QBank_User_6_Negotiation_Primary_Patch.json` |
| Bias Reduction Strategy | `backend/exports/archive/Archive 2/MBS_Bias_Reduction_and_Game_Strategy.md` |

---

*End of Final Review Package — User Flow 6*
