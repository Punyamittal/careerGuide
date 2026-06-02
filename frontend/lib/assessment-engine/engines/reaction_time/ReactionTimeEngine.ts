import Phaser from "phaser";
import { api } from "@/lib/api";
import { T5_CONFIG } from "../../configs/T5.config";

type ReactionEngineOptions = {
  container: HTMLElement;
  moduleId: string;
  sessionId: string;
  onComplete?: (summary: Record<string, unknown>) => void;
  onReady?: () => void;
};

type TrialSpec = {
  word: string;
  inkHex: number;
  correctName: string;
  congruent: boolean;
};

class StroopScene extends Phaser.Scene {
  private sessionId = "";
  private trial = 0;
  private seq = 0;
  private shownAt = 0;
  private correct = 0;
  private total = 0;
  private rts: number[] = [];
  private current: TrialSpec | null = null;
  private buttons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "StroopScene" });
  }

  init(data: { sessionId: string }) {
    this.sessionId = data.sessionId;
  }

  create() {
    this.cameras.main.setBackgroundColor("#f8fafc");
    this.add
      .text(this.scale.width / 2, 28, "Select the INK color (ignore the word meaning)", {
        fontSize: "15px",
        color: "#334155",
        wordWrap: { width: this.scale.width - 40 }
      })
      .setOrigin(0.5, 0);
    this.scheduleTrial();
  }

  private pickTrial(): TrialSpec {
    const colors = T5_CONFIG.colors;
    const ink = colors[Math.floor(Math.random() * colors.length)];
    const word = colors[Math.floor(Math.random() * colors.length)];
    const congruent = Math.random() < T5_CONFIG.congruentRatio ? ink.name === word.name : ink.name !== word.name;
    const wordColor = congruent ? ink : colors.find((c) => c.name !== ink.name) ?? word;
    return {
      word: word.label,
      inkHex: ink.hex,
      correctName: ink.name,
      congruent
    };
  }

  private scheduleTrial() {
    if (this.trial >= T5_CONFIG.trials) {
      void this.completeModule();
      return;
    }
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
    this.children.each((c) => {
      if (c instanceof Phaser.GameObjects.Text && c.y > 80 && c.y < 200) c.destroy();
    });

    const delay = Phaser.Math.Between(T5_CONFIG.minDelayMs, T5_CONFIG.maxDelayMs);
    this.time.delayedCall(delay, () => {
      this.current = this.pickTrial();
      this.shownAt = Date.now();
      this.add
        .text(this.scale.width / 2, this.scale.height * 0.38, this.current.word, {
          fontSize: "42px",
          color: "#" + this.current.inkHex.toString(16).padStart(6, "0")
        })
        .setOrigin(0.5);
      const y = this.scale.height * 0.62;
      const spacing = this.scale.width / (T5_CONFIG.colors.length + 1);
      T5_CONFIG.colors.forEach((c, i) => {
        const btn = this.add
          .text(spacing * (i + 1), y, c.label, {
            fontSize: "16px",
            color: "#0f172a",
            backgroundColor: "#e2e8f0",
            padding: { x: 12, y: 8 }
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        btn.on("pointerdown", () => void this.answer(c.name));
        this.buttons.push(btn);
      });
    });
  }

  private async answer(selected: string) {
    if (!this.current) return;
    const rt = Date.now() - this.shownAt;
    const isCorrect = selected === this.current.correctName;
    if (isCorrect) this.correct += 1;
    this.total += 1;
    this.rts.push(rt);
    this.seq += 1;
    await api(`/assessment/sessions/${this.sessionId}/telemetry`, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            itemId: `stroop-${this.trial + 1}`,
            eventType: "response",
            responseValue: { correct: isCorrect, congruent: this.current.congruent, selected },
            responseCorrect: isCorrect,
            responseTimeMs: rt,
            engineType: "reaction_time",
            difficultyLevel: this.current.congruent ? 1 : 2
          }
        ],
        clientSeq: this.seq
      })
    }).catch(() => undefined);
    this.trial += 1;
    this.scheduleTrial();
  }

  private async completeModule() {
    const accuracy = this.total ? this.correct / this.total : 0;
    const meanRt = this.rts.length ? Math.round(this.rts.reduce((a, b) => a + b, 0) / this.rts.length) : 0;
    const inhibition = 1 - accuracy * 0.3;
    const summary = {
      categoryScores: { accuracy, meanRt, inhibition },
      dominantPattern: accuracy >= 0.75 ? "Strong attention control" : "Building inhibition",
      consistencyScore: accuracy
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
    this.scene.start("StroopCompleteScene");
  }
}

class StroopCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: "StroopCompleteScene" });
  }
  create() {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Reaction module complete ✓", {
        fontSize: "22px",
        color: "#0f172a"
      })
      .setOrigin(0.5);
  }
}

export async function createReactionTimeEngine(options: ReactionEngineOptions) {
  const rect = options.container.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 640));
  const height = Math.max(400, Math.floor(rect.height || 480));

  let game: Phaser.Game | null = null;

  await new Promise<void>((resolve) => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: options.container,
      width,
      height,
      backgroundColor: "#f8fafc",
      scene: [StroopScene, StroopCompleteScene],
      audio: { noAudio: true },
      banner: false
    });
    game.scene.start("StroopScene", { sessionId: options.sessionId });
    setTimeout(() => {
      options.onReady?.();
      resolve();
    }, 400);
  });

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
