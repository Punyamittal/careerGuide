"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssessmentIntakeForm, type IntakePayload } from "@/components/assessment/intake-form";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

type AssessmentKey = "early_g5" | "middle_g8" | "stream_g910" | "career_g11";

type Attempt = {
  id: string;
  status: string;
  assessmentKey: AssessmentKey;
};

type QuestionOption = {
  key: string;
  text: string;
};

type Question = {
  id: string;
  category: string;
  stem: string;
  useLikert?: boolean;
  options?: QuestionOption[];
};

type StepResponse = {
  done: boolean;
  progress?: { index: number; total: number };
  nextQuestion?: Question;
};

const TRACK_LABELS: Record<AssessmentKey, string> = {
  early_g5: "Early Learner Snapshot",
  middle_g8: "Middle Learner Snapshot",
  stream_g910: "Stream Suggestion",
  career_g11: "Career Guidance"
};

function normalizeTrack(raw: string | null): AssessmentKey {
  if (raw === "early_g5" || raw === "middle_g8" || raw === "stream_g910" || raw === "career_g11") {
    return raw;
  }
  return "career_g11";
}

export default function AssessmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const track = useMemo(() => normalizeTrack(search.get("track")), [search]);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [step, setStep] = useState<StepResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likertValue, setLikertValue] = useState<number | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("");
  const [writingText, setWritingText] = useState("");

  const loadNext = useCallback(async (attemptId: string) => {
    const res = await api<StepResponse>(`/tests/attempts/${attemptId}/next-question`);
    setStep(res.data ?? null);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/register");
      return;
    }
    let cancelled = false;
    async function start() {
      setError(null);
      setBusy(true);
      try {
        const res = await api<{ attempt: Attempt }>("/tests/attempts", {
          method: "POST",
          body: JSON.stringify({ assessmentKey: track })
        });
        if (cancelled || !res.data?.attempt) return;
        setAttempt(res.data.attempt);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not start assessment.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void start();
    return () => {
      cancelled = true;
    };
  }, [loading, router, track, user]);

  const handleIntakeSubmit = useCallback(
    async (payload: IntakePayload) => {
      if (!attempt) return;
      setBusy(true);
      setError(null);
      try {
        await api(`/tests/attempts/${attempt.id}/intake`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        await loadNext(attempt.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save intake.");
      } finally {
        setBusy(false);
      }
    },
    [attempt, loadNext]
  );

  const submitCurrentAnswer = useCallback(async () => {
    if (!attempt || !step?.nextQuestion) return;
    const q = step.nextQuestion;

    const response: Record<string, unknown> = {
      questionId: q.id
    };

    if (q.category === "writing") {
      if (!writingText.trim()) {
        setError("Please write your response before continuing.");
        return;
      }
      response.writingText = writingText.trim();
    } else if (q.useLikert) {
      if (!likertValue) {
        setError("Please choose a rating before continuing.");
        return;
      }
      response.likertValue = likertValue;
    } else {
      if (!selectedOptionKey) {
        setError("Please select an option before continuing.");
        return;
      }
      response.selectedOptionKey = selectedOptionKey;
    }

    setBusy(true);
    setError(null);
    try {
      await api(`/tests/attempts/${attempt.id}/responses`, {
        method: "PATCH",
        body: JSON.stringify({ responses: [response] })
      });
      setLikertValue(null);
      setSelectedOptionKey("");
      setWritingText("");
      await loadNext(attempt.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save answer.");
    } finally {
      setBusy(false);
    }
  }, [attempt, likertValue, loadNext, selectedOptionKey, step?.nextQuestion, writingText]);

  const finishAttempt = useCallback(async () => {
    if (!attempt) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/tests/attempts/${attempt.id}/submit`, { method: "POST" });
      await api(`/reports/attempts/${attempt.id}/generate`, { method: "POST" });
      router.push(`/report/${attempt.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit attempt.");
    } finally {
      setBusy(false);
    }
  }, [attempt, router]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-5 shadow-[var(--cg-3d-shadow)]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cg-muted">Assessment</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-cg-text">{TRACK_LABELS[track]}</h1>
        <p className="mt-2 text-sm text-cg-muted">
          Complete onboarding intake and answer adaptive questions to generate your career report.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border-2 border-red-800 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </p>
      ) : null}

      {!attempt ? (
        <p className="mt-6 text-sm text-cg-muted">{busy ? "Starting assessment..." : "Preparing assessment..."}</p>
      ) : null}

      {attempt && !step ? (
        <AssessmentIntakeForm
          busy={busy}
          onSubmit={handleIntakeSubmit}
          onDiscard={() => router.push("/overview?tab=assessments")}
        />
      ) : null}

      {attempt && step?.done ? (
        <section className="mt-6 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
          <h2 className="font-display text-xl font-bold text-cg-text">Assessment complete</h2>
          <p className="mt-2 text-sm text-cg-muted">All adaptive steps are done. Submit to generate your report.</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void finishAttempt()}
              disabled={busy}
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)] disabled:opacity-60"
            >
              {busy ? "Submitting..." : "Submit & open report"}
            </button>
            <Link
              href="/overview?tab=assessments"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            >
              Back to assessments
            </Link>
          </div>
        </section>
      ) : null}

      {attempt && step?.nextQuestion ? (
        <section className="mt-6 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-6 shadow-[var(--cg-3d-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cg-muted">
            Question {step.progress?.index ?? "-"} of {step.progress?.total ?? "-"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-cg-text">{step.nextQuestion.stem}</h2>

          {step.nextQuestion.category === "writing" ? (
            <textarea
              className="mt-4 w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-sm text-cg-text"
              rows={5}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Write your response..."
            />
          ) : step.nextQuestion.useLikert ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLikertValue(value)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                    likertValue === value
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-[var(--cg-3d-border)] bg-white text-cg-text"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {(step.nextQuestion.options ?? []).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOptionKey(opt.key)}
                  className={`block w-full rounded-xl border-2 px-3 py-2 text-left text-sm ${
                    selectedOptionKey === opt.key
                      ? "border-emerald-700 bg-emerald-700/10"
                      : "border-[var(--cg-3d-border)] bg-white"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void submitCurrentAnswer()}
              disabled={busy}
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-emerald-800 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)] disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save & next"}
            </button>
            <Link
              href="/overview?tab=assessments"
              className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            >
              Exit
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
