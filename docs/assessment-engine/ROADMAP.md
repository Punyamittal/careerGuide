# Assessment Engine — Phased Roadmap

## Phase 0 — Foundation (Week 1–2) ✅ start here

- [x] Architecture doc + folder scaffold
- [ ] Migration `013_assessment_engine_mbs.sql` applied to Supabase
- [ ] ETL: import `MBS_Master_Table.xlsx` → `mbs_domains` + `onet_mbs_classifications`
- [ ] API: `GET /mbs/domains`, `GET /mbs/occupations`, `GET /assessment/modules`
- [ ] Frontend: `AssessmentShell` + empty `PhaserHost`
- [ ] Install `phaser` in frontend

**Exit criteria:** Domains API returns 18 MBS domains; occupations filterable by `mbsDomain`.

---

## Phase 1 — Priority modules (Week 3–5)

Ship **M1, M3, M11, M12, T4, T5** on shared engines.

| Module | Engine | Deliverable |
|--------|--------|-------------|
| M1 | likert | Maslow needs — 8–12 items, rule scoring |
| M3 | likert | Dweck mindset — semantic diff widgets |
| M11 | branching | Communication SJT — 4-option scenarios |
| M12 | branching | Collaboration SJT |
| T4 | tracing | Path trace task (3 difficulty levels) |
| T5 | reaction_time | Stroop-style color/word task |

- [ ] Telemetry batch ingest + `assessment_sessions` lifecycle
- [ ] Rule-based scoring → `assessment_module_scores`
- [ ] Adaptive router (3-down/1-up) for T4/T5

**Exit criteria:** Complete module end-to-end; scores visible in profile; telemetry in DB.

---

## Phase 2 — Recommendations bridge (Week 6–7)

- [ ] `GET /mbs/recommendations` merges assessment + Life Journey + RIASEC
- [ ] `learner_mbs_profile` materialized on session complete
- [ ] Career cards show `MBS_Domain`, `Career_Group`, match explanation
- [ ] Life Journey insights panel: “Suggested career domains”

**Exit criteria:** Signed-in user sees top 12 occupations with MBS domain rationale.

---

## Phase 3 — Engine expansion (Week 8–10)

- [ ] `drag_drop` engine (ranking items — McClelland, Gardner MI)
- [ ] `node_graph` engine (career decision paths)
- [ ] Port legacy maze game → `T4` tracing engine
- [ ] 10 additional modules (P01–P05 Big Five subset)

---

## Phase 4 — AI scoring + adaptive tracks (Week 11–12)

- [ ] Scoring providers: OpenAI, Anthropic, Gemini (env-gated)
- [ ] Multi-module **tracks** (e.g. “Motivation bundle”: M1+M3+M02)
- [ ] Institution dashboard: cohort telemetry aggregates
- [ ] Admin: module `status` toggles (draft/beta/live)

---

## Phase 5 — Full 39-module catalog (Week 13+)

Roll out remaining registry modules in batches of 5–8, prioritized by:

1. Item bank readiness in `MBS_Full_Toolkit_v2_expanded.xlsx`
2. Engine reuse (likert/branching before novel engines)
3. Construct coverage gaps in learner profile

**Target:** All 39 modules `live`; legacy `game-runner` retired.
