import Phaser from "phaser";
import type { BranchingModuleConfig, PersistedSession } from "../../configs/module-config.types";
import { isBranchingConfig } from "../../configs/module-config.types";
import { loadModuleConfig } from "../../configs/loader";
import { BranchingAdaptiveController } from "./BranchingAdaptiveController";
import { BranchingCompleteScene, BranchingScene, type BranchingSceneCallbacks } from "./BranchingScene";
import { BranchingSessionPersistence } from "./SessionPersistence";
import { BranchingTelemetryEmitter } from "./TelemetryEmitter";

export type BranchingEngineOptions = {
  container: HTMLElement;
  moduleId: string;
  sessionId: string;
  onAdaptiveChange?: (state: BranchingAdaptiveController["state"]) => void;
  onComplete?: (session: PersistedSession) => void;
  onReady?: () => void;
};

export class BranchingEngine {
  private game: Phaser.Game | null = null;
  private scene: BranchingScene | null = null;
  private config: BranchingModuleConfig | null = null;
  private session: PersistedSession | null = null;
  private telemetry: BranchingTelemetryEmitter | null = null;
  private adaptive: BranchingAdaptiveController | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private options: BranchingEngineOptions) {}

  async init(): Promise<void> {
    const loaded = await loadModuleConfig(this.options.moduleId);
    if (!isBranchingConfig(loaded)) {
      throw new Error(`Module ${this.options.moduleId} is not a branching module`);
    }
    this.config = loaded;
    const scenarioOrder = this.config.scenarios.map((s) => s.id);

    const restored = BranchingSessionPersistence.load(this.config.moduleId);
    if (restored && restored.sessionId === this.options.sessionId) {
      this.session = restored;
    } else {
      this.session = BranchingSessionPersistence.createEmpty(
        this.options.sessionId,
        this.config.moduleId,
        scenarioOrder
      );
      BranchingSessionPersistence.save(this.session);
    }

    this.adaptive = new BranchingAdaptiveController(this.session.adaptiveState);
    this.telemetry = new BranchingTelemetryEmitter(
      this.options.sessionId,
      this.config.moduleId,
      () => this.adaptive?.toJSON() ?? {}
    );

    const callbacks: BranchingSceneCallbacks = {
      onAdaptiveChange: (state) => {
        this.options.onAdaptiveChange?.(state);
        if (this.session) {
          this.session = { ...this.session, adaptiveState: { ...state } };
          BranchingSessionPersistence.save(this.session);
        }
      },
      onComplete: (session) => this.options.onComplete?.(session),
      onNodeChange: () => undefined
    };

    const { width, height } = this.measureContainer();

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.options.container,
      width,
      height,
      backgroundColor: "#f8fafc",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BranchingScene, BranchingCompleteScene],
      audio: { noAudio: true },
      banner: false,
      fps: { target: 60 }
    });

    this.game.scene.start("BranchingScene", {
      config: this.config,
      session: this.session,
      telemetry: this.telemetry,
      adaptive: this.adaptive,
      callbacks
    });

    this.scene = this.game.scene.getScene("BranchingScene") as unknown as BranchingScene;
    this.bindResize();
    this.options.onReady?.();
  }

  next() {
    this.scene?.goNext();
  }

  previous() {
    /* branching SJT is forward-only */
  }

  submit() {
    this.scene?.submit();
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.game) {
      this.game.destroy(true, false);
      this.game = null;
    }
    this.scene = null;
    this.options.container.replaceChildren();
  }

  private measureContainer() {
    const rect = this.options.container.getBoundingClientRect();
    return {
      width: Math.max(320, Math.floor(rect.width || 640)),
      height: Math.max(400, Math.floor(rect.height || 520))
    };
  }

  private bindResize() {
    if (typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.game) return;
      const { width, height } = this.measureContainer();
      this.game.scale.resize(width, height);
    });
    this.resizeObserver.observe(this.options.container);
  }
}

export async function createBranchingEngine(options: BranchingEngineOptions) {
  const engine = new BranchingEngine(options);
  await engine.init();
  return engine;
}
