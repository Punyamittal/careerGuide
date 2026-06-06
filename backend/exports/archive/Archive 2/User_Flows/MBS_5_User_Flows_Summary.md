# MBS — 5 Separate User Flows (from Concept Note v2)

Five distinct learners from Class 5 to Undergraduate, each with its **own question bank, own flow, and own adaptive paths**. Item content is drawn from your `MBS_v3_FullQuestionBank.xlsx`; game modules are referenced by code.

## User 1 — Early Learner  ·  Class 5
*Surface intrinsic traits (curiosity, social style, thinking preference, early motivation) — NOT career prediction.*

- **Duration:** 30 min  ·  **Target items:** 30  ·  **Delivery:** Gamified, visual-first, narrated story world; the child is immersed, not 'tested'.

**Flow:**
- **0. Story Warm-up (unscored)** — Meet your guide & choose an avatar (-, n=0)
- **1. Curiosity Orientation** — Explore vs follow-the-path choices (big5, n=4); What would you do next? (open-ended-lite) (creativity, n=2)
- **2. Thinking Style (concrete vs abstract)** — Picture puzzles (very easy) (apt_abstract, n=4); Sorting game (apt_spatial, n=2)
- **3. Social Engagement** — Play alone or with friends? scenarios (disc, n=4); Sharing & helping scenarios (softskills, n=2)
- **4. Sensory & Attention (mini-games)** — Go/No-Go tap game (game:M11 Go/No-Go (inhibition), n=3); Steady Trace (game:M22 Steady Trace (fine motor/attention), n=3)
- **5. Early Motivation Archetype** — What makes you happy? (Task/Play/Recognition/Structure) (motivation, n=6)

**Adaptive paths:**
- *pacing:* Auto-pace by engagement/response speed; narrate all items.
- *difficulty:* Puzzles are easy-only; if 2 consecutive errors -> show an even easier item and move on (no failure framing).
- *shortening:* If a clear pattern emerges in a block, skip remaining redundant items.
- *no_high_stakes:* No scores shown to child; output is a metaphor-based persona.
- *wellness:* Flag only extreme signals (severe inattention/withdrawal) to the school counsellor — never to the child.

**Report:** Learner persona (avatar + metaphor), strength bars (Attention/Social/Curiosity/Thinking/Motivation), home+school tips, alert zones, NEP portfolio box.

---

## User 2 — Middle Learner  ·  Class 8
*Deepen into academic behaviour, emerging aptitude, motivation, learning & study style, focus/fatigue.*

- **Duration:** 60 min  ·  **Target items:** 50  ·  **Delivery:** Scenario-based items, basic logic challenges, timed preferences; some AI-evaluated short answers.

**Flow:**
- **1. Emerging Aptitude** — Verbal reasoning (apt_verbal, n=6); Logic & patterns (apt_abstract, n=6); Visual / spatial (apt_spatial, n=4)
- **2. Motivation Style (People/Task/Ideas/Achievement)** — What drives you? scenarios (motivation, n=6)
- **3. Learning Style** — How do you learn best? (VARK/Kolb) (learning, n=6)
- **4. Focus vs Fatigue** — Sustained attention game (game:M10 Split Track (divided attention), n=3); Processing speed quick-tap (processing_speed, n=2)
- **5. Study Discipline & Self-Regulation** — Study-habit scenarios (softskills, n=5)
- **6. Behavioural Style (DISC-lite)** — How do you usually act?  (disc, n=8)
- **7. Decision-Making Style** — Decide & delay scenarios (strategy_career, n=4)

**Adaptive paths:**
- *difficulty:* Aptitude sections branch: <50% on first 2 -> easier; >=80% on first 3 -> stretch.
- *time_extension:* Thoughtful (slow-but-accurate) students get auto time extension.
- *shortening:* High response-confidence -> auto-shorten section.
- *ai_scored:* Short-answer items scored by Claude Haiku.
- *wellness:* Light wellness check; escalate only strong distress to counsellor.

**Report:** Emerging aptitude radar, study-discipline type, motivation axis %, attention/fatigue map, stream-fit predictors, parent summary.

---

## User 3 — Stream Selector  ·  Classes 9-10
*First high-stakes tool: diagnostic + directional. Produces ranked STREAM recommendation (PCM/PCB/Commerce/Humanities/Hybrid).*

- **Duration:** 120 min  ·  **Target items:** 80  ·  **Delivery:** Adaptive standard test (MCQ + visual reasoning) + personality/interest batteries.

**Flow:**
- **Session 1 — Aptitude Batteries** — Verbal reasoning (apt_verbal, n=12); Numerical reasoning (apt_numerical, n=12); Spatial / logical (apt_spatial, n=8); Mechanical / technical (apt_mechanical, n=8); Abstract intelligence (apt_abstract, n=6)
- **Session 2 — Personality & Interests** — DISC behavioural typing (disc, n=12); RIASEC interests (riasec, n=12); People / Data / Ideas / Things (motivation, n=6)
- **Session 3 — Stream-fit check** — Subject-scenario SJTs (softskills, n=4)

**Adaptive paths:**
- *difficulty:* Per-module: first 2 <50% -> EASY; first 3 60-80% -> STANDARD; first 3 >=80% -> STRETCH.
- *shortening:* Auto-reduce section length 20-30% when response confidence is high (no loss of accuracy).
- *stream_routing:* Aptitude + RIASEC + motivation triangulated -> rank PCM/PCB/Commerce/Humanities/Hybrid.
- *mismatch_alert:* Flag if chosen/likely stream conflicts with interest-aptitude profile (interdisciplinary tendency).
- *wellness:* Standard wellness check; counsellor escalation on distress.

**Report:** Ranked stream recommendations, strength-subject map, multiple-stream compatibility chart, mismatch risk alert, parent guide.

---

## User 4 — Career Explorer  ·  Classes 11-12
*Full-spectrum evaluation mapping the learner to 20 career domains (4 groups) with fit scores & next steps.*

- **Duration:** 180 min  ·  **Target items:** 120  ·  **Delivery:** Adaptive batteries + Session-3 game modules fired by RIASEC top-3 & ability (Companion Spec routing).

**Flow:**
- **Phase 0 — Intake** — Context & consent survey (survey, n=6)
- **Phase 1 — Personality** — Big Five + sub-facets (big5, n=25); DISC behavioural style (disc, n=12)
- **Phase 2 — Interests** — Full RIASEC (riasec, n=12); People / Data / Idea / Thing (motivation, n=6)
- **Phase 3 — Aptitude / Multiple Intelligence** — Verbal & critical thinking (apt_verbal, n=12); Numerical & analytical (apt_numerical, n=12); Spatial & visual logic (apt_spatial, n=8); Mechanical / tool logic (apt_mechanical, n=6); Abstract intelligence (apt_abstract, n=10)
- **Phase 4 — Career-Domain batteries (ADAPTIVE — top groups fired)** — Domain fit & attitude — top 5-6 domains by Session1-2 signal (strategy_career, n=6)
- **Phase 5 — Wellness & Reflection** — Wellness screener (emotional/social/physical) (wellness, n=6); Failure-reflection & aspiration (open) (survey, n=4)
- **Session 3 — Game modules (fired by router)** — Cognitive/creative games (M5, M16-M21) (game:M5 Extended Cognitive Lab, n=0); ICT games (>=2 of T1-T7) (game:T1 Logic Flow, n=0); Knowledge games (>=3 of K1-K10) (game:K3 Ecosystem Architect, n=0)

**Adaptive paths:**
- *session3_routing:* POST /session3/route — inputs: RIASEC top-3, values top-3, work-context, ability top-3, education_level, aspiration tags; returns modules_to_fire (min 2 T + 3 K + matched M).
- *domain_firing:* Only career-domain batteries matching the learner's top clusters are shown (rest skipped).
- *difficulty:* Per-module easy/standard/stretch branching (Companion Spec B.4).
- *wellness_flag:* PHQ/GAD/SI items + AI distress detection -> counsellor escalate + iCall referral.
- *ai_scoring:* Open items scored by Claude (Haiku; Sonnet for failure-reflection).

**Report:** Top-5 domains with fit scores, full 20-domain match matrix, 'why this fits', next steps (courses/certs/degrees), motivational profile, self-awareness quotient.

---

## User 5 — Undergraduate / Career-Readiness  ·  Undergraduate (+ fresher)
*Career-domain fit PLUS employability: work styles/values/context, adaptability, tech & domain skills, internship signal, and a path to job OR entrepreneurship.*

- **Duration:** 180 min  ·  **Target items:** 130  ·  **Delivery:** Same adaptive core as Career Explorer, re-pointed to college/work context + employability + AI-scored experience.

**Flow:**
- **Phase 0 — Intake & Experience** — Context & consent survey (survey, n=6); Internship & project upload (-, n=2)
- **Phase 1 — Personality** — Big Five + facets (big5, n=20); DISC style (disc, n=10)
- **Phase 2 — Interests & Work Orientation** — RIASEC (riasec, n=12); O*NET Work Styles (workstyles, n=10); O*NET Work Values (workvalues, n=8); O*NET Work Context preferences (workcontext, n=6)
- **Phase 3 — Aptitude (confirmatory, shorter)** — Verbal & critical (apt_verbal, n=8); Numerical & analytical (apt_numerical, n=8); Abstract intelligence (apt_abstract, n=8)
- **Phase 4 — Employability & Skills** — Technology skills checklist + Expert Challenge (game:M7 Expert Challenge (Knowledge proficiency), n=6); Soft-skills SJTs (comm/collab/problem-solving) (softskills, n=8); Career adaptability & maturity (Savickas 4Cs) (strategy_career, n=8)
- **Phase 5 — Domain & Aspiration** — Career-domain batteries (top clusters incl. Entrepreneurship) (strategy_career, n=6); Aspiration / influences / main challenge (open) (survey, n=4)
- **Phase 6 — Wellness** — Wellness screener (wellness, n=6)
- **Session 3 — Game modules (router)** — ICT games (T-series, role-relevant) (game:T4 Spreadsheet Sprint, n=0); Knowledge games (K-series, domain) (game:K2 Market Mover, n=0)

**Adaptive paths:**
- *experience_routing:* Internship/project AI tags bias domain firing & employability feedback.
- *employability_branch:* Output forks into JOB-readiness path or ENTREPRENEURSHIP path based on aspiration + work-value signals.
- *shortening:* Aptitude shortened where school-stage data is imported.
- *session3_routing:* Same router as Career Explorer, weighted to work readiness.
- *wellness_flag:* PHQ/GAD/SI + AI distress -> counsellor + iCall.
- *ai_scoring:* Internship clustering, aspiration, challenge, failure-reflection scored by Claude.

**Report:** Top career domains + role fit, employability scorecard (skills/work-style/values), adaptability index, job vs entrepreneurship path, next-step plan (courses/certs/internships), wellness note.

---
