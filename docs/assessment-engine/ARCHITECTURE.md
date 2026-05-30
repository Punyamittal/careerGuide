# Behavioral Assessment Engine — Architecture

Move from isolated IQ games + static quizzes to a **reusable Phaser-based assessment platform** wired to **MBS taxonomy**, **O\*NET occupations**, **Life Journey signals**, and **adaptive telemetry**.

---

## 1. Folder architecture

```
careerGUIDE/
├── docs/assessment-engine/
│   ├── ARCHITECTURE.md          ← this document
│   ├── ROADMAP.md               ← phased delivery
│   ├── TELEMETRY.md             ← event schema reference
│   └── MODULE_CATALOG.md        ← 39-module registry (generated from registry JSON)
│
├── supabase/migrations/
│   └── 013_assessment_engine_mbs.sql
│
├── backend/
│   ├── scripts/etl/mbs/
│   │   ├── import-mbs-master.mjs
│   │   └── lib/normalize-mbs-row.mjs
│   └── src/
│       ├── constants/
│       │   └── mbsModuleRegistry.js      ← canonical 39-module catalog
│       ├── routes/
│       │   ├── mbs.routes.js             ← domains, occupations, recommendations
│       │   └── assessmentEngine.routes.js
│       ├── controllers/
│       │   ├── mbs.controller.js
│       │   └── assessmentEngine.controller.js
│       ├── services/
│       │   ├── mbs/
│       │   │   ├── classification.service.js
│       │   │   └── recommendation.service.js
│       │   └── assessmentEngine/
│       │       ├── session.service.js
│       │       ├── telemetry.service.js
│       │       ├── adaptive.service.js
│       │       └── scoring/
│       │           ├── index.js
│       │           └── providers/        ← rule, openai, anthropic, gemini stubs
│       └── validators/
│           ├── mbs.validator.js
│           └── assessmentEngine.validator.js
│
└── frontend/
    ├── app/assessments/
    │   ├── page.tsx                      ← module launcher / track picker
    │   └── [moduleId]/page.tsx           ← Phaser shell per module
    ├── components/assessment-engine/
    │   ├── AssessmentShell.tsx           ← layout, progress, telemetry flush
    │   ├── ModuleLauncher.tsx
    │   └── phaser/
    │       ├── PhaserHost.tsx            ← client-only dynamic import
    │       ├── createAssessmentGame.ts   ← Phaser.Game factory
    │       ├── core/
    │       │   ├── BaseAssessmentScene.ts
    │       │   ├── TelemetryMixin.ts
    │       │   └── AdaptiveMixin.ts
    │       └── engines/
    │           ├── likert/               ← M1, M3 (questionnaire)
    │           ├── branching/            ← SJT scenarios
    │           ├── reaction-time/        ← T5, Stroop
    │           ├── tracing/              ← T4
    │           ├── drag-drop/
    │           └── node-graph/
    └── lib/assessment-engine/
        ├── types.ts
        ├── module-registry.ts            ← mirrors backend registry
        ├── telemetry-client.ts
        ├── adaptive-router.ts
        ├── scoring-client.ts
        └── mbs-bridge.ts                 ← map signals → MBS domains
```

**Legacy coexistence:** `components/cireern/game-runner.tsx` remains until modules are ported into `assessment-engine/phaser/engines/*` and registered.

---

## 2. Reusable engine architecture

Each **module** (e.g. `M01`, `T4`) declares an **engine type**. Engines are Phaser scenes + shared mixins.

```
┌─────────────────────────────────────────────────────────────┐
│                    AssessmentShell (React)                   │
│  sessionId · moduleId · adaptive state · API telemetry     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PhaserHost → createAssessmentGame()             │
│  Registry lookup: moduleId → engineType → Scene class        │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────┐         ┌─────────────┐       ┌──────────────┐
│  likert │         │ reaction-time│       │   tracing    │
│ branching│        │  drag-drop   │       │  node-graph  │
└────┬────┘         └──────┬───────┘       └──────┬───────┘
     │                     │                      │
     └─────────────────────┼──────────────────────┘
                           ▼
              ┌────────────────────────┐
              │ TelemetryMixin         │
              │  emit(stimulus, response, rt, …) │
              ├────────────────────────┤
              │ AdaptiveMixin          │
              │  nextItem(difficulty)  │
              ├────────────────────────┤
              │ ScoringAdapter         │
              │  rule | AI provider    │
              └────────────────────────┘
```

### Engine types

| Engine | Use cases | Phase-1 modules |
|--------|-----------|-----------------|
| `likert` | Likert, semantic differential, frequency | **M1** (Maslow), **M3** (Dweck) |
| `branching` | SJT 4-option, bias scenarios | **M11** (Communication SJT), **M12** (Collaboration SJT) |
| `reaction_time` | Stroop, symbol scan, go/no-go | **T5** |
| `tracing` | Path tracing, maze-like motor tasks | **T4** |
| `drag_drop` | Ranking, categorization | Phase 2 |
| `node_graph` | Career path / decision trees | Phase 3 |

> **Naming note:** Toolkit sheets use `M01_Maslow`, `SS02_Communication_SJT`, etc. Product IDs **M1/M3/M11/M12/T4/T5** map to registry entries in `mbsModuleRegistry.js` (see MODULE_CATALOG).

### Adaptive routing

```
Item bank → AdaptiveRouter.next(state):
  inputs:  accuracy, avgRt, streak, moduleDifficulty, constructTargets
  outputs: nextItemId | branchId | terminateModule
  rules:   3-down/1-up (default) · time ceiling · min/max items
```

### AI scoring abstraction

```ts
interface ScoringProvider {
  id: "rule" | "openai" | "anthropic" | "gemini";
  scoreConstructs(session: SessionPayload): Promise<ConstructScores>;
}
```

Rule-based scoring ships first; AI providers plug in for open-ended / SJT justification later.

---

## 3. Database schema (migration 013)

See `supabase/migrations/013_assessment_engine_mbs.sql`.

| Table | Purpose |
|-------|---------|
| `mbs_domains` | 18 MBS domains (code, label, career_group) |
| `onet_mbs_classifications` | SOC → domain mapping + confidence |
| `assessment_modules` | Registry mirror (39 rows, engine_type, item_bank_ref) |
| `assessment_sessions` | User run of a module or track |
| `assessment_telemetry_events` | High-volume stimulus/response stream |
| `assessment_module_scores` | Aggregated construct scores per session |
| `assessment_adaptive_state` | Router state snapshot |
| `learner_mbs_profile` | Rolled-up construct → domain affinities |

**Links to existing tables:** `profiles`, `onet_occupations`, `test_attempts`, `life_journey_events`, `game_events` (legacy IQ games).

---

## 4. ETL — `MBS_Master_Table.xlsx`

Script: `backend/scripts/etl/mbs/import-mbs-master.mjs`

```
Excel (993 rows × 466 cols)
  → normalize SOC, MBS_Domain, Career_Group, Career_Domain, Confidence
  → upsert mbs_domains
  → upsert onet_mbs_classifications (join onet_occupations by soc_code + active release)
  → optional: store occupation_highlights jsonb (description, core_tasks, top_skills)
```

Run:

```bash
cd backend
node scripts/etl/mbs/import-mbs-master.mjs \
  --path "C:/Users/punya mittal/Downloads/MBS_Master_Table.xlsx"
```

---

## 5. API structure

Base: `/api/v1`

### MBS / occupations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mbs/domains` | List 18 MBS domains + career groups |
| GET | `/mbs/occupations` | Filter by `mbsDomain`, `careerGroup`, `q` |
| GET | `/mbs/occupations/:socCode` | Detail + MBS classification + highlights |
| GET | `/mbs/recommendations` | Merge assessment scores + Life Journey signals → ranked occupations |

### Assessment engine

| Method | Path | Description |
|--------|------|-------------|
| GET | `/assessment/modules` | Registry (39 modules, engine types, status) |
| GET | `/assessment/modules/:moduleId` | Config + item bank slice for client |
| POST | `/assessment/sessions` | Start session `{ moduleId, trackId? }` |
| PATCH | `/assessment/sessions/:id` | Update adaptive state / complete |
| POST | `/assessment/sessions/:id/telemetry` | Batch telemetry events |
| POST | `/assessment/sessions/:id/score` | Trigger scoring (rule or AI provider) |
| GET | `/assessment/sessions/:id/results` | Construct scores + domain affinities |

Auth: `requireAuth` on all except public module catalog (optional).

---

## 6. Module registry (39 modules)

Canonical source: `backend/src/constants/mbsModuleRegistry.js` + `frontend/lib/assessment-engine/module-registry.ts`.

**Phase-1 priority (low complexity / high value):**

| Product ID | Registry key | Engine | Toolkit source | Constructs |
|------------|--------------|--------|----------------|------------|
| **M1** | `M01` | likert | M01_Maslow | Motivation hierarchy |
| **M3** | `M03` | likert | M03_Dweck_Mindset | Growth / fixed mindset |
| **M11** | `SS02` | branching | SS02_Communication_SJT | Communication |
| **M12** | `SS03` | branching | SS03_Collaboration_SJT | Collaboration |
| **T4** | `T4` | tracing | Engine benchmark | Coordination, processing |
| **T5** | `T5` | reaction_time | I07_Stroop_Test aligned | Attention, inhibition |

Remaining **33 modules** follow the same pattern (personality P01–P09, motivation M02–M09, leadership L01–L12, intelligence I01–I10, wellbeing W01, OB/SC/LEN/LR sheets). See `MODULE_CATALOG.md` for full list.

---

## 7. Telemetry event schema

See `docs/assessment-engine/TELEMETRY.md` and `assessment_telemetry_events` table.

Core fields per event:

- `session_id`, `module_id`, `item_id`, `event_type`
- `stimulus_id`, `response_value`, `response_correct`
- `response_time_ms`, `attempt_index`, `difficulty_level`
- `engine_type`, `metadata` (jsonb: coords for tracing, branch path, etc.)

Batch flush: client buffers → POST every 5s or 20 events.

---

## 8. Life Journey + assessment → occupations

```
Life Journey signalMap (confidence, grit, …)
  + assessment_module_scores (constructs)
  + test_attempts.scores (RIASEC / IPIP)
        ↓
  mbs-bridge: constructWeights → mbs_domain affinities
        ↓
  onet_mbs_classifications filter + onet_occupation_vectors rank
        ↓
  GET /mbs/recommendations
```

---

## 9. Scalable frontend for 39 modules

1. **One route:** `/assessments/[moduleId]` — never 39 separate pages.
2. **Registry-driven UI:** launcher reads `assessment_modules` from API.
3. **Dynamic Phaser load:** `import(\`./engines/${engineType}/index\`)` — code-split per engine.
4. **Shared shell:** timer, progress bar, accessibility, telemetry, pause/resume.
5. **Item banks from API:** no hard-coded stems in scenes; scenes render generic widgets.
6. **Feature flags:** `status: draft | beta | live` per module in registry.

---

## 10. Tech stack additions

```bash
cd frontend && npm install phaser
```

Optional later: `@rive-app/react-canvas` for lightweight animations, `comlink` for scoring workers.

---

## 11. Integration with existing systems

| Existing | Migration path |
|----------|----------------|
| `game-runner.tsx` maze/memory | Register as `T4`/`legacy-maze`; port to `tracing` engine |
| `/tests/attempts` psychometric | Feeds `test_attempts.scores` into recommendations |
| Life Journey | `signalMap` → `learner_mbs_profile` |
| `/games/actions` | Deprecated in favor of `assessment_telemetry_events` |
