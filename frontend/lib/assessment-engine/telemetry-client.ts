import { api } from "@/lib/api";
import type { AdaptiveState, TelemetryEvent } from "./types";

const FLUSH_INTERVAL_MS = 5000;
const FLUSH_BATCH_SIZE = 20;

export class TelemetryClient {
  private buffer: TelemetryEvent[] = [];
  private seq = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sessionId: string,
    private moduleId: string,
    private getAdaptiveState: () => AdaptiveState
  ) {}

  start() {
    this.emit({ eventType: "session_start" });
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
  }

  emit(event: TelemetryEvent) {
    this.buffer.push({ ...event, engineType: event.engineType });
    if (this.buffer.length >= FLUSH_BATCH_SIZE) void this.flush();
  }

  async flush() {
    if (!this.buffer.length) return;
    const events = this.buffer.splice(0, FLUSH_BATCH_SIZE);
    this.seq += 1;
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
      this.buffer.unshift(...events);
    }
  }

  async complete() {
    this.emit({ eventType: "module_complete" });
    if (this.timer) clearInterval(this.timer);
    await this.flush();
    await api(`/assessment/sessions/${this.sessionId}/score`, {
      method: "POST",
      body: JSON.stringify({ provider: "rule" })
    });
  }

  abort() {
    this.emit({ eventType: "session_abort" });
    if (this.timer) clearInterval(this.timer);
    void this.flush();
  }
}

export async function startAssessmentSession(moduleId: string) {
  const res = await api<{ session: { id: string; module_id: string } }>("/assessment/sessions", {
    method: "POST",
    body: JSON.stringify({ moduleId })
  });
  if (!res.data?.session) throw new Error("Could not start session");
  return res.data.session;
}
