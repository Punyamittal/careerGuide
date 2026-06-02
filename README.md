# CareerGUIDE

AI-powered psychometric career guidance platform (Next.js + Express + Supabase).

## Stack

- **Frontend:** Next.js 16, Phaser assessment engines, Supabase Auth
- **Backend:** Express API, rule-based assessment scoring, MBS/O*NET recommendations, Grok/OpenAI coach

## Local development

```bash
npm install
npm run dev   # API :5000 + web :3000
```

### Environment

- `backend/.env` — see `backend/.env.example` (Supabase service role, XAI/OpenAI)
- `frontend/.env` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database

1. Apply Supabase migrations (`supabase/migrations/`)
2. `cd backend && npm run seed`
3. `npm run etl:mbs` and `npm run etl:onet` (requires data files)

## Assessment pipeline

```
POST /assessment/sessions → telemetry → POST .../score
  → assessment_module_scores → learner_mbs_profile
  → GET /mbs/recommendations → AI coach context
```

Rule scoring: `backend/src/services/assessmentEngine/ruleScoring.service.js`  
Profile rollup: `backend/src/services/mbs/profileMaterialization.service.js`

### Commands

```bash
cd backend
npm run build:scoring-catalog   # sync item rules from frontend configs
npm test                          # unit tests (rule scoring)
npm run validate:pipeline         # E2E checks (set TEST_AUTH_TOKEN)
```

## Documentation

- [Assessment architecture](docs/assessment-engine/ARCHITECTURE.md)
- [Roadmap](docs/assessment-engine/ROADMAP.md)
