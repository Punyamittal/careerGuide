# Reducing Social Desirability & Bias in MBS
### A behavioural-first strategy for all 6 user flows — survey→minigame conversions, novel mechanics, and faking-resistant scoring

> Updated for the v3.3 bank (1,016 items) and the new 6th flow (Fresher / 1st-year / Intern). The v3.3 professional tests — communication (COMM), negotiation (NEGT), conflict (CONF), teamwork (TEAM), decision-making (DEC), EQ (EQD), entrepreneurship (ENT), intrapersonal (INTRA), learning agility (LRND), values/meaning (PHIL) — arrive as Likert in the bank but are delivered as **SJTs, branching sims and games** in the flows (see §3 Users 4–6 and the conversion map in §4).

The core move is simple: **stop asking people what they are like and watch what they do.** A learner can fake a Likert answer in half a second; they cannot fake their reaction time, their risk-taking under real stakes, how long they persist on a frustrating puzzle, or whether they actually explore. This document gives the specific tactics, the survey→game conversions per flow, novel game/animation ideas, and the validity controls that catch the faking that remains.

---

## 1. The biases we are fighting

| Bias | What it is | Where it bites in MBS |
|---|---|---|
| **Social desirability** | Answering to look good ("I always help others") | Personality, values, soft-skills, integrity self-reports |
| **Faking-good / impression management** | Deliberate self-promotion (high-stakes stream/career tests) | Users 3–5 especially |
| **Acquiescence (yes-saying)** | Agreeing regardless of content | Any Likert block |
| **Extreme / central-tendency responding** | Always picking 1/5 or always 3 | Likert scales |
| **Careless / inattentive responding** | Clicking through without reading | Long survey blocks, fatigue |
| **Demand characteristics** | Guessing what the test "wants" | Transparent trait items |
| **Stereotype threat** | Under-performing when a group identity is salient | Cognitive tasks if demographics primed first |
| **Cultural / language bias** | Items that favour one background/language | Verbal items, idiom-heavy SJTs |
| **Order / fatigue effects** | Later answers degrade | 80–130 item flows |
| **Halo / leniency (rater)** | Generous or globally-coloured scoring | AI/human scoring of open items |
| **Practice / coaching** | Memorised answers, drilled item types | Reused item banks |

---

## 2. The cross-cutting anti-bias toolkit (applies to all 5 flows)

These twelve mechanisms are the building blocks; the per-flow sections below say which to apply where.

1. **Behavioural / performance tasks (minigames).** Reaction time, error rate, persistence, exploration, choices under stakes — these are *revealed* traits, not claimed ones. The single biggest defence against social desirability. *Kills: social desirability, faking, acquiescence, extreme responding.*
2. **Forced-choice / ipsative items.** Instead of rating one statement, pick between two (or rank four) statements **matched for desirability** ("I plan ahead" vs "I improvise well" — both sound good). Score with Thurstonian-IRT so results stay comparable across people. *Kills: social desirability, acquiescence, extreme/central responding.*
3. **Situational Judgement Tests (SJTs).** "A teammate misses a deadline — what do you do?" with 4 plausible actions. Indirect; the trait is hidden inside the scenario. *Kills: demand characteristics, social desirability.*
4. **Simulations / branching scenarios.** A short "day in the life" where consequences unfold from real choices — measures behaviour in context, not stated intent. *Kills: faking, demand characteristics.*
5. **Revealed-preference telemetry.** What they *do* in the product: dwell time on an activity (= interest), whether they read instructions (= conscientiousness), exploration of optional content (= openness/curiosity), answer-change patterns, hesitation. Silent, unfakeable. *Kills: social desirability across the board.*
6. **Response-latency capture.** Faking takes longer than honest answering for desirable traits, and is faster for over-learned "right" answers. Log every item's latency; flag suspicious patterns. *Kills: faking, careless responding.*
7. **Implicit / reaction-time tasks.** Speeded categorisation (IAT-style) and conditional-reasoning items measure associations the respondent can't easily control. Use sparingly and age-appropriately. *Kills: social desirability, impression management.*
8. **Economic / decision games.** Trust, Dictator, Ultimatum, Balloon-Analogue-Risk, delay-discounting — classic behavioural-economics tasks that quantify cooperation, fairness, risk and impulsivity from real choices. *Kills: social desirability on agreeableness, risk, integrity.*
9. **Gamified masking.** Wrap the measurement in an engaging goal so the scoring intent is hidden — the learner optimises for the game, revealing the trait as a by-product. *Kills: demand characteristics, social desirability.*
10. **Embedded validity scales & checks.** Infrequency items ("I have never used a phone"), an over-claiming module (rate familiarity with real + fake concepts), a short social-desirability scale (BIDR-style), attention checks ("select 'somewhat agree'"), and long-string detection. Use these to *flag and statistically correct*, not to punish. *Kills: faking, careless responding — by detecting it.*
11. **Balanced keying + randomisation.** Half of every trait's items reverse-scored (defeats yes-saying); item and option order randomised per session (defeats order effects and coaching). *Kills: acquiescence, order, practice.*
12. **Low-stakes, identity-safe framing.** "There are no right or wrong answers; this is about how you think." No demographic questions *before* cognitive tasks. Culture-fair (figural, Raven-style) items where possible, multi-language stems. *Kills: stereotype threat, cultural/language bias, demand characteristics.*

> Then **triangulate**: every important trait is measured by ≥2 methods (e.g., a game + a forced-choice block). Where they agree, confidence is high; where they diverge, flag for the report rather than averaging blindly.

---

## 3. Per-flow strategy — what to keep as a game, what survey to convert

### User 1 — Early Learner (Class 5)
Children are the *easiest* to bias with words and the *hardest* to get honest Likert data from — so go almost fully behavioural.
- **Zero Likert.** Replace all rating items with **picture forced-choice** ("which would you rather do?") and **revealed-preference exploration** inside the story world.
- **Sharing/economic game (agreeableness):** a "sticker-sharing" Dictator game — how many stickers the child gives an NPC friend. No words, pure behaviour.
- **Curiosity via exploration telemetry:** the story world has optional side-paths; openness = how much they explore vs follow the marked path.
- **Risk via a gentle Balloon game** (pump for stars, balloon might pop) — measures risk appetite without a single question.
- **Anti-bias framing:** the child is never told it's a test; no scores shown; only severe signals flagged to the counsellor (never the child).
- **Careless control:** pacing is auto-set to the child's speed; impossibly-fast taps trigger a re-engagement animation, not a failure.

### User 2 — Middle Learner (Class 8)
Mix, but tilt to games; keep blocks short to beat fatigue.
- **Convert** the *motivation*, *learning-style* and *decision-style* surveys to behavioural tasks (see §5).
- **Learning style done right:** instead of self-reported VARK (low validity, high social desirability), give the same micro-lesson in 4 formats and **measure performance per format** — an aptitude-treatment signal, not a claim.
- **Achievement motive via a ring-toss / dart-distance game:** the learner chooses how far to stand (easy near throw vs risky far throw) — Atkinson's classic behavioural measure of achievement vs fear-of-failure.
- **Keep:** DISC as **forced-choice** (not Likert), aptitude as games. Add 1 attention-check and latency logging.

### User 3 — Stream Selector (Class 9–10) — first high-stakes test, so faking pressure is real
- Aptitude is already behavioural — keep, add **adaptive difficulty** (also defeats coaching) and **culture-fair figural items** to cut language bias.
- **Convert DISC & RIASEC to forced-choice + micro-sims.** Interests measured by a **"career theme-park"**: choose which activity-rides to do; **dwell time and choice = interest** (revealed preference), far harder to fake than "rate how much you like science."
- **People/Data/Ideas/Things** via a sorting game (drag tasks you'd pick), not a rating.
- **Validity layer:** add a short social-desirability scale + 2 infrequency items; if the SD score is high, the report shows a "taken at face value with caution" band and leans on the game-based scores.
- **Stereotype-threat guard:** no demographic prompts before the aptitude session.

### User 4 — Career Explorer (Class 11–12)
- **Big Five via forced-choice blocks + behavioural residue** rather than pure Likert: conscientiousness from a "messy-desk / in-tray" tidy-before-you-start task; extraversion from social-approach choices in a branching campus sim; openness from exploration + Alternative Uses/Idea Mesh (already in your bank).
- **Career-domain fit via simulations,** not "rate your interest in law": short branching **"a day as a ___"** vignettes for the top-cluster domains, scored on the choices made.
- **Agreeableness/ethics via economic games** (Trust + a low-stakes "honesty" task).
- **Keep** the failure-reflection open item (already AI-scored, with distress flagging) — open text is *harder* to fake than Likert and adds incremental validity.
- **Add an over-claiming module** to the knowledge/aptitude section to catch exaggeration.
- Full **latency + long-string + attention-check** battery given the 120-item length.

### User 5 — Undergraduate / Career-Readiness — the most fakeable population, so simulate the most
- **Lead with simulations.** An **in-tray / in-basket exercise** ("here's your inbox on day 1 — triage these 6 items in 8 minutes") measures prioritisation, conscientiousness, judgement and stress-handling at once, almost un-fakeable.
- **Negotiation sim** (branching, with an NPC) for communication/assertiveness; **ethical-dilemma sim** for integrity; **team-chat sim** for collaboration — all SJT/branching, not self-rating.
- **Work values via "Trade-off Island":** allocate scarce life-points across values with real consequences shown — revealed preference beats "rank these 6 values."
- **Objective evidence:** the **internship/project upload** (AI-clustered) is hard, behavioural evidence — weight it.
- **Employability path** (job vs entrepreneurship) decided by *behaviour in the sims*, not by "are you entrepreneurial?".
- **New v3.3 tests, delivered behaviourally:** communication (COMM) → tone-match SJT; negotiation (NEGT) → branching/economic deal sim; conflict (CONF) → conflict-handling SJT; teamwork (TEAM) → team-chat sim; decision (DEC) → Two-Doors game; EQ (EQD) → read-the-room affect task; entrepreneurship (ENT) → opportunity-spotting sim; learning agility (LRND) → Format Lab; self-concept (INTRA) → forced-choice + reflection. None shown as raw Likert.
- Keep validated **wellness screeners as self-report** (see the important exception in §6).

### User 6 — Fresher / 1st-Year / Intern (NEW)
The most fakeable population of all (they are literally trying to look hireable), so this flow is **~85% simulation/SJT/game; the only self-report is the wellness screener.**
- **The whole assessment is a workday.** A `day-in-the-job` runs the candidate through an **in-tray/in-basket** (prioritise a day-1 inbox under a timer — reads conscientiousness, judgement, ownership and stress at once and is almost impossible to fake), a **team-chat sim**, a **tough conversation / conflict**, a **negotiation with an NPC** (scope/deadline), a **decision under ambiguity** (Two Doors), and an **ethics moment** (Honest Dice).
- **Work-readiness constructs are all behavioural:** communication, collaboration, conflict, negotiation, decision-making, EQ, learning agility, integrity, stress and ownership are scored from choices and performance in those sims — never from "rate yourself."
- **Objective evidence weighted heavily:** the résumé/internship upload is AI-clustered and counts more than any self-report.
- **Aptitude is short and confirmatory** (and imported/shortened if the learner already did the UG flow).
- **Outputs a work-readiness scorecard + a 30-60-90 day plan + a job-vs-intrapreneur signal**, with a validity band from silent telemetry.
- **Anti-bias edge:** because the candidate is *doing the job*, impression-management has little surface to act on — they optimise for the sim goal, revealing behaviour as a by-product.

---

## 4. Survey → minigame / simulation conversion map

| Construct (often a survey today) | Behavioural replacement | Unique animation / mechanic | Bias it kills |
|---|---|---|---|
| **Conscientiousness** | In-tray triage + "tidy the desk before starting" + reads-instructions telemetry | Drag-sort an animated inbox; clutter that can be organised | Social desirability, faking |
| **Extraversion** | Social-approach choices in a campus/party branching sim | Avatar walks toward groups vs quiet corner; choice heat-tracked | Social desirability |
| **Openness / curiosity** | Exploration of optional world content + Alternative Uses | Hidden side-doors in the map; dwell + discovery telemetry | Demand characteristics |
| **Agreeableness / cooperation** | Trust & Dictator economic games | Coins sliding into a shared "trust vault"; payoff reveal | Social desirability |
| **Neuroticism / stress tolerance** | Performance drop & recovery under timed failure; steadiness under distractors | "Pressure cooker" — gauge rises, hand-trace must stay steady | Faking, self-report distortion |
| **Risk tolerance** | Balloon Analogue Risk Task; Columbia Card Task | Balloon inflating with rising reward + pop risk | Social desirability on risk |
| **Achievement motive** | Choose task difficulty / throw distance for variable reward | Ring-toss line: step back for more points | Social desirability |
| **Integrity / honesty** | Solo task where over-claiming a score is possible-but-tracked | "Report your dice roll" with hidden ground-truth | Social desirability (huge here) |
| **Interests (RIASEC)** | "Career theme-park" — pick activity-rides; dwell = interest | Park map of ride-activities; time-on-ride meter | Faking, demand characteristics |
| **Work values** | "Trade-off Island" point allocation with consequences | Spend tokens across value-islands; consequences animate | Social desirability, central tendency |
| **Learning style** | Same lesson in 4 formats; measure performance per format | Choose-your-format lesson; quiz scores per modality | Social desirability, low-validity self-report |
| **Decision style (maximiser/satisficer, impulsivity)** | Info-gathering before a timed choice; "two doors" task | Clue-cards you may open before deciding; timer | Social desirability |
| **Soft skills (comm/collab/problem-solving)** | Branching SJT sims with NPCs | Animated dialogue tree; consequence ripples | Social desirability, demand characteristics |
| **Grit / persistence** | Time-on-task on a very hard / unsolvable puzzle; return-after-failure | Puzzle with a "give up" door that's always visible | Social desirability |
| **Social perceptiveness / EQ** | Read-the-emotion micro-clips; conversation-fork choices | Face/affect micro-animations; pick the read | Self-report distortion |
| **Cognitive abilities** | Already games (N-Back, Stroop, Corsi, etc.) — keep | — | (Performance, inherently behavioural) |
| **Wellness (mood/anxiety)** | **Keep validated screeners** (PHQ/GAD) — do NOT gamify | — | (See §6 — clinical exception) |

---

## 5. Ten novel game / animation concepts (build-ready seeds)

1. **Trade-off Island (work values).** Six small islands each represent a value (income, autonomy, helping, security, prestige, creativity). The learner has limited "life tokens" and must build their island — every investment animates a consequence (a tall income tower but a small "free-time" beach). Revealed-preference values, zero rating scales.
2. **The In-Tray (UG conscientiousness + judgement + stress).** A ticking inbox of 6 messages (an angry client, a vague boss ask, a teammate's request). Drag to prioritise; some are traps. Scored on order, speed and choices — an entire personality + judgement read in 8 minutes.
3. **Balloon Vault (risk).** Pump a balloon; each pump = +stars but rising pop chance; bank anytime. Pure behavioural risk appetite with a satisfying inflate/pop animation. (Class-5 version: gentler odds, friendly balloon.)
4. **Career Theme-Park (interests).** A park of activity "rides" (a coding ride, a debate ride, a build-it ride). The learner roams and rides what appeals; **dwell time + revisits = interest**, far more honest than RIASEC Likert.
5. **Trust Vault (agreeableness/cooperation).** A repeated Trust game with an NPC; coins multiply when shared and returned. Animation of coins flowing into a shared vault and splitting. Measures cooperation and reciprocity behaviourally.
6. **Pressure Cooker (stress tolerance).** A steadiness trace task while a pressure gauge climbs and distractors pop in. Measures performance degradation and recovery under load — the thing neuroticism self-reports try (and fail) to capture.
7. **Two Doors (decision style).** Timed dilemmas with optional "clue cards" you may open before choosing. Number of clues opened = deliberation/maximising; time-to-decide = impulsivity. Animated doors and a shrinking timer.
8. **Honest Dice (integrity).** A solo "report your roll for points" task where the system actually knows the roll. Over-reporting is the behavioural integrity signal. Handled privately and ethically (never shown back to the learner as "you cheated").
9. **Format Lab (real learning style).** One concept taught as video, text, diagram and hands-on; short quiz after each. The format where the learner *performs best* is the finding — replaces the low-validity, easily-faked VARK survey.
10. **Day-as-a-___ (career-domain sim).** A 2-minute branching day in a chosen domain (a day as a doctor / founder / analyst). Choices reveal fit, workstyle and values in context. Animated scene transitions; consequences ripple into the next scene.

Shared animation language to keep it cohesive: flat, friendly, **consequence-driven** (every choice visibly changes the world), no win/lose framing, and **micro-feedback that never reveals what's being scored**.

---

## 6. Embedded validity & honest exceptions

- **Run silent validity telemetry on every flow:** per-item latency, long-string runs, attention-check pass/fail, answer-change counts, and (Users 3–5) a short social-desirability + over-claiming + infrequency set. Output a **validity band** on each report (e.g., "high confidence" / "interpret with caution") instead of silently averaging compromised data.
- **Correct, don't just flag:** where a social-desirability score is high, down-weight the self-report blocks and lean on the game/sim scores in the final composite.
- **Faking-resistant scoring:** score forced-choice with Thurstonian IRT; use IRT/CAT for cognitive items (also enables adaptive shortening); weight behavioural tasks above self-report in the composite; combine methods with confidence-weighted fusion, not naive means.
- **Important exception — wellness.** Do **not** gamify or disguise mental-health screening. Keep PHQ/GAD/SI items as validated self-report, clearly framed, with the distress flag → counsellor + iCall referral. Behavioural proxies for distress are neither valid nor safe, and hiding the intent would be unethical. This is the one place self-report stays.
- **Fairness checks:** monitor every game and item for differential item functioning across language/gender/region; prefer figural, culture-fair designs; offer regional-language stems and narration.

---

## 7. One-line summary

Make MBS **behaviour-first**: convert the fakeable self-reports (personality, interests, values, soft skills, integrity, risk, learning style) into minigames, simulations and economic games where the trait is a *by-product* of play; use forced-choice and SJTs where a behavioural task isn't practical; run silent validity telemetry to catch and correct the faking that remains; and keep only clinical wellness screening as honest self-report. The result is an assessment that's more engaging *and* much harder to game.
