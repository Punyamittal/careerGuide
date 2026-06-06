# User Flow 6 + Clarification Phase 7.5 — Engineering Implementation Plan

**Role:** Engineering Lead  
**Date:** 4 June 2026  
**Design status:** Frozen (V2 assessment spec — no design changes)  
**Platform baseline:** CareerGUIDE Express API + Supabase + Next.js Phaser assessment engine  
**References:** Stakeholder Review Package, Clarification V2 Design, Routing/Scoring/Simulation V2 JSON, `MBS_UserFlow_User_6.json`

---

## Platform gap summary

| Capability | Today | Required for pilot |
|------------|-------|-------------------|
| Multi-phase User 6 orchestrator | **None** (archive JSON only) | Phase state machine 0→7.5→8 |
| Per-module assessment sessions | **Live** (`assessment_sessions`, telemetry, rule scoring) | Reuse for blocks |
| Clarification router U1–U17 | **None** | New subsystem |
| Clarification bank merge (V1+V2) | **None** (JSON in `backend/exports/archive/`) | Runtime loader + deprecation rules |
| Fusion v3 + validity band | Partial (`learner_mbs_profile`, basic confidence in reports) | Construct-level confidence + U12 guard |
| User 6 sims (M4 in-tray, negotiation V2, Format Lab clar, etc.) | Partial (SS02/SS03 branching; M4 is Herzberg likert in registry — **not** in-tray sim) | New/adapted Phaser scenes |
| School-track flow | **Live** (`test.service`, Supabase `questions`) | Separate — do not conflate |

**Key architectural decision:** Introduce a **`user_flow_sessions`** orchestrator layer above existing **`assessment_sessions`** (one flow session → many module/block sessions → clarification extension).

---

## 1. Engineering Backlog

Effort scale: **S** = 1–2 days · **M** = 3–5 days · **L** = 6–10 days · **XL** = 2–3 weeks

### 1.1 Foundation (prerequisite for clarification)

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-001** | Migration `014_user_flow_sessions.sql`: flow session, phase state, construct snapshot | P0 | — | M | Backend |
| **ENG-002** | Load frozen assets at boot: User Flow JSON, QBank V1, Clarification V1+V2 supplement, Routing/Scoring/Rules/Sim V2 JSON | P0 | ENG-001 | M | Backend |
| **ENG-003** | `UserFlowOrchestrator`: advance phase 0→7, persist block completion, aggregate construct scores from module sessions | P0 | ENG-001, ENG-002 | L | Backend |
| **ENG-004** | Register User 6 flow in API: `POST /v6/flows/user-6/sessions`, `GET .../state`, `POST .../phases/:phase/complete` | P0 | ENG-003 | M | Backend |
| **ENG-005** | Frontend User 6 flow shell: phase progress, block router to AssessmentShell / SJT UI / sim launcher | P0 | ENG-004 | L | Frontend |
| **ENG-006** | Apply negotiation primary patch in bank loader: block `NEGT-*` fusion; serve `NEG-S-001/002` + sim reference | P0 | ENG-002 | S | Backend |

### 1.2 Clarification Router & Rule Engine

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-101** | `ClarificationRuleEngine`: load `MBS_Ambiguity_Rules_U1_U17.json`, evaluate rules against construct snapshot + telemetry | P0 | ENG-003, ENG-002 | L | Backend |
| **ENG-102** | Implement rule evaluators U1–U12 (cross-method, validity, negotiation, stress split, domain) | P0 | ENG-101 | L | Backend |
| **ENG-103** | Implement U13–U17 (LRN, APT, accommodation, exposure, sim repetition) | P0 | ENG-101, ENG-201 | M | Backend |
| **ENG-104** | `ClarificationRouter`: journey priority, 2 vs 3 slot allocation, dedupe construct overlap | P0 | ENG-101 | M | Backend |
| **ENG-105** | `POST /v6/session/{id}/clarify/evaluate` → `{ fired_rules, journeys[], accommodation }` | P0 | ENG-104 | S | Backend |
| **ENG-106** | Phase 7.5 gate: block Phase 8 until clar evaluated (or explicit skip flag with audit) | P0 | ENG-105 | S | Backend |

### 1.3 Journey Loader & Question Bank

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-201** | `ClarificationBankLoader`: merge V1 + V2 supplement; deprecate `CLAR-J2-01..35` | P0 | ENG-002 | M | Backend |
| **ENG-202** | Stratified item draw: difficulty balance, key distribution, `exclude_recent_session=5` | P0 | ENG-201 | M | Backend |
| **ENG-203** | Exposure counter (U16): `clarification_item_exposure` table + draw exclusion | P0 | ENG-201, ENG-001 | M | Backend |
| **ENG-204** | Region gate for J6 ECO items (`region_gate` from Routing V2) | P1 | ENG-201 | S | Backend |
| **ENG-205** | `GET /v6/session/{id}/clarify/next` → items[] or sim_config | P0 | ENG-104, ENG-202 | M | Backend |
| **ENG-206** | `POST /v6/block/{id}/clarify/response` + telemetry (latency, answer changes) | P0 | ENG-205 | M | Backend |

### 1.4 Scoring Fusion V3

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-301** | `FusionV3Service`: confidence_weighted_v3 formula, boost cap 0.10, method weights from Scoring V2 | P0 | ENG-003 | L | Backend |
| **ENG-302** | J2-V2 construct-specific rubrics + partial credit scorer | P0 | ENG-206, ENG-201 | M | Backend |
| **ENG-303** | NEG-SKILL dimension scorer (sim 0.6 + SJT 0.4); U12 block guard | P0 | ENG-401, ENG-301 | M | Backend |
| **ENG-304** | Set `simulation_ref` hypothetical weight = 0.0 in fusion | P0 | ENG-301 | S | Backend |
| **ENG-305** | `POST /v6/session/{id}/clarify/finalize` → updated construct scores + confidence | P0 | ENG-301 | M | Backend |
| **ENG-306** | Per-construct confidence + SE; stop journey when conf≥0.78 and items≥4 | P0 | ENG-301, ENG-205 | M | Backend |

### 1.5 Negotiation V2

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-401** | Phaser branching scene `SIM-NEGOTIATION-NPC-V2` (3 rounds, probe/trust telemetry) | P0 | ENG-005 | XL | Frontend + Assessment |
| **ENG-402** | Backend sim scorer: NEG-INT/TRADE/REL/ASSERT/JV from telemetry payload | P0 | ENG-401 | M | Backend |
| **ENG-403** | Wire J2-NEG journey: 4–8 SJT items + mandatory sim when U12 | P0 | ENG-205, ENG-401 | M | Full-stack |
| **ENG-404** | Report guard: withhold `negotiation_band` if sim telemetry missing post-clar | P0 | ENG-303, ENG-501 | S | Backend |

### 1.6 Format Lab Clarification (J7 / U13)

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-501** | Phaser `SIM-FORMAT-LAB-CLAR`: 2 formats + rule-change round, format accuracy telemetry | P0 | ENG-005 | L | Frontend |
| **ENG-502** | LRN scorer: `rule_change_gain`, `format_delta`, J7 SJT blend (0.55/0.45) | P0 | ENG-501, ENG-301 | M | Backend |
| **ENG-503** | U13 trigger from primary Format Lab telemetry (or skip if primary not run) | P1 | ENG-101, primary Format Lab | S | Backend |

### 1.7 Aptitude Clarification (J8 / U14)

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-601** | Micro-CAT engine: 2PL IRT, prior from Phase 7 θ, stop SE≤0.35, max 6 items | P0 | ENG-201, ENG-003 | L | Backend |
| **ENG-602** | J8 item pool loader from V2 supplement (`CLAR-J8-*`) | P0 | ENG-201 | S | Backend |
| **ENG-603** | Frontend CAT item UI (reuse aptitude item component from school track if possible) | P0 | ENG-601 | M | Frontend |
| **ENG-604** | U14 divergence detector: `method_divergence_z(APT, SS-PS)` | P0 | ENG-101, ENG-301 | S | Backend |

### 1.8 New Clarification Simulations

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-701** | SIM-TEAM-CHAT-MICRO + SIM-CONFLICT-BRANCH (extend SS03 engine) | P1 | ENG-005 | L | Frontend |
| **ENG-702** | SIM-IN-TRAY-MINI (drag-rank inbox) + U17 substitution logic | P1 | ENG-005 | L | Frontend |
| **ENG-703** | SIM-PRESSURE-COOKER-CLAR + SIM-SPOT-THE-BREAK-CLAR | P1 | ENG-702 | L | Frontend |
| **ENG-704** | SIM-WORK-STYLES-ARENA-CLAR (4 binary choices) | P1 | ENG-005 | M | Frontend |
| **ENG-705** | SIM-EXPERT-CHALLENGE-CLAR + fake pool rotation (U16) | P1 | ENG-203 | M | Full-stack |
| **ENG-706** | SIM-ECOSYSTEM-ARCHITECT-CLAR (node-graph engine) | P2 | ENG-005 | L | Frontend |
| **ENG-707** | SIM-DAY-AS-JOINER-CLAR (3-node branch) | P2 | ENG-005 | M | Frontend |
| **ENG-708** | Unified sim telemetry adapter → `POST .../clarify/sim/complete` | P0 | ENG-401+ | M | Backend |

### 1.9 Reporting, Validity, Accessibility

| ID | Description | Priority | Dependencies | Effort | Owner |
|----|-------------|----------|--------------|--------|-------|
| **ENG-801** | Validity band logic: high / interpret-with-caution from U10, attention, long-string, integrity | P0 | ENG-101, ENG-305 | M | Backend |
| **ENG-802** | User 6 report template: work-readiness scorecard, NEG-SKILL subscores, clar evidence footnotes | P0 | ENG-305 | L | Backend + Frontend |
| **ENG-803** | `validity_band` + `fired_rules[]` on report JSON; never show "cheated" label (Honest Dice) | P0 | ENG-801 | S | Backend |
| **ENG-804** | U15 accommodation: intake flag, latency penalty disable, 1.5× timers, tap-rank mode | P0 | ENG-001, ENG-105 | M | Full-stack |
| **ENG-805** | 60s break UI before 3rd clarification journey | P1 | ENG-105 | S | Frontend |
| **ENG-806** | DIF telemetry hooks (gender, region, language) for pilot analytics | P2 | ENG-206 | S | Backend |

**Backlog totals:** P0 ≈ 35 tasks · P1 ≈ 10 · P2 ≈ 3

---

## 2. Database Changes

### 2.1 New tables

```sql
-- Migration 014_user_flow_clarification.sql

-- Orchestrator for User 6 (one row per candidate attempt)
CREATE TABLE user_flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flow_id TEXT NOT NULL DEFAULT 'user-6',  -- frozen
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','clarification','completed','aborted')),
  current_phase TEXT NOT NULL DEFAULT '0',
  phase_progress JSONB NOT NULL DEFAULT '{}',  -- { "2": { "blocks": {...}, "completed_at": ... } }
  construct_snapshot JSONB NOT NULL DEFAULT '{}',  -- pre-clar scores + confidence per construct
  validity_flags JSONB NOT NULL DEFAULT '{}',
  accommodation JSONB NOT NULL DEFAULT '{}',  -- U15
  intake_meta JSONB NOT NULL DEFAULT '{}',  -- role, region, sector
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, flow_id, started_at)  -- or one active session constraint via partial index
);

-- Clarification extension (1:1 with flow session when phase 7.5 active)
CREATE TABLE clarification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_session_id UUID NOT NULL REFERENCES user_flow_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'evaluating'
    CHECK (status IN ('evaluating','in_progress','finalized','skipped')),
  fired_rules TEXT[] NOT NULL DEFAULT '{}',  -- U1..U17
  assigned_journeys TEXT[] NOT NULL DEFAULT '{}',
  max_journeys SMALLINT NOT NULL DEFAULT 2,
  journey_progress JSONB NOT NULL DEFAULT '{}',
  fusion_result JSONB,
  evaluated_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ
);

-- Item-level clar responses
CREATE TABLE clarification_responses (
  id BIGSERIAL PRIMARY KEY,
  clarification_session_id UUID NOT NULL REFERENCES clarification_sessions(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_version SMALLINT NOT NULL DEFAULT 2,
  response_value JSONB NOT NULL,
  response_correct BOOLEAN,
  response_time_ms INTEGER,
  answer_change_count SMALLINT NOT NULL DEFAULT 0,
  scoring_rubric TEXT,
  partial_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cross-session exposure (U16)
CREATE TABLE clarification_item_exposure (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  exposure_count SMALLINT NOT NULL DEFAULT 0,
  last_exposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- Sim clar completions
CREATE TABLE clarification_sim_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clarification_session_id UUID NOT NULL REFERENCES clarification_sessions(id) ON DELETE CASCADE,
  sim_id TEXT NOT NULL,
  telemetry JSONB NOT NULL,
  composite_score NUMERIC(5,4),
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  success BOOLEAN,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link flow blocks to existing assessment_sessions
CREATE TABLE user_flow_block_sessions (
  flow_session_id UUID NOT NULL REFERENCES user_flow_sessions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  block_key TEXT NOT NULL,
  assessment_session_id UUID REFERENCES assessment_sessions(id),
  sim_result_id UUID REFERENCES clarification_sim_results(id),
  PRIMARY KEY (flow_session_id, phase, block_key)
);
```

### 2.2 New fields on existing tables

| Table | Field | Purpose |
|-------|-------|---------|
| `assessment_module_scores` | `confidence_by_construct JSONB` | Per-construct conf pre-clar |
| `assessment_module_scores` | `method_source TEXT` | sim / sjt / cat / likert_blocked |
| `learner_mbs_profile` | `validity_band TEXT` | high / interpret_with_caution |
| `learner_mbs_profile` | `clarification_summary JSONB` | rules fired, journeys run |
| `profiles` or intake | `assessment_accommodation JSONB` | U15 flags |

### 2.3 New indexes

```sql
CREATE INDEX user_flow_sessions_user_status_idx ON user_flow_sessions (user_id, status);
CREATE INDEX clarification_sessions_flow_idx ON clarification_sessions (flow_session_id);
CREATE INDEX clarification_responses_session_journey_idx ON clarification_responses (clarification_session_id, journey_id);
CREATE INDEX clarification_item_exposure_count_idx ON clarification_item_exposure (user_id, exposure_count);
```

### 2.4 Migration strategy

1. **014_user_flow_clarification.sql** — additive only; no changes to school-track tables  
2. Seed `assessment_modules` entries for new sim product codes (`CLAR-SIM-NEG-V2`, etc.) with `status='beta'`  
3. Deploy JSON bank assets via CI copy to `backend/assets/mbs/user-6/` (versioned by git SHA)  
4. Feature flag `USER6_CLARIFICATION_V2` default off until Sprint 3 exit  
5. Backfill not required (greenfield flow)

---

## 3. API Design

Base path: `/api/v6` (new router mounted in `backend/src/routes/index.js`)

### 3.1 Flow orchestration (prerequisite)

#### `POST /v6/flows/user-6/sessions`

```json
// Request
{ "intake": { "role_target": "data_analyst", "region": "IN", "accommodation": { "extended_time": true } } }

// Response 201
{
  "flowSessionId": "uuid",
  "currentPhase": "0",
  "phases": ["0","1","2","3","4","5","6","7","7.5","8"],
  "resumeToken": "opaque"
}
```

#### `GET /v6/flows/user-6/sessions/:flowSessionId/state`

```json
{
  "currentPhase": "7",
  "constructSnapshot": { "COMM": { "score": 0.72, "confidence": 0.61, "methods": ["sjt","sim"] } },
  "validityFlags": { "attention_fail": false },
  "nextBlock": { "phase": "7", "block": "apt_verbal", "format": "CAT" }
}
```

### 3.2 Clarification evaluation

#### `POST /v6/session/:flowSessionId/clarify/evaluate`

Runs after Phase 7 complete. Creates `clarification_sessions` row.

```json
// Response 200
{
  "clarificationSessionId": "uuid",
  "firedRules": ["U1", "U12"],
  "journeys": [
    { "journeyId": "J2-NEG", "priority": 2, "forced": true, "itemsPlanned": { "min": 4, "max": 8 }, "sim": "SIM-NEGOTIATION-NPC-V2" },
    { "journeyId": "J1", "priority": 2, "itemsPlanned": { "min": 6, "max": 12 }, "sim": "SIM-READ-THE-ROOM" }
  ],
  "maxJourneys": 2,
  "accommodation": { "U15_active": false, "latency_penalty_disabled": false },
  "canSkip": false
}
```

### 3.3 Journey routing & question retrieval

#### `GET /v6/session/:flowSessionId/clarify/next?journeyId=J2-NEG`

```json
// Response — item block
{
  "blockType": "items",
  "journeyId": "J2-NEG",
  "itemsRemaining": 6,
  "items": [
    {
      "itemId": "CLAR-NEG-V2-01",
      "questionType": "SJT",
      "stem": "Stakeholder asks for two extra features...",
      "options": ["...", "...", "...", "..."],
      "optionOrder": [2, 0, 3, 1],
      "metadata": { "difficulty": "standard", "exposurePool": "NEG-V2" }
    }
  ]
}

// Response — sim block
{
  "blockType": "simulation",
  "journeyId": "J2-NEG",
  "simConfig": {
    "simId": "SIM-NEGOTIATION-NPC-V2",
    "setup": "...",
    "roundsMax": 3,
    "timeMultiplier": 1.0,
    "npcResponses": { }
  }
}
```

### 3.4 Response submission

#### `POST /v6/session/:flowSessionId/clarify/response`

```json
// Request
{
  "clarificationSessionId": "uuid",
  "journeyId": "J2-NEG",
  "itemId": "CLAR-NEG-V2-01",
  "selectedOption": 2,
  "responseTimeMs": 12400,
  "answerChangeCount": 1,
  "clientSeq": 42
}

// Response
{
  "accepted": true,
  "partialScore": 1.0,
  "constructUpdates": { "NEG-INT": 0.85 },
  "journeyConfidence": { "NEG-SKILL": 0.58 },
  "shouldContinue": true
}
```

#### `POST /v6/session/:flowSessionId/clarify/sim/complete`

```json
// Request
{
  "clarificationSessionId": "uuid",
  "simId": "SIM-NEGOTIATION-NPC-V2",
  "telemetry": {
    "probe_count": 2,
    "offers": [...],
    "npc_trust_series": [0.5, 0.6, 0.72],
    "joint_value_score": 0.78
  },
  "durationMs": 245000
}

// Response
{
  "compositeScore": 0.74,
  "dimensionScores": { "NEG-INT": 0.8, "NEG-TRADE": 0.7, "NEG-REL": 0.72, "NEG-ASSERT": 0.65, "NEG-JV": 0.78 },
  "success": true
}
```

### 3.5 Final fusion

#### `POST /v6/session/:flowSessionId/clarify/finalize`

```json
// Response
{
  "constructScores": {
    "COMM": { "score": 0.74, "confidence": 0.81, "band": "capable" },
    "NEG-SKILL": { "score": 0.68, "confidence": 0.76, "band": "capable", "evidence": ["sim","sjt"] }
  },
  "validityBand": "high",
  "clarificationSummary": {
    "rulesFired": ["U1", "U12"],
    "journeysCompleted": ["J2-NEG", "J1"],
    "itemsAnswered": 14,
    "boostApplied": 0.08
  },
  "blockedConstructs": [],
  "nextPhase": "8"
}
```

### 3.6 Error codes

| Code | When |
|------|------|
| `CLAR_001` | Phase 7 not complete |
| `CLAR_002` | Evaluate not run |
| `CLAR_003` | U12 — negotiation report blocked (sim missing) |
| `CLAR_004` | Item exposure exhausted — pool rotation failed |
| `CLAR_005` | Invalid journey for session |

---

## 4. Frontend Requirements

### 4.1 Screen map

| Screen | Route | Purpose |
|--------|-------|---------|
| User 6 entry | `/assessments/user-6` | Consent, role/region intake, U15 accommodation toggle |
| Phase progress | `/assessments/user-6/:flowSessionId` | Stepper 0–8; shows current block |
| Block: SJT/CAT | embedded | Standard item UI; telemetry to flow session |
| Block: Phaser sim | `/assessments/user-6/:flowSessionId/sim/:simId` | Existing AssessmentShell pattern |
| **Clarification entry** | `.../clarify` | "A few follow-up questions" framing; no construct labels |
| **Journey progress** | `.../clarify/journey/:journeyId` | Sub-stepper; items X of Y |
| **Clarification SJT** | component | Randomized options; min 2s dwell; answer-change tracking |
| **Clarification sim** | PhaserHost | Load sim from `simConfig`; extended timer if U15 |
| **Break screen** | modal | 60s countdown before journey 3 |
| **Clarify complete** | `.../clarify/done` | Transition to Phase 8 wellness |
| Report | `/reports/user-6/:flowSessionId` | Scorecard + validity band |

### 4.2 Progress states

```
FlowSessionStatus: in_progress | clarification | completed | aborted
ClarificationStatus: evaluating | in_progress | finalized | skipped
JourneyState: pending | active | completed
BlockState: locked | available | in_progress | done
```

### 4.3 Resume states

- Persist `flowSessionId` + `clarificationSessionId` + `journeyId` + `itemIndex` in sessionStorage  
- On load: `GET /state` → if `currentPhase=7.5` and clar `in_progress`, resume `GET /clarify/next`  
- Sim mid-round: persist round index in sim local storage (existing `loadPersistedSession` pattern)

### 4.4 Error handling

| Scenario | UX |
|----------|-----|
| Network loss on response submit | Queue in IndexedDB; retry with `clientSeq` dedup |
| Evaluate returns 0 journeys | Skip clar screen → Phase 8 with audit log |
| U12 sim crash | Offer retry once; else `interpret_with_caution` on negotiation only |
| Session timeout (24h) | Resume or abandon with support contact |
| CLAR_004 pool exhausted | Admin alert; candidate sees "shortened follow-up" fallback |

---

## 5. Sprint Plan

**Team assumption per sprint:** 2 backend, 2 frontend, 1 QA, 0.5 assessment science (part-time)

### Sprint 1 (Weeks 1–2): Foundation + Rule Engine

**Goals:** Flow orchestrator live; clarification evaluate endpoint; bank loader

**Deliverables:**
- Migration 014
- ENG-001–006, ENG-101, ENG-104, ENG-105, ENG-201
- Feature flag scaffold
- Unit tests: rule parser, journey priority

**Risks:** User Flow JSON block mapping ambiguous vs existing modules  
**Acceptance criteria:**
- [ ] Create User 6 flow session via API
- [ ] Complete Phase 0–7 with stub block completions
- [ ] `/clarify/evaluate` returns correct journeys for 5 synthetic telemetry fixtures (U1, U5, U10, U12, U14)

---

### Sprint 2 (Weeks 3–4): Scoring + Item Flow + Negotiation V2

**Goals:** End-to-end clar item loop; fusion v3; negotiation sim MVP

**Deliverables:**
- ENG-102, ENG-103 (partial U13/U14 triggers), ENG-202–206, ENG-301–306, ENG-303, ENG-401–404, ENG-708
- Frontend: clar entry, SJT screen, response submit
- NEG-SKILL sim alpha (2 rounds minimum)

**Risks:** Phaser negotiation scene longer than estimated  
**Acceptance criteria:**
- [ ] Full clar loop for J2-NEG + J1 on staging
- [ ] Fusion v3 updates construct confidence in DB
- [ ] NEGT items never appear in negotiation construct output
- [ ] V1 J2 items not served

---

### Sprint 3 (Weeks 5–6): Remaining P0 Sims + Reporting + Accessibility

**Goals:** Format Lab clar, micro-CAT, validity band, U15

**Deliverables:**
- ENG-501–503, ENG-601–604, ENG-801–805
- ENG-701, ENG-702 (in-tray mini + team chat)
- User 6 report v1 with validity band
- Internal QA test matrix start

**Risks:** Micro-CAT IRT library choice (build vs adopt)  
**Acceptance criteria:**
- [ ] U13 → J7 Format Lab clar path works
- [ ] U14 → J8 micro-CAT adapts 4–6 items
- [ ] U15 extends timers; no latency penalty when flagged
- [ ] Report shows validity band + clar summary

---

### Sprint 4 (Weeks 7–8): Hardening + Pilot Prep

**Goals:** P1 sims, load test, pilot build

**Deliverables:**
- ENG-703–707, ENG-203, ENG-204, ENG-806
- Integration + load tests
- Pilot feature flag on for partner institution
- Runbook + monitoring dashboards

**Risks:** Fatigue-related drop-off in 165+ min sessions  
**Acceptance criteria:**
- [ ] 50 concurrent flow sessions stable (p95 < 2s evaluate)
- [ ] All U1–U17 fire correctly on fixture suite
- [ ] Production readiness checklist (pilot tier) 100%
- [ ] Assessment science sign-off on staging demo

---

## 6. Testing Strategy

| Layer | Scope | Tools / approach |
|-------|-------|------------------|
| **Unit** | Rule engine (each U1–U17), fusion v3 math, J2-V2 rubrics, exposure counter, NEGT block guard | Jest; fixture JSON from archive |
| **Integration** | API flows: evaluate → next → response → sim → finalize | Supertest + test Supabase |
| **Simulation** | Each clar sim emits required telemetry keys | Phaser headless / manual script |
| **Scoring** | Golden files: 10 sessions → expected construct bands | Snapshot tests |
| **Bias** | U15 path parity; region gate; no NEGT in negotiation output | Automated assertions + manual review |
| **Load** | 100 concurrent `/clarify/evaluate`; 500 item draws/min | k6 or Artillery |
| **E2E** | Playwright: full User 6 happy path + clar 2-journey | Staging |
| **Regression** | School-track assessments unaffected | Smoke suite on `/test/*` |

**Fixture requirement:** Assessment Science provides 20 anonymized telemetry profiles (one per U-rule + combos) before Sprint 2 exit.

---

## 7. Launch Readiness Checklist

### Must-have before pilot

- [ ] Migration 014 deployed to staging + production
- [ ] All P0 backlog items (ENG-001–106, 201–206, 301–306, 401–404, 501–502, 601–604, 708, 801–804) complete
- [ ] NEGT block guard verified in fusion pipeline
- [ ] V1 J2 clarification items deprecated in loader
- [ ] `/clarify/evaluate` through `/finalize` E2E on staging
- [ ] SIM-NEGOTIATION-NPC-V2 + SIM-FORMAT-LAB-CLAR telemetry validated
- [ ] Validity band on 100% of test reports
- [ ] U15 accommodation path tested
- [ ] Feature flag + rollback procedure documented
- [ ] Partner consent + wellness escalation (Phase 8) verified

### Must-have before production

- [ ] Pilot N≥500 complete; go/no-go signed (Assessment Science)
- [ ] All P1 sims OR explicit deferral with rule fallback documented
- [ ] DIF report reviewed; flagged items removed
- [ ] Threshold calibration (0.65/0.78) in Scoring Matrix v2.1
- [ ] Load test passed at 2× expected pilot peak
- [ ] Security review: RLS on all new tables
- [ ] Ops runbook: item pool rotation, sim failure, CLAR_004
- [ ] 30-day monitoring: attrition by phase, rule fire rates, band shift rate

---

## 8. Critical Path

### Longest dependency chain

```
ENG-001 Migration
  → ENG-002 Asset loader
    → ENG-003 Flow orchestrator
      → ENG-101 Rule engine
        → ENG-104 Router
          → ENG-205 GET /clarify/next
            → ENG-401 Negotiation sim V2
              → ENG-402 Sim scorer
                → ENG-303 NEG-SKILL fusion
                  → ENG-305 Finalize
                    → ENG-802 Report
                      → Pilot
```

**Critical path duration:** ~7–8 weeks (Sprints 1–4)

### Biggest technical risks

| Risk | Probability | Impact |
|------|-------------|--------|
| User 6 orchestrator underestimated (greenfield) | High | Delays all clar work |
| Negotiation Phaser sim scope creep | High | Blocks U12 / pilot |
| No primary Format Lab telemetry if Phase 5 sim not built | Medium | U13 trigger false negatives |
| Micro-CAT IRT implementation errors | Medium | Invalid aptitude clar |
| 165+ min session attrition | High | Validity flags spike |

### Highest probability blockers

1. **User Flow 6 primary phases 1–7 not orchestrated** — Clarification depends on `construct_snapshot`; without primary flow scoring, rules cannot fire meaningfully.  
2. **NEGOTIATION-NPC-V2 not shipped** — U12 blocks negotiation report; stakeholder-visible gap.  
3. **Assessment Science fixture delay** — Rule engine cannot be validated without signed telemetry profiles.

---

## 9. Final Estimate

### Engineering effort

| Workstream | Person-days |
|------------|-------------|
| Flow orchestrator (0–7) | 25–30 |
| Clarification backend (router, bank, fusion) | 30–35 |
| Clarification frontend | 20–25 |
| P0 simulations (Neg V2, Format Lab, In-tray mini, team chat) | 35–45 |
| P1 simulations | 20–25 |
| Reporting + validity | 10–12 |
| QA automation + load | 12–15 |
| **Total** | **~152–187 person-days** |

### Team composition

| Role | FTE | Duration |
|------|-----|----------|
| Backend engineer (senior) | 1.0 | 8 weeks |
| Backend engineer | 1.0 | 8 weeks |
| Frontend engineer (Phaser) | 1.0 | 8 weeks |
| Frontend engineer (UI/flow) | 0.75 | 8 weeks |
| QA engineer | 0.75 | 6 weeks |
| DevOps | 0.25 | 4 weeks |
| Assessment Science liaison | 0.25 | 8 weeks |

**Minimum viable team:** 2 backend + 1 Phaser frontend + 0.5 QA for pilot-only scope (P0 sims only) ≈ **6–7 weeks**.

### Timeline

| Milestone | From kickoff |
|-----------|--------------|
| Sprint 1 complete (evaluate works) | Week 2 |
| Sprint 2 complete (clar loop + Neg V2) | Week 4 |
| **Pilot-ready (P0 checklist)** | **Week 8** |
| Pilot execution (500+ candidates) | Weeks 9–16 |
| Calibration + production hardening | Weeks 17–20 |
| **Production launch** | **~Week 22** |

---

## Appendix: Reuse map (existing platform)

| V2 requirement | Reuse |
|----------------|-------|
| Session + telemetry | `assessment_sessions`, `assessment_telemetry_events`, `telemetry-client.ts` |
| Branching SJT engine | `SS02` / `SS03` Phaser configs → extend for clar SJTs |
| Rule scoring pattern | `ruleScoring.service.js` → new `clarificationScoring.service.js` |
| Profile rollup | `materializeLearnerMbsProfile` → add validity + clar summary |
| Session persistence | `session-persistence.ts` → extend for flow session |
| API auth | `requireAuth` middleware |
| Report shell | `report.service.js` → new User 6 report builder |

---

*Assessment design frozen. This plan covers implementation, integration, testing, and deployment only.*
