import Phaser from "phaser";
import type { LikertModuleConfig, PersistedSession } from "../../configs/module-config.types";
import { isLikertConfig } from "../../configs/module-config.types";
import { loadModuleConfig } from "../../configs/loader";
import { AdaptiveController } from "./AdaptiveController";
import { likertLog, stylePhaserCanvas, waitForContainerSize } from "./debug";
import { LikertCompleteScene, LikertScene, type LikertSceneCallbacks } from "./LikertScene";
import { SessionPersistence } from "./SessionPersistence";
import { TelemetryEmitter } from "./TelemetryEmitter";
import type { AssessmentItemProgress } from "../../types";

export type LikertEngineOptions = {
  container: HTMLElement;
  moduleId: string;
  sessionId: string;
  onAdaptiveChange?: (state: AdaptiveController["state"]) => void;
  onComplete?: (session: PersistedSession) => void;
  onItemChange?: (progress: AssessmentItemProgress) => void;
  onReady?: () => void;
};

export class LikertEngine {
  private game: Phaser.Game | null = null;
  private scene: LikertScene | null = null;
  private config: LikertModuleConfig | null = null;
  private session: PersistedSession | null = null;
  private telemetry: TelemetryEmitter | null = null;
  private adaptive: AdaptiveController | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private options: LikertEngineOptions) {}

  async init(): Promise<void> {
    likertLog("engine-init-start", { moduleId: this.options.moduleId });

    const loaded = await loadModuleConfig(this.options.moduleId);
    if (!isLikertConfig(loaded)) {
      throw new Error(`Module ${this.options.moduleId} is not a likert module`);
    }
    const renderableItems = loaded.items.filter((item) => item.prompt?.trim());
    if (!renderableItems.length) {
      throw new Error(
        `Module ${this.options.moduleId} has no questions with prompts — check archive/API connectivity`
      );
    }
    this.config =
      renderableItems.length === loaded.items.length
        ? loaded
        : { ...loaded, items: renderableItems };
    likertLog("engine-config-loaded", {
      moduleId: this.config.moduleId,
      items: this.config.items.length
    });

    const itemOrder = this.config.items.map((i) => i.id);

    const restored = SessionPersistence.load(this.config.moduleId);
    let sessionRestored = false;
    if (restored && restored.sessionId === this.options.sessionId) {
      const allAnswered = itemOrder.every((id) => restored.answers[id] != null);
      if (allAnswered) {
        likertLog("engine-session-reset", { reason: "all-items-already-answered" });
        SessionPersistence.clear(this.config.moduleId);
        this.session = SessionPersistence.createEmpty(
          this.options.sessionId,
          this.config.moduleId,
          itemOrder
        );
      } else {
        this.session = restored;
        sessionRestored = Object.keys(restored.answers).length > 0 || Boolean(restored.currentItemId);
        likertLog("engine-session-restored", {
          currentItemId: restored.currentItemId,
          answered: Object.keys(restored.answers).length
        });
      }
    } else {
      this.session = SessionPersistence.createEmpty(
        this.options.sessionId,
        this.config.moduleId,
        itemOrder
      );
      likertLog("engine-session-new", { sessionId: this.options.sessionId });
      SessionPersistence.save(this.session);
    }

    this.adaptive = new AdaptiveController(this.session.adaptiveState);
    this.telemetry = new TelemetryEmitter(
      this.options.sessionId,
      this.config.moduleId,
      () => this.adaptive?.toJSON() ?? {}
    );

    const callbacks: LikertSceneCallbacks = {
      onAdaptiveChange: (state) => {
        this.options.onAdaptiveChange?.(state);
        if (this.session) {
          this.session = { ...this.session, adaptiveState: { ...state } };
          SessionPersistence.save(this.session);
        }
      },
      onComplete: (session) => this.options.onComplete?.(session),
      onItemChange: (progress) => this.options.onItemChange?.(progress)
    };

    const { width, height } = await waitForContainerSize(this.options.container);
    likertLog("engine-container-size", { width, height });

    const sceneData = {
      config: this.config,
      session: this.session,
      telemetry: this.telemetry,
      adaptive: this.adaptive,
      callbacks,
      sessionRestored
    };

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.options.container,
      width,
      height,
      backgroundColor: "#f8fafc",
      scale: {
        mode: Phaser.Scale.NONE,
        width,
        height,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [],
      audio: { noAudio: true },
      banner: false,
      fps: { target: 60 }
    });

    this.game.scene.add("LikertScene", LikertScene, false);
    this.game.scene.add("LikertCompleteScene", LikertCompleteScene, false);
    this.game.scene.start("LikertScene", sceneData);

    stylePhaserCanvas(this.options.container);

    this.scene = this.game.scene.getScene("LikertScene") as unknown as LikertScene;
    this.bindResize();
    likertLog("engine-init-complete");
    this.options.onReady?.();
  }

  next() {
    this.scene?.goNext();
  }

  previous() {
    this.scene?.goPrevious();
  }

  submit() {
    this.scene?.submitCurrent();
  }

  destroy() {
    likertLog("engine-destroy");
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.game) {
      this.game.destroy(true, false);
      this.game = null;
    }
    this.scene = null;
    this.options.container.replaceChildren();
  }

  private bindResize() {
    if (typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.game) return;
      const rect = this.options.container.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width || 640));
      const height = Math.max(400, Math.floor(rect.height || 480));
      this.game.scale.resize(width, height);
      stylePhaserCanvas(this.options.container);
    });
    this.resizeObserver.observe(this.options.container);
  }
}

export async function createLikertEngine(options: LikertEngineOptions) {
  const engine = new LikertEngine(options);
  await engine.init();
  return engine;
}
