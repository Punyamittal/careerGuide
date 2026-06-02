import Phaser from "phaser";
import type {
  ItemAnswer,
  LikertItemConfig,
  LikertModuleConfig,
  PersistedSession,
  SessionSummarySnapshot
} from "../../configs/module-config.types";
import { AdaptiveController } from "./AdaptiveController";
import { CheckpointOverlay } from "./CheckpointOverlay";
import { DebugOverlay } from "./DebugOverlay";
import { likertLog, likertTextStyle } from "./debug";
import { prefersReducedMotion } from "./layout";
import { QuestionRenderer } from "./QuestionRenderer";
import { mergeAnalyticsIntoSession } from "./session-analytics";
import { attachSummaryToSession } from "./session-summary";
import { resolveCheckpointMessage, SessionPersistence } from "./SessionPersistence";
import { TelemetryEmitter } from "./TelemetryEmitter";
import { getLikertTheme } from "./theme";
import type { AssessmentItemProgress } from "../../types";

export type LikertSceneCallbacks = {
  onAdaptiveChange: (state: AdaptiveController["state"]) => void;
  onComplete: (session: PersistedSession) => void;
  onItemChange: (progress: AssessmentItemProgress) => void;
};

export type LikertSceneData = {
  config: LikertModuleConfig;
  session: PersistedSession;
  telemetry: TelemetryEmitter;
  adaptive: AdaptiveController;
  callbacks: LikertSceneCallbacks;
  sessionRestored?: boolean;
};

export class LikertScene extends Phaser.Scene {
  private config!: LikertModuleConfig;
  private session!: PersistedSession;
  private telemetry!: TelemetryEmitter;
  private adaptive!: AdaptiveController;
  private callbacks!: LikertSceneCallbacks;
  private questionRenderer!: QuestionRenderer;
  private debugOverlay!: DebugOverlay;
  private checkpointOverlay!: CheckpointOverlay;
  private currentItem: LikertItemConfig | null = null;
  private itemStartedAt = 0;
  private answered = new Set<string>();
  private history: string[] = [];
  private keyboardHandler?: (e: KeyboardEvent) => void;
  private elapsedTimer?: Phaser.Time.TimerEvent;
  private ready = false;
  private sessionRestored = false;
  private transitioning = false;
  private resizeRedrawTimer?: Phaser.Time.TimerEvent;
  private lastRenderCtx: Omit<Parameters<QuestionRenderer["render"]>[0], "callbacks"> | null = null;

  constructor() {
    super({ key: "LikertScene" });
  }

  init(data: LikertSceneData) {
    likertLog("scene-init", { itemCount: data?.config?.items?.length });
    if (!data?.config?.items?.length) {
      console.error("[LikertScene] init called without valid config");
      return;
    }

    this.config = data.config;
    this.session = data.session;
    this.telemetry = data.telemetry;
    this.adaptive = data.adaptive;
    this.callbacks = data.callbacks;
    this.sessionRestored = data.sessionRestored ?? false;
    this.answered = new Set(Object.keys(this.session.answers));
    this.history = Object.keys(this.session.answers);
    this.ready = true;
  }

  create() {
    const theme = getLikertTheme();
    this.cameras.main.setBackgroundColor(theme.bg);
    this.cameras.main.setAlpha(1);

    if (!this.ready || !this.config?.items?.length) {
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          "Assessment could not load.\nPlease refresh and try again.",
          likertTextStyle({ fontSize: "16px", color: "#dc2626", align: "center" })
        )
        .setOrigin(0.5);
      return;
    }

    this.questionRenderer = new QuestionRenderer(this);
    this.debugOverlay = new DebugOverlay(this);
    this.checkpointOverlay = new CheckpointOverlay(this);

    this.bindKeyboard();
    this.bindScaleResize();
    this.startElapsedTimer();

    if (this.session.currentItemId) {
      const item = this.config.items.find((i) => i.id === this.session.currentItemId);
      if (item && !this.answered.has(item.id)) {
        this.presentItem(item, false);
        return;
      }
    }

    this.advanceToNext(false);
  }

  shutdown() {
    this.questionRenderer?.destroyWidgets();
    this.debugOverlay?.destroy();
    this.checkpointOverlay?.destroy();
    if (this.keyboardHandler) window.removeEventListener("keydown", this.keyboardHandler);
    this.elapsedTimer?.destroy();
    this.resizeRedrawTimer?.remove(false);
  }

  private itemCallbacks(): {
    onInteract: () => void;
    onValueChange: (value: number | string) => void;
    onContinue: () => void;
  } {
    return {
      onInteract: () => undefined,
      onValueChange: () => undefined,
      onContinue: () => this.submitCurrent()
    };
  }

  private hasAnswer(): boolean {
    const v = this.questionRenderer?.getValue();
    return v !== null && v !== undefined;
  }

  goNext() {
    if (this.transitioning) return;
    if (this.currentItem && !this.hasAnswer()) return;
    if (this.currentItem) void this.commitCurrent(false);
    else this.advanceToNext(false);
  }

  goPrevious() {
    if (this.transitioning) return;
    if (this.history.length <= 1) return;
    this.history.pop();
    const prevId = this.history[this.history.length - 1];
    if (!prevId) return;
    this.answered.delete(prevId);
    const { [prevId]: _, ...rest } = this.session.answers;
    this.session = { ...this.session, answers: rest, currentItemId: prevId };
    SessionPersistence.save(this.session);
    const item = this.config.items.find((i) => i.id === prevId);
    if (item) this.presentItem(item, true);
  }

  submitCurrent() {
    if (this.transitioning || !this.currentItem || !this.hasAnswer()) return;
    void this.commitCurrent(true);
  }

  private bindKeyboard() {
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (this.transitioning || !this.currentItem) return;
      if (e.key === "Enter") {
        this.submitCurrent();
        return;
      }
      if (e.key === "ArrowLeft" && e.altKey) {
        this.goPrevious();
        return;
      }
      this.questionRenderer.handleKeyboard(e, this.currentItem, this.itemCallbacks());
    };
    window.addEventListener("keydown", this.keyboardHandler);
  }

  private bindScaleResize() {
    this.scale.on("resize", () => {
      if (!this.currentItem || this.transitioning || !this.lastRenderCtx) return;
      this.resizeRedrawTimer?.remove(false);
      this.resizeRedrawTimer = this.time.delayedCall(200, () => {
        if (!this.currentItem || this.transitioning || !this.lastRenderCtx) return;
        this.questionRenderer.render({
          ...this.lastRenderCtx,
          keepValue: true,
          callbacks: this.itemCallbacks()
        });
      });
    });
  }

  private startElapsedTimer() {
    this.elapsedTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.session = mergeAnalyticsIntoSession(
          {
            ...this.session,
            elapsedMs: this.session.elapsedMs + 1000,
            updatedAt: new Date().toISOString()
          },
          this.config
        );
        SessionPersistence.save(this.session);
      }
    });
  }

  private sessionHintText(): string | undefined {
    if (this.sessionRestored && this.answered.size < this.config.items.length) {
      return "Session restored";
    }
    return undefined;
  }

  private presentItem(item: LikertItemConfig, isBack: boolean) {
    const run = () => {
      this.currentItem = item;
      if (!isBack) this.history.push(item.id);
      this.itemStartedAt = Date.now();

      const done = this.answered.size;
      const total = this.config.items.length;
      const remaining = this.config.items.filter((i) => !this.answered.has(i.id));
      const isLastItem = remaining.length <= 1;

      this.callbacks.onItemChange({
        itemId: item.id,
        index: done + 1,
        total,
        isLast: isLastItem
      });

      this.debugOverlay.render({
        moduleId: this.config.moduleId,
        item,
        config: this.config,
        rendererType: item.type
      });

      this.lastRenderCtx = {
        item,
        progressIndex: done + 1,
        progressTotal: total,
        moduleTitle: this.config.title,
        sessionHint: this.sessionHintText(),
        isLastItem
      };

      this.questionRenderer.render({
        ...this.lastRenderCtx,
        callbacks: this.itemCallbacks()
      });

      this.telemetry.emit({
        itemId: item.id,
        response: null,
        responseTime: 0,
        interactionCount: 0,
        changedAnswer: false,
        metadata: {
          eventType: "stimulus_present",
          tags: item.telemetryTags,
          category: item.category
        }
      });
    };

    if (isBack || prefersReducedMotion()) {
      run();
      return;
    }

    this.cameras.main.fadeOut(120, 0, 0, 0);
    this.time.delayedCall(130, () => {
      run();
      this.cameras.main.fadeIn(160, 0, 0, 0);
    });
  }

  private async commitCurrent(advance: boolean) {
    if (!this.currentItem || this.transitioning) return;
    if (!this.hasAnswer()) return;

    this.transitioning = true;

    try {
      const finishedItem = this.currentItem;
      const value = this.questionRenderer.getValue()!;
      const responseTime = Date.now() - this.itemStartedAt;
      likertLog("answer-submit", { itemId: finishedItem.id, value });

      const answer: ItemAnswer = {
        value,
        responseTimeMs: responseTime,
        interactionCount: this.questionRenderer.getInteractionCount(),
        changedAnswer: this.questionRenderer.getChangedAnswer(),
        submittedAt: new Date().toISOString()
      };

      this.adaptive.evaluateResponse(
        {
          responseTimeMs: responseTime,
          interactionCount: answer.interactionCount,
          changedAnswer: answer.changedAnswer,
          item: finishedItem,
          value
        },
        {
          fastResponseMs: this.config.fastResponseMs ?? 6000,
          hesitationMs: this.config.hesitationMs ?? 12000
        }
      );

      this.callbacks.onAdaptiveChange(this.adaptive.state);

      this.telemetry.emit({
        itemId: finishedItem.id,
        response: value,
        responseTime,
        interactionCount: answer.interactionCount,
        changedAnswer: answer.changedAnswer,
        metadata: {
          tags: finishedItem.telemetryTags,
          difficulty: finishedItem.difficulty,
          category: finishedItem.category
        }
      });

      this.answered.add(finishedItem.id);
      this.sessionRestored = false;
      this.currentItem = null;

      const next = this.adaptive.pickNextItem(
        this.config.items,
        this.answered,
        finishedItem.category
      );

      let sessionDraft = SessionPersistence.recordAnswer(
        this.session,
        finishedItem.id,
        answer,
        this.adaptive.state,
        next?.id ?? null,
        this.session.elapsedMs
      );
      sessionDraft = mergeAnalyticsIntoSession(sessionDraft, this.config);
      this.session = sessionDraft;
      SessionPersistence.save(this.session);

      const checkpointMsg = resolveCheckpointMessage(this.config, this.answered.size);
      if (checkpointMsg && advance && next) {
        await this.checkpointOverlay.show(checkpointMsg);
      }

      if (!next) {
        await this.finish();
        return;
      }

      if (advance) {
        this.presentItem(next, false);
      }
    } finally {
      this.transitioning = false;
    }
  }

  private advanceToNext(animate: boolean) {
    const lastId = this.history[this.history.length - 1];
    const lastItem = lastId ? this.config.items.find((i) => i.id === lastId) : null;
    const next = this.adaptive.pickNextItem(
      this.config.items,
      this.answered,
      lastItem?.category ?? null
    );
    if (!next) {
      void this.finish();
      return;
    }
    this.presentItem(next, !animate);
  }

  private async finish() {
    this.session = attachSummaryToSession(
      mergeAnalyticsIntoSession(this.session, this.config),
      this.config
    );

    try {
      this.telemetry.emitSessionAnalytics(this.session.sessionAnalytics, this.session.sessionSummary);
      await Promise.race([
        this.telemetry.finalize(this.session.sessionSummary as Record<string, unknown>),
        new Promise<void>((resolve) => {
          this.time.delayedCall(4000, () => resolve());
        })
      ]);
    } catch (err) {
      likertLog("finish-error", err);
    } finally {
      SessionPersistence.clear(this.session.moduleId);
      this.callbacks.onItemChange({
        itemId: null,
        index: this.config.items.length,
        total: this.config.items.length,
        isLast: false
      });
      this.callbacks.onComplete(this.session);
      this.scene.start("LikertCompleteScene", {
        summary: this.session.sessionSummary,
        title: this.config.title
      });
    }
  }
}

export type LikertCompleteSceneData = {
  summary?: SessionSummarySnapshot;
  title?: string;
};

export class LikertCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: "LikertCompleteScene" });
  }

  create(data: LikertCompleteSceneData) {
    const theme = getLikertTheme();
    this.cameras.main.setBackgroundColor(theme.bg);

    const summary = data?.summary;
    const mins = summary ? Math.max(1, Math.round(summary.completionTimeMs / 60000)) : 0;
    const cardW = Math.min(440, this.scale.width - 40);
    const cardH = summary ? 220 : 120;
    const cx = (this.scale.width - cardW) / 2;
    const cy = this.scale.height / 2 - cardH / 2;

    const card = this.add.graphics();
    card.fillStyle(theme.surface, 1);
    card.lineStyle(1, theme.border, 1);
    card.fillRoundedRect(cx, cy, cardW, cardH, 16);
    card.strokeRoundedRect(cx, cy, cardW, cardH, 16);

    this.add
      .text(
        this.scale.width / 2,
        cy + 28,
        data?.title ? `${data.title} complete` : "Assessment complete",
        likertTextStyle({ fontSize: "22px", color: theme.text, fontStyle: "bold" })
      )
      .setOrigin(0.5);

    if (summary) {
      const lines = [
        `Time: ${mins} min · Consistency: ${Math.round(summary.consistencyScore * 100)}%`,
        `Dominant pattern: ${summary.dominantPattern}`,
        `Top tendencies: ${summary.topTendencies.join(" · ")}`
      ];
      this.add
        .text(
          this.scale.width / 2,
          cy + 72,
          lines.join("\n"),
          likertTextStyle({
            fontSize: theme.captionSize,
            color: theme.textSecondary,
            align: "center",
            wordWrap: { width: cardW - 32 },
            lineSpacing: 8
          })
        )
        .setOrigin(0.5, 0);
    } else {
      this.add
        .text(
          this.scale.width / 2,
          cy + 72,
          "Your responses have been saved.",
          likertTextStyle({ fontSize: theme.captionSize, color: theme.textSecondary })
        )
        .setOrigin(0.5);
    }
  }
}
