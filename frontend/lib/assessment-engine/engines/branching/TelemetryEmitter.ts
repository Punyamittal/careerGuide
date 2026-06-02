import { api } from "@/lib/api";

export type BranchingTelemetryPayload = {
  sessionId: string;
  moduleId: string;
  nodeId: string;
  selectedOption?: string;
  hesitationTime: number;
  changedChoice: boolean;
  branchDepth: number;
  escalationScore: number;
  empathySignal: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const BATCH_SIZE = 5;

export class BranchingTelemetryEmitter {
  private buffer: BranchingTelemetryPayload[] = [];
  private seq = 0;

  constructor(
    private sessionId: string,
    private moduleId: string,
    private getAdaptiveState: () => Record<string, unknown>
  ) {}

  emit(partial: Omit<BranchingTelemetryPayload, "sessionId" | "moduleId" | "timestamp">) {
    this.buffer.push({
      sessionId: this.sessionId,
      moduleId: this.moduleId,
      timestamp: new Date().toISOString(),
      ...partial
    });
    if (this.buffer.length >= BATCH_SIZE) void this.flush();
  }

  async flush() {
    if (!this.buffer.length) return;
    const batch = this.buffer.splice(0, BATCH_SIZE);
    this.seq += 1;

    const events = batch.map((b) => ({
      itemId: b.nodeId,
      eventType: "response" as const,
      stimulusId: b.nodeId,
      responseValue: {
        selectedOption: b.selectedOption,
        hesitationTime: b.hesitationTime,
        changedChoice: b.changedChoice,
        branchDepth: b.branchDepth,
        escalationScore: b.escalationScore,
        empathySignal: b.empathySignal
      },
      responseTimeMs: b.hesitationTime,
      attemptIndex: b.branchDepth,
      engineType: "branching" as const,
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

  async finalize(clientSummary?: Record<string, unknown>) {
    while (this.buffer.length) await this.flush();
    try {
      await api(`/assessment/sessions/${this.sessionId}/score`, {
        method: "POST",
        body: JSON.stringify({
          provider: "rule",
          clientSummary: clientSummary ?? undefined
        })
      });
    } catch {
      /* offline */
    }
  }

  emitSessionComplete(summary?: Record<string, unknown>, analytics?: Record<string, unknown>) {
    this.emit({
      nodeId: "session",
      hesitationTime: 0,
      changedChoice: false,
      branchDepth: 0,
      escalationScore: 0,
      empathySignal: 0,
      metadata: {
        eventType: "module_complete",
        sessionSummary: summary,
        sessionAnalytics: analytics
      }
    });
  }
}
