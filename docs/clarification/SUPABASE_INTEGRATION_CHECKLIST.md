# User Flow 6 Phase 7.5 — Supabase Integration Checklist

## A. Schema changes (migration `014_user_flow_clarification.sql`)

### New tables (required)
- [ ] `user_flow_sessions` — flow orchestrator (phases 0–8)
- [ ] `clarification_sessions` — 1:1 with flow during Phase 7.5
- [ ] `clarification_responses` — item answers + partial scores
- [ ] `clarification_sim_results` — sim telemetry + dimension scores
- [ ] `clarification_item_exposure` — U16 exposure counter
- [ ] `user_flow_block_sessions` — optional bridge to `assessment_sessions`

### Extended existing tables
- [ ] `learner_mbs_profile.validity_band`
- [ ] `learner_mbs_profile.clarification_summary`

### Reused (no schema change)
- `profiles` — user FK
- `assessment_sessions` — block phases 0–7 (via bridge table)
- `assessment_module_scores` — construct scores per block (read for snapshot)
- JSON assets — clarification item bank, U1–U17 rules (filesystem)

## B. Apply migration

```bash
# Supabase CLI (recommended)
supabase db push

# Or run SQL manually in Supabase SQL Editor:
# supabase/migrations/014_user_flow_clarification.sql
```

## C. Backend environment

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USER6_CLARIFICATION_V2=true
```

Remove or ignore `MONGODB_URI` — clarification no longer uses MongoDB.

## D. API smoke test

```bash
cd backend && npm run dev
```

1. Authenticate (Supabase JWT) via frontend login or Postman Bearer token
2. `POST /api/v1/v6/flows/user-6/sessions` — create flow session
3. `PATCH /api/v1/v6/flows/user-6/sessions/:id/phase` — set phase `7` + construct snapshot
4. `POST /api/v1/v6/session/:id/clarify/evaluate`
5. `GET /api/v1/v6/session/:id/clarify/next`
6. `POST /api/v1/v6/session/:id/clarify/response`
7. `POST /api/v1/v6/session/:id/clarify/sim/complete` (if sim routed)
8. `POST /api/v1/v6/session/:id/clarify/finalize`

## E. Frontend

1. Start frontend: `cd frontend && npm run dev`
2. Open `/user-6/clarification` (creates session) or `/user-6/clarification/:flowSessionId`
3. Run evaluate → answer items → complete sim → finalize

## F. Verification queries (Supabase SQL Editor)

```sql
select * from user_flow_sessions order by created_at desc limit 5;
select * from clarification_sessions order by created_at desc limit 5;
select count(*) from clarification_responses;
select * from learner_mbs_profile where clarification_summary != '{}'::jsonb limit 5;
```

## G. RLS

- All clarification tables have RLS enabled with `auth.uid() = user_id` policies
- Backend uses **service role** (`getSupabaseAdmin()`) — bypasses RLS for API operations
- Direct browser → Supabase table access is not used today (auth only)

## H. Rollback

```sql
drop table if exists clarification_item_exposure cascade;
drop table if exists clarification_sim_results cascade;
drop table if exists clarification_responses cascade;
drop table if exists clarification_sessions cascade;
drop table if exists user_flow_block_sessions cascade;
drop table if exists user_flow_sessions cascade;
alter table learner_mbs_profile drop column if exists validity_band;
alter table learner_mbs_profile drop column if exists clarification_summary;
```

## I. Known follow-ups

- Wire full Phase 0–7 orchestrator UI (assessment block launcher)
- Link `user_flow_block_sessions` when completing MBS assessment modules
- Negotiation V2 standalone sim still uses optional Mongo/in-memory — wire `flowSessionId` + `clarificationSessionId` through sim UI for auto `sim/complete`
- Remove legacy Mongoose models under `backend/src/modules/clarification/models/` once fully validated
