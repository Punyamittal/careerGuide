# MBS Archive → Live Assessment Integration

Archive JSON under `backend/exports/archive/` is the **source of truth** for MBS question banks. The centralized loader validates, deduplicates, maps items to modules, and serves configs to the frontend and scoring layer.

## Wired assets

| Asset | Path | Status |
|-------|------|--------|
| User Flow 1–5 banks | `Archive 2/Question_Banks/MBS_QBank_User_{1-5}.json` | Loaded |
| User 6 primary | `Archive 2/MBS_QBank_User_6.json` | Loaded (149 items incl. ecosystem merge) |
| Ecosystem 2026 | `MBS_Ecosystem2026_ItemBank.json` | Loaded + deduped with User 6 |
| Clarification (User 6) | `MBS_QBank_User_6_Clarification.json` | Separate clarification pipeline (unchanged) |

## Architecture

```
backend/exports/archive/*.json
        ↓
backend/src/modules/assessment-bank/
  loader.js          — load, validate, dedupe, index
  moduleMapper.js    — module ID → item selection rules
  likertAdapter.js   — archive item → LikertModuleConfig
  randomization.js   — shuffle + adaptive ordering
  schema.js          — validation helpers
        ↓
backend/src/services/assessmentBank.service.js
        ↓
GET /assessment/banks
GET /assessment/banks/:userFlow
GET /assessment/banks/ecosystem
GET /assessment/banks/verify
GET /assessment/modules/:moduleId/content
        ↓
frontend/lib/assessment-engine/bank-client.ts
frontend/lib/assessment-engine/configs/loader.ts  (API first, static TS fallback)
        ↓
LikertEngine / ruleScoring (archive item IDs)
```

## File-by-file changes

### Backend (new)

- `backend/src/modules/assessment-bank/constants.js` — paths, version, procedural module IDs
- `backend/src/modules/assessment-bank/loader.js` — Question Bank Loader
- `backend/src/modules/assessment-bank/schema.js` — schema validation
- `backend/src/modules/assessment-bank/moduleMapper.js` — module → archive item rules
- `backend/src/modules/assessment-bank/parseConstructs.js` — `constructs_fed` parser
- `backend/src/modules/assessment-bank/likertAdapter.js` — config + scoring adapter
- `backend/src/modules/assessment-bank/randomization.js` — shuffle / adaptive order
- `backend/src/services/assessmentBank.service.js` — service layer
- `backend/src/controllers/assessmentBank.controller.js` — HTTP handlers
- `backend/src/routes/assessmentBank.routes.js` — routes
- `backend/scripts/verify-assessment-bank.mjs` — CI verification script

### Backend (modified)

- `backend/src/routes/index.js` — mount assessment bank routes
- `backend/src/services/assessmentEngine/session.service.js` — module list includes `contentSource`, `archiveItemCount`, resolved `engineType`
- `backend/src/services/assessmentEngine/ruleScoring.service.js` — scoring from archive when available
- `backend/src/constants/mbsModuleRegistry.js` — added `ECO01` ecosystem module

### Frontend (new)

- `frontend/lib/assessment-engine/bank-client.ts` — fetch module content from API

### Frontend (modified)

- `frontend/lib/assessment-engine/configs/loader.ts` — archive-first config loading
- `frontend/lib/assessment-engine/configs/module-config.types.ts` — `reverse` on Likert items
- `frontend/components/assessment-engine/AssessmentShell.tsx` — resolved engine type from API

## Supabase schema

**No migration required.** Banks remain filesystem JSON (same pattern as clarification). Optional future table: `assessment_bank_snapshots` for version pinning.

## Migration plan

1. Deploy backend with new routes (no DB change).
2. Set `CLARIFICATION_ASSETS_DIR` if archive is not at default `backend/exports/archive`.
3. Run `node backend/scripts/verify-assessment-bank.mjs` in CI.
4. Deploy frontend — `loader.ts` fetches archive configs automatically.
5. Smoke-test Phase-1 modules (M01–M09, SS02, SS03, T4, T5).
6. Legacy static TS configs remain as fallback when archive has 0 matching items.

## Verification checklist

- [ ] `node backend/scripts/verify-assessment-bank.mjs` — no within-bank duplicate IDs
- [ ] `GET /assessment/banks` — lists user1–user6 + ecosystem counts
- [ ] `GET /assessment/modules/M01/content` — `source: "archive"`, items use archive `item_id`s (e.g. `M-001`)
- [ ] `GET /assessment/modules/SS02/content` — COMM-* items, `engineType: "likert"`
- [ ] `GET /assessment/modules/ECO01/content` — ECO-* items from ecosystem bank
- [ ] `GET /assessment/modules/T4/content` — `source: "procedural"` (tracing unchanged)
- [ ] Frontend M01 assessment renders archive stems end-to-end
- [ ] Submit + score session — telemetry item IDs match archive IDs
- [ ] SS02/SS03 render as Likert (not branching graph) with archive stems
- [ ] No broken module references in `/assessment/modules` list

## Query parameters (module content)

| Param | Effect |
|-------|--------|
| `shuffle=true` | Randomize item order |
| `seed=<string>` | Deterministic shuffle |
| `userFlow=user-6` | Filter to single user-flow bank |
| `adaptiveDifficulty=1-5` | Order items for adaptive delivery |
| `limit=N` | Cap item count |

## User flow orchestration (User 1–6)

Archive specs: `Archive 2/User_Flows/MBS_UserFlow_User_{1-5}.json`, root `MBS_UserFlow_User_6.json` (extended + ecosystem + clarification).

| Endpoint | Purpose |
|----------|---------|
| `GET /assessment/user-flows` | List all 6 flows |
| `GET /assessment/user-flows/:userFlow` | Resolved phases/blocks + item resolution stats |
| `GET /assessment/user-flows/:userFlow/phases/:pi/blocks/:bi/content` | Likert config for one block |
| `GET /assessment/modules/UF-user3-p1-b0/content` | Same via synthetic module id |

Frontend: **`/user-flow/user-1`** … **`/user-flow/user-6`**, grid on **`/overview?tab=assessments`**. School tracks link to matching user flows.

User 6 phase **7.5** links to existing **`/user-6/clarification`**.


- **T4 / T5** — procedural tracing / reaction-time engines
- **Clarification User 6** — separate merged clarification bank + routing matrices
- **School track questions** — Supabase `questions` table via seed script
- **Branching scenario graphs** — archive SJT/COMM items are flat stems; SS02/SS03 use Likert adapter until scenario graphs are authored from archive

## Environment

```bash
# Optional override (defaults to backend/exports/archive)
CLARIFICATION_ASSETS_DIR=/path/to/archive
```
