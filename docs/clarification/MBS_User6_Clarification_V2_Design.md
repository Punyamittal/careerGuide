# MBS User Flow 6 — Clarification System V2

**Version:** 2.0.0  
**Status:** Production-ready design (QA Critical/High fixes applied)  
**Scope:** Targeted redesign of Critical and High severity findings only; V1 J1/J3–J6 pools retained except J2 replacement  
**Audience:** Fresher graduates, interns, first-year employees (20–25)

---

## Document map (Deliverables A–I)

| ID | Deliverable | Location |
|----|-------------|----------|
| **A** | Clarification Framework V2 | This document §1 |
| **B** | Journey Architecture V2 | This document §2 |
| **C** | Ambiguity Rules U1–U17 | `backend/exports/archive/MBS_Ambiguity_Rules_U1_U17.json` |
| **D** | Missing Question Banks | `backend/exports/archive/MBS_QBank_User_6_Clarification_V2_Supplement.json` |
| **E** | Missing Simulation Specs | `backend/exports/archive/MBS_Clarification_Simulation_Library_V2.json` |
| **F** | Updated Scoring Framework | `backend/exports/archive/MBS_Clarification_Scoring_Matrix_V2.json` |
| **G** | Updated Routing Matrix | `backend/exports/archive/MBS_Clarification_Routing_Matrix_V2.json` |
| **H** | Production Readiness Checklist | This document §9 |
| **I** | Pilot Validation Plan | This document §10 |

**Primary-flow patch (negotiation):** `backend/exports/archive/MBS_QBank_User_6_Negotiation_Primary_Patch.json`  
**User flow integration:** Phase 7.5 added to `backend/exports/archive/MBS_UserFlow_User_6.json`  
**Regenerate supplement:** `node backend/exports/archive/scripts/generate-clarification-v2-supplement.mjs`

---

## A. Clarification Framework V2

### Placement & budget

| Parameter | V1 | V2 | Rationale |
|-----------|----|----|-----------|
| Phase ID | 7.5 (spec only) | **7.5 in UserFlow JSON** | Was not integrated — reports could finalize without clar |
| Duration | 15–25 min | **15–35 min** (3 journeys max 35) | Extended cap when U10/U5+U12 fire |
| Max journeys | 2 | **2 default; 3 extended** | Integrity + negotiation + validity could not co-fire |
| Boost cap | +0.15 | **+0.10** | 6–12 items should not flip hire bands |
| Stop confidence | 0.75 | **0.78 (min 4 items first)** | Premature exit with wide SE |

### Fusion model: `confidence_weighted_v3`

```
conf_new = min(1, conf_old + boost_cap * (1 - conf_old) * evidence_quality)
boost_cap = 0.10
```

| Method | Weight V1 | Weight V2 | Change |
|--------|-----------|-----------|--------|
| simulation telemetry | 1.00 | 1.00 | — |
| micro-CAT | — | 0.95 | **New (J8)** |
| simulation-ref hypothetical | 0.85 (as SJT) | **0.00** | **Blocked** — was inflating DEC/stress without telemetry |
| NEGT Likert | 0.85 (as NEGT) | **0.00** | **Blocked from negotiation** |
| sjt_v2 construct rubric | — | 0.88 | J2-V2 partial credit |

### API (unchanged endpoints, V2 payload extensions)

```
POST /v6/session/{id}/clarify/evaluate   → { fired_rules: [U1..U17], journeys[], accommodation: U15 }
GET  /v6/session/{id}/clarify/next       → { journey_id, items[]|sim_config, exposure_pool }
POST /v6/block/{id}/clarify/response    → ItemResponse + rule_id + exposure_count
POST /v6/session/{id}/clarify/finalize  → ConstructScore fusion v3 + neg_skill_block_flag
```

---

## B. Journey Architecture V2

```
Phase 7 Aptitude → clarify/evaluate (U1-U17) → 1-3 journeys → fusion v3 → Phase 8 Wellness
```

| Journey | Name | Pool | Items/session | New in V2 | Priority |
|---------|------|------|---------------|-----------|----------|
| **J4** | Integrity & Evidence | V1 (30) | 6–12 | U10 force slot | 1 |
| **J2-NEG** | Negotiation & Scope | **NEG-V2 (10)** | 4–8 | **New** | 2 |
| **J1** | Communication & EQ | V1 (35) | 6–12 | U1 binding | 2 |
| **J7** | Learning Agility | **J7-LRN (6)** | 4–6 | **New** | 3 |
| **J2** | Collaboration & Conflict | **J2-V2 (28)** | 6–10 | **Replaces V1 J2** | 3 |
| **J3** | Decision & Stress | V1 (35)* | 6–12 | U17 sim swap | 4 |
| **J8** | Aptitude Micro-Clar | **J8-APT (8)** | 4–6 | **New** | 4 |
| **J5** | Career Path | V1 (32) | 6–12 | U9 Arena sim | 5 |
| **J6** | Domain Readiness | V1 (35) | 6–10 | Expert/Architect sims | 6 |

\*J3 V1 `simulation-ref` items remain in bank but score at weight **0.0** unless sim re-run.

### V1 deprecation

- **Retire:** `CLAR-J2-01` … `CLAR-J2-35` (80% duplicate stems, option-0 pattern)
- **Block:** NEGT-001…008 from negotiation fusion (see Primary Patch)
- **Downgrade:** `question_type: simulation-ref` → hypothetical only

---

## C. Ambiguity Rules U1–U17

Full machine-readable spec: `MBS_Ambiguity_Rules_U1_U17.json`

| Rule | Name | Journey | V2 fix summary |
|------|------|---------|----------------|
| U1 | Cross-method COMM/EQ divergence | J1 | Rule ID logged; sim mandatory |
| U2 | Team sim vs conflict style | J2 | Quantified z-diff |
| U3 | In-tray speed vs quality | J3 | Composite index |
| U4 | Two Doors deliberation paradox | J3 | Clue × time matrix |
| U5 | Integrity vs resume | J4 | Resume AI weight |
| U6 | Values/path ambiguous | J5 | Entropy threshold |
| U7 | Domain vs resume | J6 | Expert Challenge trigger |
| U8 | Trend misalignment | J6 | **New explicit** |
| U9 | Work style triangulation | J5 | **New** — Arena clar |
| U10 | Validity caution | J4 | **Force slot** |
| U11 | Stress split | J3 | stress_split_index formula |
| U12 | Negotiation unknown | J2-NEG | **NEG-SKILL; block NEGT** |
| U13 | Learning agility failure | J7 | **New** — Format Lab |
| U14 | Aptitude split | J8 | **New** — micro-CAT |
| U15 | Accommodation | ALL | **New** — global modifiers |
| U16 | Item exposure ≥3 | ALL | **New** — alternate pools |
| U17 | Sim repetition | J3 | **New** — skip in-tray re-run |

### Multi-trigger & three-journey logic

**Default:** 2 journeys, priority order J4 → J2-NEG → J1 → J7 → J2 → J3 → J8 → J5 → J6

**Extended (3 journeys) when any:**
- U10 (validity caution)
- U5 AND U12 (integrity + negotiation unknown)
- `fired_rules.length >= 4`

**Slot allocation:**
1. Forced journey (U10 → J4, U12 → J2-NEG)
2. Next highest priority unique journey
3. Third unique journey if extended; 60s break before journey 3

**Stop conditions:**
- `conf(target) >= 0.78` AND `items >= 4`
- `se(target) <= 0.12`
- `items >= max_per_journey`
- Never stop before 4 items on first clar attempt

---

## 1. Negotiation Construct (NEG-SKILL)

### Why change needed
Primary `NEGT-*` items measured irritability, cynicism, grudge-holding — **not negotiation**. Bias Strategy §4 requires branching economic sim. U12 was unenforceable.

### What was wrong
- Report labelled "negotiation" from affect Likert
- Clarification sim might never fire if fake-high affect scores
- Scoring matrix mapped `NEGT` to J2

### What is improved

**Construct:** `NEG-SKILL` (replaces NEGT for negotiation dimension only)

| Dimension | Code | Weight | Behavioural indicator |
|-----------|------|--------|----------------------|
| Interest probing | NEG-INT | 0.25 | Questions about priorities/constraints before offers |
| Creative trade-offs | NEG-TRADE | 0.25 | Scope↔date, resource↔quality packages |
| Relationship preservation | NEG-REL | 0.20 | Trust meter maintained; no personal attacks |
| Assertive boundaries | NEG-ASSERT | 0.15 | No unilateral round-1 concede |
| Joint value | NEG-JV | 0.15 | Pareto improvement vs baseline |

**Fusion:** `0.6 × sim_NEG + 0.4 × SJT_NEG`; **block report** if sim missing and post-clar `conf(NEG-SKILL) < 0.55`

**Clarification items:** 10 × `CLAR-NEG-V2-*` in supplement JSON

**Simulation:** `SIM-NEGOTIATION-NPC-V2` — 3 rounds, BATNA reveal on probe

**Telemetry signals:**
`probe_count`, `probe_latency_ms`, `offers[]`, `concessions[]`, `joint_value_score`, `npc_trust_series[]`, `walk_away`, `batna_referenced`, `round_count`

**Report outputs:**
- `negotiation_band` (developing / capable / strong)
- Subscores: interest_probing, creative_trade, relationship, assertiveness, joint_value
- `evidence_sources`: `[sim_rounds, sjt_count]`
- `interpret_with_caution` if U12 fired and sim incomplete

**Expected impact:** Validity **critical fix**; reliability **high** (sim + SJT triangulation); fairness **neutral**

---

## 2. Learning Agility Gap (J7 + U13)

### Why change needed
Only 3 `LRN-FB` tags in J1; Format Lab in primary flow had no clar pathway. LRN mapped to J3 in V1 scoring with zero J3 LRN items.

### What was wrong
Learning agility ambiguity unresolvable; rule-change adaptation never re-tested in clar.

### What is improved

**Journey J7:** Learning Agility Clarification  
**Rule U13:** `format_lab_rule_change_gain < 0.15 OR conf(LRN) < 0.65`

**Items (6):** `CLAR-J7-01` … `CLAR-J7-06` — adaptation, metacognition, deliberate practice, ipsative learning style pair

**Sim:** `SIM-FORMAT-LAB-CLAR`
- 2 formats + rule-change round 3 (speed penalized)
- **Scoring:** `rule_change_gain`, `format_delta`, `LRN-META` from instruction re-read

**Scoring model:**
```
LRN_clar = 0.55 × format_lab_clar_gain + 0.45 × mean(J7_SJT)
Dimensions: LRN-ADAPT (0.35), LRN-META (0.35), LRN-DEL (0.30)
```

**Expected impact:** Validity **high**; reliability **medium** (pilot α target 0.68); fairness **medium** (U15 waives speed penalty)

---

## 3. Aptitude Clarification (J8 + U14)

### Why change needed
CAT vs SS-PS divergence had no clar route; aptitude errors propagated to "problem solving" band.

### What was wrong
No U14; no micro-CAT; confidence could not increase for APT construct.

### What is improved

**Rule U14:** `method_divergence_z(APT, SS-PS) > 1.0 OR cat_theta vs ss_ps z > 1.2`

**Journey J8:** Aptitude Micro-Clarification
- **4–6 items**, 2PL IRT micro-CAT
- **Stop:** SE ≤ 0.35 or max 6 items
- **Prior:** Phase 7 θ imported
- **Pools:** verbal, numerical, abstract (8 anchors in supplement)

**Confidence update:**
```
theta_clar = blend(theta_phase7, theta_micro_cat, w=0.6 clar if U14 fired)
conf(APT)_new = f(se_clar)  // SE-driven, cap boost +0.08
```

**Expected impact:** Validity **high** for g-factor disputes; reliability **medium**; fairness **neutral**

---

## 4. J2 Collaboration & Conflict — V2 Rebuild

### Why change needed
QA: 7 unique stems / 35 items (80% dup); 100% option-0 keys; cartoon distractors; TK on ownership items.

### What was wrong
Coaching vulnerability; construct contamination; inflated reliability from duplicate items.

### What is improved

**28 unique scenarios** (`CLAR-J2-V2-01` … `28`) covering:

| Category | Count | Scoring rubric (not TK unless conflict-tagged) |
|----------|-------|-----------------------------------------------|
| collaboration | 10 | inclusive_facilitation, groupthink_resistance, devils_advocate |
| conflict | 10 | constructive_assertion, collaborative_problem_solve, structured_deescalation |
| ownership | 8 | ownership_initiative, accountability, transparent_ownership |

**Distractor policy:** All four options professionally plausible; partial credit defined (e.g., private DM after meeting = 0.4 on inclusion item)

**Key distribution:** Keys 0–3 balanced across pool (no option-0 pattern)

**Routing:** Category-tagged; conflict → `SIM-CONFLICT-BRANCH`; collaboration → `SIM-TEAM-CHAT-MICRO`

**TK usage:** **Only** on items tagged `category: conflict` with explicit TK branch sim — not on ownership/credit

**Expected impact:** Validity **high**; reliability **high** (true 28-item pool); fairness **medium** (hybrid/inclusion scenarios added)

---

## 5. Bias Review Fixes

| Bias | Problem (V1) | Solution (V2) | Implementation |
|------|--------------|---------------|----------------|
| **Gender** | "Too quiet in meetings" penalizes non-dominant styles; no allyship path | Inclusive facilitation items; allyship option in J2-V2-23; Read-the-Room multiple valid responses | J2-V2-01, J2-V2-23; EQ sim rubric: accept indirect clarification if effect-equivalent |
| **Socioeconomic** | Startup vs enterprise assumes choice; overtime scenarios ignore constraints | J2-V2-16 boundary-with-alternative; J5 adds single-offer path (V1 retained, clar note in routing) | U15 + J2-V2-16; J5 trigger skips binary offer SJT if `single_offer_flag` |
| **Cultural** | Direct confrontation only "correct" | High-context valid paths scored partial (0.7–0.85): written follow-up, facilitated sync, manager-mediated | J2-V2-19, J2-V2-24; scoring partial credit tables in Scoring Matrix V2 |
| **Urban** | GCC/Slack/Jira assumed | J6 `region_gate`: India-specific items gated; `ECO-GLOBAL-2026` fallback pool | Routing Matrix V2 `region_gate` |
| **Neurodiversity** | Latency penalties; timed EQ/stress | **U15:** disable latency penalty, 1.5× time, tap-rank Crisis Commander, Format Lab no speed penalty | Ambiguity Rules U15; sim runtime specs |
| **Accessibility** | Drag-rank, long stems on mobile | Tap-rank mode; stem max 120 words; 60s inter-journey break | Sim Library V2 `runtime_spec.mobile`; three-journey fatigue guard |

**Expected impact:** Fairness **critical improvement** on U15; validity **neutral** (accommodations prevent construct-irrelevant variance)

---

## 6. Missing Simulations (Clarification Versions)

| Sim ID | Purpose | Trigger | Scoring | Key telemetry |
|--------|---------|---------|---------|---------------|
| **SIM-FORMAT-LAB-CLAR** | LRN rule-change | U13 | rule_change_gain | accuracy_by_format, instruction_reread |
| **SIM-WORK-STYLES-ARENA-CLAR** | WST triangulation | U9 | cosine to Arena vector | choice_vector, reversals |
| **SIM-EXPERT-CHALLENGE-CLAR** | Domain + overclaim | U7, U5 | domain_accuracy, fake_familiarity | fake_pool_id (rotated) |
| **SIM-ECOSYSTEM-ARCHITECT-CLAR** | Value-chain literacy | U7 | edge_accuracy | node_placements, hints |
| **SIM-SPOT-THE-BREAK-CLAR** | Problem sensitivity | U17 | hit_rate, false_alarms | time_to_find |
| **SIM-PRESSURE-COOKER-CLAR** | Stress without in-tray repeat | U11+U17 | stress_tolerance, recovery | trace_rmse |
| **SIM-DAY-AS-JOINER-CLAR** | Ownership vs path | U2+U6 | initiative, transparency | path, node latencies |
| **SIM-NEGOTIATION-NPC-V2** | Valid negotiation | U12 | NEG-SKILL composite | probe_count, joint_value |

Full runtime specs: `MBS_Clarification_Simulation_Library_V2.json`

---

## 7. Routing Engine V2

See `MBS_Clarification_Routing_Matrix_V2.json`

**Evaluate algorithm (pseudocode):**
```
rules = evaluate_U1_U17(session_telemetry)
journeys = []
if U10: journeys.append(J4 forced)
if U12: journeys.append(J2-NEG forced)
sort remaining by priority; dedupe construct overlap >50%
if len(rules)>=4 or U10 or (U5 and U12): max_j=3 else max_j=2
for j in candidates: if len(journeys)<max_j: journeys.append(j)
return { rules, journeys, accommodation: U15_active }
```

**Item draw:**
```
pool = v2_supplement if journey in [J2,J2-NEG,J7,J8] else v1_bank
exclude exposure_count>=3 (U16)
exclude last 5 session items
stratify difficulty; balance key positions
```

---

## 8. Psychometric Improvements

### Item exposure control (U16)
- Cross-session counter per `item_id` and `stem_hash`
- Max exposure: **3**; then force alternate pool (J2-V2-A/B, NEG-V2-A/B, fake-set rotation)

### Alternate item pools
| Pool | V2 status |
|------|-----------|
| J2-V2-A/B | B pool = 28 additional scenarios (pilot expansion slot) |
| NEG-V2-A/B | B pool for pilot |
| fake-set-alpha/beta/gamma | Expert Challenge fakes |

### Anti-coaching strategy
- Balanced key distribution enforced at generation
- Absurd distractor rate monitor (<15% selection → flag item)
- `answer_change_count > 3` → downweight SJT 0.85→0.70
- Cohort stem hash monitoring (>2% seen → retire stem)

### Reliability strategy
- J2-V2 target α ≥ 0.75 (pilot)
- NEG-SKILL α ≥ 0.70 (sim + SJT)
- Report **band SE** not point estimate when `items < 8` on construct

### Validity strategy
- Multi-trait multimethod matrix for COMM/EQ/TEAM/CONF/NEG-SKILL
- NEGT block guard in fusion pipeline
- simulation-ref weight 0.0
- Expert panel review of J2-V2/J7/J8 items (sign-off gate)

### Pilot study plan (summary — see §10)
- N ≥ 500 freshers/interns
- Criteria: DIF by gender/language/region; rule fire rates; pre-post SE reduction; coach rating convergence

---

## 9. Production Readiness Checklist (Deliverable H)

### Critical (must pass before production)

- [ ] Apply `MBS_QBank_User_6_Negotiation_Primary_Patch.json` to primary bank loader
- [ ] Fusion pipeline blocks NEGT from negotiation dimension (U12 guard)
- [ ] Retire V1 J2 items at runtime merge
- [ ] Implement `POST /v6/session/{id}/clarify/evaluate` with U1–U17
- [ ] `SIM-NEGOTIATION-NPC-V2` telemetry required for negotiation report
- [ ] simulation-ref items score at weight 0.0

### High (must pass before pilot)

- [ ] Merge V2 supplement bank with V1 at load time
- [ ] J7 Format Lab clar sim wired
- [ ] J8 micro-CAT engine (2PL, stop SE)
- [ ] U15 accommodation intake flag + modifiers
- [ ] U16 exposure counter persisted cross-session
- [ ] U17 in-tray substitution logic
- [ ] Three-journey extended mode + fatigue break
- [ ] Region gate for J6 India-specific items

### Medium (pilot exit criteria)

- [ ] J2-V2-B pool populated (28 additional scenarios)
- [ ] DIF dashboards operational
- [ ] Partial credit scorer for cultural paths
- [ ] Mobile tap-rank for Crisis Commander / Ecosystem Architect

---

## 10. Pilot Validation Plan (Deliverable I)

### Design
- **N:** 500 minimum (250 intern, 250 fresher)
- **Sites:** 2 metro + 1 tier-2 campus (urban/rural fairness)
- **Duration:** 8 weeks

### Hypotheses
1. J2-V2 α ≥ 0.75 vs V1 J2 α < 0.55
2. NEG-SKILL correlates with coach negotiation rating r ≥ 0.35; NEGT affect r ≤ 0.15 with same rating
3. U14 micro-CAT reduces APT SE by ≥ 20% when fired
4. U15 subgroup shows no adverse impact on pass rates vs accommodated latency waiver

### Metrics
| Metric | Target |
|--------|--------|
| Rule fire rate per U1–U17 | 5–25% each (except U15 ~8%) |
| Clarification boost magnitude | Mean ≤ 0.08 |
| J2-V2 key balance | 22–28% per position |
| NEG sim completion | ≥ 95% when U12 fires |
| DIF flagged items | < 5% of pool |

### Analysis plan
- IRT calibration J8 anchors
- Multimethod matrix (sim vs SJT vs CAT)
- ROC for confidence thresholds (0.65 floor, 0.78 stop)
- Cognitive debrief n=30 for J2-V2 distractor realism

### Go/no-go
- **Go:** All Critical checklist + 4/6 High items + α targets met
- **No-go:** NEG-SKILL coach r < 0.25 OR DIF > 10% items OR coaching pattern (key skew > 40% one option)

---

## File index (V2 artifacts)

```
docs/clarification/
  MBS_User6_Clarification_V2_Design.md          ← this document

backend/exports/archive/
  MBS_Ambiguity_Rules_U1_U17.json
  MBS_Clarification_Routing_Matrix_V2.json
  MBS_Clarification_Scoring_Matrix_V2.json
  MBS_Clarification_Simulation_Library_V2.json
  MBS_QBank_User_6_Clarification_V2_Supplement.json
  MBS_QBank_User_6_Negotiation_Primary_Patch.json
  MBS_UserFlow_User_6.json                      ← Phase 7.5 + NEG-S patch refs
  scripts/generate-clarification-v2-supplement.mjs
```

---

## Change log summary

| QA severity | Count addressed | Key artifact |
|-------------|-----------------|--------------|
| Critical | 5 | NEG-SKILL, J2-V2, Phase 7.5, sim-ref block, U12 |
| High | 12 | J7, J8, U13–U17, sims, bias U15, 3-journey, distractors |
| Medium | Partial | Region gate, partial credit paths (pilot) |

**V2 does not regenerate J1, J3–J6 V1 pools** — merge at runtime with supplement and deprecation rules.

---

*End of Clarification System V2 Design*
