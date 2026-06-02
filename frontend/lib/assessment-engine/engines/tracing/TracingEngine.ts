import Phaser from "phaser";
import { api } from "@/lib/api";
import { T4_CONFIG } from "../../configs/T4.config";

type TracingEngineOptions = {
  container: HTMLElement;
  moduleId: string;
  sessionId: string;
  onComplete?: (summary: Record<string, unknown>) => void;
  onReady?: () => void;
};

class TracingScene extends Phaser.Scene {
  private pathPoints: Phaser.Math.Vector2[] = [];
  private drawn: Phaser.Math.Vector2[] = [];
  private trialIndex = 0;
  private startMs = 0;
  private sessionId = "";
  private seq = 0;
  private results: { pathAccuracy: number; completionSpeed: number }[] = [];

  constructor() {
    super({ key: "TracingScene" });
  }

  init(data: { sessionId: string }) {
    this.sessionId = data.sessionId;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor("#f8fafc");
    this.add
      .text(w / 2, 24, "Trace the highlighted path with your pointer", {
        fontSize: "16px",
        color: "#334155"
      })
      .setOrigin(0.5, 0);
    this.startTrial();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.drawn = [new Phaser.Math.Vector2(p.x, p.y)];
      this.startMs = Date.now();
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.drawn.push(new Phaser.Math.Vector2(p.x, p.y));
      const g = this.add.graphics();
      g.lineStyle(3, 0x059669, 0.9);
      const prev = this.drawn[this.drawn.length - 2];
      g.lineBetween(prev.x, prev.y, p.x, p.y);
    });
    this.input.on("pointerup", () => void this.finishTrial());
  }

  private startTrial() {
    this.drawn = [];
    this.children.each((c) => {
      if (c.type === "Graphics") c.destroy();
    });
    const w = this.scale.width;
    const h = this.scale.height;
    const margin = 48;
    const n = T4_CONFIG.paths[this.trialIndex]?.points ?? 12;
    this.pathPoints = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = margin + t * (w - margin * 2);
      const y = h * 0.35 + Math.sin(t * Math.PI * 2) * (h * 0.22);
      this.pathPoints.push(new Phaser.Math.Vector2(x, y));
    }
    const g = this.add.graphics();
    g.lineStyle(4, 0x94a3b8, 0.85);
    g.beginPath();
    this.pathPoints.forEach((pt, i) => (i === 0 ? g.moveTo(pt.x, pt.y) : g.lineTo(pt.x, pt.y)));
    g.strokePath();
    this.add
      .text(w / 2, h - 36, `Trial ${this.trialIndex + 1} / ${T4_CONFIG.trials}`, {
        fontSize: "14px",
        color: "#64748b"
      })
      .setOrigin(0.5);
  }

  private pathAccuracy(): number {
    if (!this.drawn.length || !this.pathPoints.length) return 0;
    let err = 0;
    for (const pt of this.drawn) {
      let min = Infinity;
      for (const ref of this.pathPoints) {
        min = Math.min(min, Phaser.Math.Distance.Between(pt.x, pt.y, ref.x, ref.y));
      }
      err += min;
    }
    const avgErr = err / this.drawn.length;
    return Math.max(0, Math.min(1, 1 - avgErr / 80));
  }

  private async emitTrial(pathAccuracy: number, completionSpeed: number) {
    this.seq += 1;
    await api(`/assessment/sessions/${this.sessionId}/telemetry`, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            itemId: `trial-${this.trialIndex + 1}`,
            eventType: "response",
            responseValue: { pathAccuracy, completionSpeed },
            responseCorrect: pathAccuracy >= 0.55,
            responseTimeMs: Math.round(1000 / Math.max(0.2, completionSpeed)),
            engineType: "tracing",
            difficultyLevel: T4_CONFIG.paths[this.trialIndex]?.difficulty ?? 1
          }
        ],
        clientSeq: this.seq
      })
    }).catch(() => undefined);
  }

  private async finishTrial() {
    const elapsed = Math.max(1, Date.now() - this.startMs);
    const pathAccuracy = this.pathAccuracy();
    const completionSpeed = Math.min(1, 8000 / elapsed);
    this.results.push({ pathAccuracy, completionSpeed });
    await this.emitTrial(pathAccuracy, completionSpeed);
    this.trialIndex += 1;
    if (this.trialIndex >= T4_CONFIG.trials) {
      await this.completeModule();
      return;
    }
    this.scene.restart({ sessionId: this.sessionId });
  }

  private async completeModule() {
    const meanAcc =
      this.results.reduce((a, r) => a + r.pathAccuracy, 0) / Math.max(1, this.results.length);
    const meanSpeed =
      this.results.reduce((a, r) => a + r.completionSpeed, 0) / Math.max(1, this.results.length);
    const summary = {
      categoryScores: { pathAccuracy: meanAcc, completionSpeed: meanSpeed },
      dominantPattern: meanAcc >= 0.7 ? "Precise tracing" : "Developing coordination",
      consistencyScore: meanAcc
    };
    await api(`/assessment/sessions/${this.sessionId}/telemetry`, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            itemId: "session",
            eventType: "module_complete",
            metadata: { eventType: "module_complete", sessionSummary: summary }
          }
        ],
        clientSeq: this.seq + 1
      })
    }).catch(() => undefined);
    await api(`/assessment/sessions/${this.sessionId}/score`, {
      method: "POST",
      body: JSON.stringify({ provider: "rule", clientSummary: summary })
    }).catch(() => undefined);
    this.registry.set("summary", summary);
    this.scene.start("TracingCompleteScene");
  }
}

class TracingCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: "TracingCompleteScene" });
  }
  create() {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Path tracing complete ✓", {
        fontSize: "22px",
        color: "#0f172a"
      })
      .setOrigin(0.5);
  }
}

export async function createTracingEngine(options: TracingEngineOptions) {
  const rect = options.container.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 640));
  const height = Math.max(400, Math.floor(rect.height || 480));

  let game: Phaser.Game | null = null;
  let onComplete = options.onComplete;

  await new Promise<void>((resolve) => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: options.container,
      width,
      height,
      backgroundColor: "#f8fafc",
      scene: [TracingScene, TracingCompleteScene],
      audio: { noAudio: true },
      banner: false
    });
    game.scene.start("TracingScene", { sessionId: options.sessionId });
    game.events.once("ready", () => {
      options.onReady?.();
      resolve();
    });
    setTimeout(resolve, 400);
  });

  const completeScene = game?.scene.getScene("TracingCompleteScene");
  if (completeScene) {
    completeScene.events?.once?.("create", () => {
      const summary = game?.registry.get("summary");
      if (summary) onComplete?.(summary);
    });
  }

  return {
    next: () => undefined,
    previous: () => undefined,
    submit: () => undefined,
    destroy: () => {
      game?.destroy(true, false);
      game = null;
      options.container.replaceChildren();
    }
  };
}
