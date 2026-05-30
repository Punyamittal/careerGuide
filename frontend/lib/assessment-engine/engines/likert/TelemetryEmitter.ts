import { api } from "@/lib/api";
import { likertLog } from "./debug";

export type LikertTelemetryPayload = {
  sessionId: string;
  moduleId: string;
  itemId: string;
  response: unknown;
  responseTime: number;
  interactionCount: number;
  changedAnswer: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const BATCH_SIZE = 5;

export class TelemetryEmitter {
  private buffer: LikertTelemetryPayload[] = [];
  private seq = 0;

  constructor(
    private sessionId: string,
    private moduleId: string,
    private getAdaptiveState: () => Record<string, unknown>
  ) {}

  emit(partial: Omit<LikertTelemetryPayload, "sessionId" | "moduleId" | "timestamp">) {
    likertLog("telemetry-emit", {
      itemId: partial.itemId,
      response: partial.response,
      eventType: partial.metadata?.eventType ?? "response"
    });
    this.buffer.push({
      sessionId: this.sessionId,
      moduleId: this.moduleId,
      timestamp: new Date().toISOString(),
      ...partial
    });
    if (this.buffer.length >= BATCH_SIZE) {
      void this.flush();
    }
  }

  async flush() {
    if (!this.buffer.length) return;
    const batch = this.buffer.splice(0, BATCH_SIZE);
    this.seq += 1;

    const events = batch.map((b) => ({
      itemId: b.itemId,
      eventType: "response" as const,
      stimulusId: b.itemId,
      responseValue: {
        response: b.response,
        interactionCount: b.interactionCount,
        changedAnswer: b.changedAnswer
      },
      responseTimeMs: b.responseTime,
      attemptIndex: b.interactionCount,
      engineType: "likert" as const,
      metadata: b.metadata
    }));

    try {
      await api(`/assessment/sessions/${this.sessionId}/telemetry`, {
        method: "POST",
        body: JSON.stringify({
          events,
          clientSeq: this.seq,
          adaptiveState: this.getAdaptiveState()
        })
      });
    } catch {
      this.buffer.unshift(...batch);
    }
  }

  async finalize() {
    await this.flush();
    while (this.buffer.length) {
      await this.flush();
    }
    try {
      await api(`/assessment/sessions/${this.sessionId}/score`, {
        method: "POST",
        body: "{}"
      });
    } catch {
      /* scoring optional offline */
    }
  }

  emitSessionAnalytics(
    analytics?: Record<string, unknown>,
    summary?: Record<string, unknown>
  ) {
    likertLog("telemetry-session-analytics", { analytics, summary });
    this.emit({
      itemId: "session",
      response: summary ?? analytics,
      responseTime: Number(analytics?.completionDurationMs ?? 0),
      interactionCount: Number(analytics?.itemsAnswered ?? 0),
      changedAnswer: Number(analytics?.answerChangeCount ?? 0) > 0,
      metadata: {
        eventType: "module_complete",
        sessionAnalytics: analytics,
        sessionSummary: summary
      }
    });
  }
}
