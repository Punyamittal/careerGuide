# Assessment Engine — Phased Roadmap

## Phase 0 — Foundation ✅

- [x] Architecture doc + folder scaffold
- [x] Migration `013_assessment_engine_mbs.sql`
- [ ] ETL: import `MBS_Master_Table.xlsx` → `mbs_domains` + `onet_mbs_classifications` *(run `npm run etl:mbs`)*
- [x] API: `GET /mbs/domains`, `GET /mbs/occupations`, `GET /assessment/modules`
- [x] Frontend: `AssessmentShell` + `PhaserHost`
- [x] Install `phaser` in frontend

---

## Phase 1 — Priority modules (in progress)

| Module | Engine | Status |
|--------|--------|--------|
| M1, M2–M9 | likert | beta — rule scoring live |
| M11, M12 | branching | beta — rule scoring live |
| T4 | tracing | beta — engine implemented |
| T5 | reaction_time | beta — engine implemented |

- [x] Telemetry batch ingest + `assessment_sessions` lifecycle
- [x] Rule-based scoring → `assessment_module_scores` (`ruleScoring.service.js`)
- [x] `learner_mbs_profile` materialization on session complete
- [ ] Adaptive router (3-down/1-up) for T4/T5 — partial (client adaptive state stored)

**Exit criteria:** Complete module end-to-end; scores visible in profile; telemetry in DB.

---

## Phase 2 — Recommendations bridge

- [x] `GET /mbs/recommendations` merges assessment + Life Journey
- [x] `learner_mbs_profile` updated after assessments
- [ ] Career cards show MBS rationale in all UIs
- [ ] Life Journey insights panel: “Suggested career domains”

---

## Phase 3–5

See prior roadmap sections for engine expansion, AI scoring providers, and full 39-module catalog.
