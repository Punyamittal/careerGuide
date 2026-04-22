"use client";

import { useMemo, useState } from "react";

/** Mirrors backend `patchIntakeSchema` body (camelCase). */
export type IntakePayload = {
  age: number;
  gender: "female" | "male" | "non_binary" | "prefer_not" | "self_describe";
  genderSelfDescribe?: string;
  educationLevel:
    | "below_10"
    | "class_10"
    | "class_11"
    | "class_12"
    | "college_y1"
    | "bachelors_y2"
    | "bachelors_y3"
    | "bachelors_y4"
    | "postgrad_other";
  projectsSummary: string;
  leadershipFollowership: number;
  individualismGroupism: number;
  classroomPreference: "alone" | "group";
  socialTalkingEnjoy: "yes" | "sometimes" | "no";
  communicationEffort: "effort" | "effortless" | "mixed";
  energyRecharge: "alone" | "people" | "both";
  devicePreference: "phone" | "computer" | "both";
  interestFocus: "tools_technology" | "people_world" | "both";
  subjectOrientation: "stem" | "humanities_social" | "both";
  motivationDriver: "money" | "recognition" | "impact" | "stability" | "unsure";
  workSetting: "inside" | "outside" | "mixed";
  workStyle: "individual" | "group" | "both";
  publicExposure: "low" | "medium" | "high";
  parentCareerExpectation: "specific_career" | "broad_field" | "my_choice" | "low_pressure" | "unsure";
  supportSources: Array<"parents" | "friends" | "teachers" | "mentors" | "self">;
  problemAreas: Array<
    | "studies_subjects"
    | "family_pressure"
    | "friends_social"
    | "communication"
    | "decision_confusion"
    | "resources_access"
    | "motivation"
    | "none"
  >;
  learningApproach: "procedural" | "explanatory" | "mixed";
  psychologyAwareness: "yes" | "partial" | "no";
  wellbeingSelfReport: "good" | "okay" | "low" | "prefer_not";
  ambitionNotes: string;
  skillsSelfReport: string;
  comfort?: Record<string, number>;
};

export const defaultIntakePayload = (): IntakePayload => ({
  age: 16,
  gender: "prefer_not",
  educationLevel: "class_11",
  projectsSummary: "",
  leadershipFollowership: 3,
  individualismGroupism: 3,
  classroomPreference: "alone",
  socialTalkingEnjoy: "sometimes",
  communicationEffort: "mixed",
  energyRecharge: "both",
  devicePreference: "both",
  interestFocus: "both",
  subjectOrientation: "both",
  motivationDriver: "unsure",
  workSetting: "mixed",
  workStyle: "both",
  publicExposure: "medium",
  parentCareerExpectation: "unsure",
  supportSources: [],
  problemAreas: [],
  learningApproach: "mixed",
  psychologyAwareness: "partial",
  wellbeingSelfReport: "okay",
  ambitionNotes: "",
  skillsSelfReport: ""
});

const EDU_OPTIONS: { value: IntakePayload["educationLevel"]; label: string }[] = [
  { value: "below_10", label: "Below Class 10th" },
  { value: "class_10", label: "Class 10th" },
  { value: "class_11", label: "Class 11th" },
  { value: "class_12", label: "Class 12th" },
  { value: "college_y1", label: "College 1st year" },
  { value: "bachelors_y2", label: "Bachelor’s 2nd year" },
  { value: "bachelors_y3", label: "Bachelor’s 3rd year" },
  { value: "bachelors_y4", label: "Bachelor’s 4th year" },
  { value: "postgrad_other", label: "Postgraduate / other" }
];

const COMFORT_FIELDS: { key: string; label: string }[] = [
    { key: "blood_syringe", label: "See blood / syringe (medical sensitivity)" },
    { key: "cook_food", label: "Cook food" },
    { key: "clean_space", label: "Clean room / house" },
    { key: "talk_favors", label: "Ask people for favors" },
    { key: "negotiate_shop", label: "Negotiate in a shop" },
    { key: "fix_tech", label: "Fix computer / phone" },
    { key: "selfies_photos", label: "Take selfies / photos" },
    { key: "mathematics", label: "Mathematics" },
    { key: "routine_tasks", label: "Daily routine tasks" },
    { key: "impress_others", label: "Impress people around me" },
    { key: "extreme_climate", label: "Very hot / humid / cold conditions" },
    { key: "dangerous_situations", label: "Risky or dangerous situations" },
    { key: "work_discipline", label: "General work discipline" },
    { key: "impress_parents", label: "Meet parents’ expectations" },
    { key: "talk_phone", label: "Talk on the phone" }
  ];

type ComfortDraft = Record<string, string>;

function emptyComfortDraft(): ComfortDraft {
  const o: ComfortDraft = {};
  for (const { key } of COMFORT_FIELDS) o[key] = "";
  return o;
}

function buildComfort(draft: ComfortDraft): Record<string, number> | undefined {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(draft)) {
    const t = v.trim();
    if (!t) continue;
    const n = Number(t);
    if (Number.isFinite(n) && n >= 1 && n <= 10) out[k] = Math.round(n);
  }
  return Object.keys(out).length ? out : undefined;
}

type Props = {
  onSubmit: (payload: IntakePayload) => Promise<void>;
  onDiscard: () => void;
  busy?: boolean;
};

export function AssessmentIntakeForm({ onSubmit, onDiscard, busy }: Props) {
  const [form, setForm] = useState<IntakePayload>(() => defaultIntakePayload());
  const [comfort, setComfort] = useState<ComfortDraft>(() => emptyComfortDraft());
  const [localError, setLocalError] = useState<string | null>(null);

  const toggleSupport = (v: IntakePayload["supportSources"][number]) => {
    setForm((f) => {
      const set = new Set(f.supportSources);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      return { ...f, supportSources: [...set] };
    });
  };

  const toggleProblem = (v: IntakePayload["problemAreas"][number]) => {
    setForm((f) => {
      let next = [...f.problemAreas];
      if (v === "none") {
        next = ["none"];
      } else {
        next = next.filter((x) => x !== "none");
        if (next.includes(v)) next = next.filter((x) => x !== v);
        else next.push(v);
      }
      return { ...f, problemAreas: next };
    });
  };

  const fieldClass =
    "mt-1 w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100";

  const labelClass = "block text-xs font-bold uppercase tracking-wide text-cg-muted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (form.age < 8 || form.age > 80) {
      setLocalError("Enter an age between 8 and 80.");
      return;
    }
    if (form.gender === "self_describe" && !form.genderSelfDescribe?.trim()) {
      setLocalError("Please describe how you identify.");
      return;
    }
    const comfortPayload = buildComfort(comfort);
    const payload: IntakePayload = { ...form, ...(comfortPayload ? { comfort: comfortPayload } : {}) };
    await onSubmit(payload);
  };

  const supportOpts = useMemo(
    () =>
      [
        { id: "parents" as const, label: "Parents" },
        { id: "friends" as const, label: "Friends" },
        { id: "teachers" as const, label: "Teachers" },
        { id: "mentors" as const, label: "Mentors" },
        { id: "self" as const, label: "Mostly myself" }
      ] as const,
    []
  );

  const problemOpts = useMemo(
    () =>
      [
        { id: "studies_subjects" as const, label: "Studies / subjects" },
        { id: "family_pressure" as const, label: "Family pressure" },
        { id: "friends_social" as const, label: "Friends / social circle" },
        { id: "communication" as const, label: "Communication" },
        { id: "decision_confusion" as const, label: "Decision / direction confusion" },
        { id: "resources_access" as const, label: "Resources / access" },
        { id: "motivation" as const, label: "Motivation" },
        { id: "none" as const, label: "None of these (right now)" }
      ] as const,
    []
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      <div className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <h2 className="font-display text-lg font-bold text-cg-text">Learner profile (before the questions)</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-cg-muted">
          This matches your framework: demographics, social preferences, work-style fit, comfort/discomfort signals,
          context (support, pressure), and free-text projects/skills. Answers stay with this attempt and feed your
          report. Internship/project files (PDF/Word/PPTX) can be added later—use the text box for now.
        </p>
        <p className="mt-2 text-xs font-medium text-cg-muted">
          Confidential; no right or wrong answers. Answer for how you are now.
        </p>
      </div>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">1. About you</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="intake-age">
              Age
            </label>
            <input
              id="intake-age"
              type="number"
              min={8}
              max={80}
              required
              className={fieldClass}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-gender">
              Gender
            </label>
            <select
              id="intake-gender"
              className={fieldClass}
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gender: e.target.value as IntakePayload["gender"]
                }))
              }
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not">Prefer not to say</option>
              <option value="self_describe">Self-describe</option>
            </select>
          </div>
          {form.gender === "self_describe" ? (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="intake-gender-sd">
                How you identify
              </label>
              <input
                id="intake-gender-sd"
                className={fieldClass}
                maxLength={80}
                value={form.genderSelfDescribe ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, genderSelfDescribe: e.target.value }))}
              />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="intake-edu">
              Current education
            </label>
            <select
              id="intake-edu"
              className={fieldClass}
              value={form.educationLevel}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  educationLevel: e.target.value as IntakePayload["educationLevel"]
                }))
              }
            >
              {EDU_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">2. Internships, projects & skills</legend>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass} htmlFor="intake-projects">
              Projects / internships (text)
            </label>
            <textarea
              id="intake-projects"
              rows={4}
              maxLength={8000}
              className={fieldClass}
              placeholder="What you did, tools used, outcomes…"
              value={form.projectsSummary}
              onChange={(e) => setForm((f) => ({ ...f, projectsSummary: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-skills">
              Skills you would list (comma or short bullets)
            </label>
            <textarea
              id="intake-skills"
              rows={3}
              maxLength={4000}
              className={fieldClass}
              placeholder="e.g. Python, public speaking, video editing…"
              value={form.skillsSelfReport}
              onChange={(e) => setForm((f) => ({ ...f, skillsSelfReport: e.target.value }))}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">3. Social & learning preferences</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Leadership ↔ followership (1 = follower, 5 = leader)</label>
            <input
              type="range"
              min={1}
              max={5}
              className="mt-2 w-full accent-emerald-700"
              value={form.leadershipFollowership}
              onChange={(e) => setForm((f) => ({ ...f, leadershipFollowership: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-cg-muted">Current: {form.leadershipFollowership}</p>
          </div>
          <div>
            <label className={labelClass}>Individualistic ↔ group-oriented (1 = individual, 5 = group)</label>
            <input
              type="range"
              min={1}
              max={5}
              className="mt-2 w-full accent-emerald-700"
              value={form.individualismGroupism}
              onChange={(e) => setForm((f) => ({ ...f, individualismGroupism: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-cg-muted">Current: {form.individualismGroupism}</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-classroom">
              Classroom seating preference
            </label>
            <select
              id="intake-classroom"
              className={fieldClass}
              value={form.classroomPreference}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  classroomPreference: e.target.value as IntakePayload["classroomPreference"]
                }))
              }
            >
              <option value="alone">Alone</option>
              <option value="group">With a group</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-talk">
              I like talking to people
            </label>
            <select
              id="intake-talk"
              className={fieldClass}
              value={form.socialTalkingEnjoy}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  socialTalkingEnjoy: e.target.value as IntakePayload["socialTalkingEnjoy"]
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="sometimes">Sometimes</option>
              <option value="no">Not really</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="intake-comm">
              When I talk to people
            </label>
            <select
              id="intake-comm"
              className={fieldClass}
              value={form.communicationEffort}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  communicationEffort: e.target.value as IntakePayload["communicationEffort"]
                }))
              }
            >
              <option value="effort">It takes effort</option>
              <option value="effortless">It feels effortless</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-energy">
              Energy recharge
            </label>
            <select
              id="intake-energy"
              className={fieldClass}
              value={form.energyRecharge}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  energyRecharge: e.target.value as IntakePayload["energyRecharge"]
                }))
              }
            >
              <option value="alone">Mostly when alone</option>
              <option value="people">Mostly with people</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-device">
              Device use
            </label>
            <select
              id="intake-device"
              className={fieldClass}
              value={form.devicePreference}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  devicePreference: e.target.value as IntakePayload["devicePreference"]
                }))
              }
            >
              <option value="phone">Phone more</option>
              <option value="computer">Computer more</option>
              <option value="both">About equal</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-interest">
              What fascinates you more
            </label>
            <select
              id="intake-interest"
              className={fieldClass}
              value={form.interestFocus}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  interestFocus: e.target.value as IntakePayload["interestFocus"]
                }))
              }
            >
              <option value="tools_technology">Tools &amp; technology</option>
              <option value="people_world">People &amp; the world</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-subject">
              Subject lean
            </label>
            <select
              id="intake-subject"
              className={fieldClass}
              value={form.subjectOrientation}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  subjectOrientation: e.target.value as IntakePayload["subjectOrientation"]
                }))
              }
            >
              <option value="stem">Science &amp; mathematics</option>
              <option value="humanities_social">Languages &amp; social sciences</option>
              <option value="both">Both / unsure</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="intake-motivation">
              Motivation driver (right now)
            </label>
            <select
              id="intake-motivation"
              className={fieldClass}
              value={form.motivationDriver}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  motivationDriver: e.target.value as IntakePayload["motivationDriver"]
                }))
              }
            >
              <option value="money">Earn well</option>
              <option value="recognition">Recognition / visibility</option>
              <option value="impact">Impact / meaning</option>
              <option value="stability">Stability</option>
              <option value="unsure">Unsure</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-learn">
              Learning approach
            </label>
            <select
              id="intake-learn"
              className={fieldClass}
              value={form.learningApproach}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  learningApproach: e.target.value as IntakePayload["learningApproach"]
                }))
              }
            >
              <option value="procedural">Step-by-step / practice-heavy</option>
              <option value="explanatory">Big-picture / exploratory</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-psych">
              Basic psychology terms (awareness)
            </label>
            <select
              id="intake-psych"
              className={fieldClass}
              value={form.psychologyAwareness}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  psychologyAwareness: e.target.value as IntakePayload["psychologyAwareness"]
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="partial">Partially</option>
              <option value="no">Not really</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">4. Work environment</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="intake-ws">
              Work setting
            </label>
            <select
              id="intake-ws"
              className={fieldClass}
              value={form.workSetting}
              onChange={(e) =>
                setForm((f) => ({ ...f, workSetting: e.target.value as IntakePayload["workSetting"] }))
              }
            >
              <option value="inside">Mostly inside</option>
              <option value="outside">Mostly outside</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-wstyle">
              Work style
            </label>
            <select
              id="intake-wstyle"
              className={fieldClass}
              value={form.workStyle}
              onChange={(e) => setForm((f) => ({ ...f, workStyle: e.target.value as IntakePayload["workStyle"] }))}
            >
              <option value="individual">Individual</option>
              <option value="group">Group</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-pub">
              Public exposure
            </label>
            <select
              id="intake-pub"
              className={fieldClass}
              value={form.publicExposure}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  publicExposure: e.target.value as IntakePayload["publicExposure"]
                }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">5. Context & support</legend>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass} htmlFor="intake-parent">
              What parents / guardians seem to want (your read)
            </label>
            <select
              id="intake-parent"
              className={fieldClass}
              value={form.parentCareerExpectation}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  parentCareerExpectation: e.target.value as IntakePayload["parentCareerExpectation"]
                }))
              }
            >
              <option value="specific_career">Stick to a specific career</option>
              <option value="broad_field">Stick to a broad field</option>
              <option value="my_choice">They want my choice</option>
              <option value="low_pressure">Low pressure / don’t worry</option>
              <option value="unsure">Unsure</option>
            </select>
          </div>
          <div>
            <p className={labelClass}>Support you draw on (check any)</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {supportOpts.map((o) => (
                <li key={o.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-cg-text">
                    <input
                      type="checkbox"
                      className="accent-emerald-700"
                      checked={form.supportSources.includes(o.id)}
                      onChange={() => toggleSupport(o.id)}
                    />
                    {o.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={labelClass}>Problem areas (check any)</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {problemOpts.map((o) => (
                <li key={o.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-cg-text">
                    <input
                      type="checkbox"
                      className="accent-emerald-700"
                      checked={form.problemAreas.includes(o.id)}
                      onChange={() => toggleProblem(o.id)}
                    />
                    {o.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-wellbeing">
              Overall wellbeing (self-report)
            </label>
            <select
              id="intake-wellbeing"
              className={fieldClass}
              value={form.wellbeingSelfReport}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  wellbeingSelfReport: e.target.value as IntakePayload["wellbeingSelfReport"]
                }))
              }
            >
              <option value="good">Good</option>
              <option value="okay">Okay</option>
              <option value="low">Low / struggling</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="intake-ambition">
              Ambitions & goals (short)
            </label>
            <textarea
              id="intake-ambition"
              rows={3}
              maxLength={2000}
              className={fieldClass}
              placeholder="Career goals, life aspirations, what growth means to you…"
              value={form.ambitionNotes}
              onChange={(e) => setForm((f) => ({ ...f, ambitionNotes: e.target.value }))}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)] md:p-6">
        <legend className="px-1 font-display text-sm font-bold text-cg-text">
          6. Comfort scale (optional)
        </legend>
        <p className="mt-2 text-xs font-medium text-cg-muted">
          1 = very uncomfortable / hard · 10 = comfortable / easy. Leave blank to skip a row.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {COMFORT_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className="text-xs font-medium text-cg-text" htmlFor={`comfort-${key}`}>
                {label}
              </label>
              <input
                id={`comfort-${key}`}
                type="number"
                min={1}
                max={10}
                placeholder="—"
                className={fieldClass}
                value={comfort[key] ?? ""}
                onChange={(e) => setComfort((c) => ({ ...c, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {localError ? (
        <p className="rounded-xl border-2 border-red-800 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">{localError}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile & start questions"}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={busy}
          className="rounded-xl border-2 border-slate-500 bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800 shadow-[3px_3px_0_0_rgb(71,85,105)] disabled:opacity-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
        >
          Discard session
        </button>
      </div>
    </form>
  );
}
