import Phaser from "phaser";
import type {
  BranchingModuleConfig,
  BranchingNode,
  BranchingOption,
  PersistedSession,
  ScenarioConfig
} from "../../configs/module-config.types";
import { BranchingAdaptiveController } from "./BranchingAdaptiveController";
import {
  BranchStateManager,
  buildBranchingAnswer,
  findNode,
  findScenario
} from "./BranchStateManager";
import { ConsequenceEngine } from "./ConsequenceEngine";
import { ScenarioRenderer } from "./ScenarioRenderer";
import { BranchingSessionPersistence } from "./SessionPersistence";
import { attachBranchingSummaryToSession } from "./session-summary";
import { BranchingTelemetryEmitter } from "./TelemetryEmitter";
import { getBranchingTheme } from "./theme";

export type BranchingSceneCallbacks = {
  onAdaptiveChange: (state: BranchingAdaptiveController["state"]) => void;
  onComplete: (session: PersistedSession) => void;
  onNodeChange: (nodeId: string | null) => void;
};

export type BranchingSceneData = {
  config: BranchingModuleConfig;
  session: PersistedSession;
  telemetry: BranchingTelemetryEmitter;
  adaptive: BranchingAdaptiveController;
  callbacks: BranchingSceneCallbacks;
};

function resolveSequentialNext(
  scenario: ScenarioConfig,
  currentNodeId: string,
  state: BranchStateManager
): string | null {
  const idx = scenario.nodes.findIndex((n) => n.id === currentNodeId);
  for (let i = idx + 1; i < scenario.nodes.length; i++) {
    const node = scenario.nodes[i];
    if (node.tags?.some((t) => state.isBranchLocked(t))) continue;
    return node.id;
  }
  return null;
}

export class BranchingScene extends Phaser.Scene {
  private config!: BranchingModuleConfig;
  private session!: PersistedSession;
  private telemetry!: BranchingTelemetryEmitter;
  private adaptive!: BranchingAdaptiveController;
  private callbacks!: BranchingSceneCallbacks;
  private branchState!: BranchStateManager;
  private consequenceEngine = new ConsequenceEngine();
  private scenarioRenderer!: ScenarioRenderer;
  private currentScenario: ScenarioConfig | null = null;
  private currentNode: BranchingNode | null = null;
  private nodeStartedAt = 0;
  private firstInteractAt: number | null = null;
  private showingConsequence = false;
  private pendingConsequence: { text: string; nextNodeId: string | null; scenarioComplete: boolean } | null =
    null;
  private keyboardHandler?: (e: KeyboardEvent) => void;
  private elapsedTimer?: Phaser.Time.TimerEvent;
  private chromeTitle?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "BranchingScene" });
  }

  init(data: BranchingSceneData) {
    this.config = data.config;
    this.session = data.session;
    this.telemetry = data.telemetry;
    this.adaptive = data.adaptive;
    this.callbacks = data.callbacks;
    this.branchState = BranchStateManager.fromSession(this.session);
    for (const id of this.session.completedScenarioIds ?? []) {
      this.branchState.completeScenario(id);
    }
  }

  create() {
    const theme = getBranchingTheme();
    this.cameras.main.setBackgroundColor(theme.bg);

    this.scenarioRenderer = new ScenarioRenderer(this, this.scale.width, this.scale.height);
    this.drawChrome();
    this.bindKeyboard();
    this.startElapsedTimer();
    this.resumeOrStart();
  }

  shutdown() {
    this.scenarioRenderer?.destroyWidgets();
    if (this.keyboardHandler) window.removeEventListener("keydown", this.keyboardHandler);
    this.elapsedTimer?.destroy();
  }

  goNext() {
    if (this.showingConsequence) {
      this.advanceAfterConsequence();
      return;
    }
    if (this.currentNode?.type === "narrative" || this.currentNode?.type === "consequence") {
      this.advanceFromNarrative();
    }
  }

  submit() {
    this.goNext();
  }

  private drawChrome() {
    const theme = getBranchingTheme();
    this.chromeTitle = this.add.text(this.scale.width / 2, 8, this.config.title, {
      fontSize: "13px",
      color: theme.textMuted
    });
    this.chromeTitle.setOrigin(0.5, 0);
  }

  private bindKeyboard() {
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (!this.currentNode) return;
      this.scenarioRenderer.handleKeyboard(e, this.currentNode, {
        onContinue: () => this.goNext(),
        onSelectOption: (opt) => this.commitChoice(opt),
        onInteract: () => this.markInteract()
      });
    };
    window.addEventListener("keydown", this.keyboardHandler);
  }

  private startElapsedTimer() {
    this.elapsedTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.session = {
          ...this.session,
          elapsedMs: this.session.elapsedMs + 1000,
          updatedAt: new Date().toISOString()
        };
        BranchingSessionPersistence.save(this.branchState.toPersisted(this.session));
      }
    });
  }

  private resumeOrStart() {
    const scenarioId = this.session.currentScenarioId;
    if (!scenarioId) {
      void this.finish();
      return;
    }

    const scenario = findScenario(this.config, scenarioId);
    if (!scenario) {
      void this.advanceScenario();
      return;
    }

    const nodeId = this.session.currentNodeId ?? scenario.entryNodeId;
    this.enterNode(scenario.id, nodeId);
  }

  private enterNode(scenarioId: string, nodeId: string) {
    const scenario = findScenario(this.config, scenarioId);
    const node = scenario ? findNode(this.config, scenarioId, nodeId) : null;
    if (!scenario || !node) {
      void this.advanceScenario();
      return;
    }

    this.currentScenario = scenario;
    this.currentNode = node;
    this.nodeStartedAt = Date.now();
    this.firstInteractAt = null;
    this.showingConsequence = false;
    this.pendingConsequence = null;
    this.branchState.recordStep(scenarioId, nodeId);
    this.callbacks.onNodeChange(nodeId);

    const completed = this.branchState.state.completedScenarioIds.size;
    const total = this.config.scenarios.length;
    this.scenarioRenderer.renderScenarioHeader(scenario, completed + 1, total);

    this.telemetry.emit({
      nodeId: node.id,
      hesitationTime: 0,
      changedChoice: false,
      branchDepth: this.branchState.branchDepth,
      escalationScore: this.branchState.state.signals.escalation,
      empathySignal: this.branchState.state.signals.empathy,
      metadata: { eventType: "stimulus_present", scenarioId, nodeType: node.type }
    });

    this.fadeIn(() => {
      if (node.type === "choice") {
        this.scenarioRenderer.renderChoice(node, this.branchState.state.tone, {
          onContinue: () => this.goNext(),
          onSelectOption: (opt) => this.commitChoice(opt),
          onInteract: () => this.markInteract()
        });
      } else {
        this.scenarioRenderer.renderNarrative(node, this.branchState.state.tone, {
          onContinue: () => this.advanceFromNarrative(),
          onSelectOption: () => undefined,
          onInteract: () => this.markInteract()
        });
      }
    });

    this.persistState(scenarioId, nodeId);
  }

  private markInteract() {
    if (this.firstInteractAt == null) this.firstInteractAt = Date.now();
  }

  private commitChoice(option: BranchingOption) {
    if (!this.currentScenario || !this.currentNode || this.currentNode.type !== "choice") return;

    const responseTimeMs = Date.now() - this.nodeStartedAt;
    const hesitationTimeMs = (this.firstInteractAt ?? Date.now()) - this.nodeStartedAt;
    const changedChoice = this.scenarioRenderer.getChangedChoice();

    const result = this.consequenceEngine.apply(
      this.config,
      this.branchState,
      this.currentScenario.id,
      this.currentNode.id,
      option
    );

    if (result.scenarioComplete) {
      this.branchState.completeScenario(this.currentScenario.id);
    }

    this.adaptive.evaluateChoice({
      responseTimeMs,
      escalationScore: this.branchState.state.signals.escalation,
      empathySignal: this.branchState.state.signals.empathy,
      changedChoice,
      impulsiveMs: this.config.impulsiveMs ?? 3500,
      hesitationMs: this.config.hesitationMs ?? 15000
    });
    this.callbacks.onAdaptiveChange(this.adaptive.state);

    const answer = buildBranchingAnswer(this.currentScenario.id, this.currentNode.id, option, {
      responseTimeMs,
      hesitationTimeMs,
      changedChoice,
      branchDepth: this.branchState.branchDepth
    });

    this.telemetry.emit({
      nodeId: this.currentNode.id,
      selectedOption: option.id,
      hesitationTime: hesitationTimeMs,
      changedChoice,
      branchDepth: this.branchState.branchDepth,
      escalationScore: this.branchState.state.signals.escalation,
      empathySignal: this.branchState.state.signals.empathy,
      metadata: { weights: option.weights, scenarioId: this.currentScenario.id }
    });

    this.pendingConsequence = {
      text: result.consequenceText ?? option.consequence ?? "The situation evolves.",
      nextNodeId: result.nextNodeId,
      scenarioComplete: result.scenarioComplete
    };

    const nextScenarioId = result.scenarioComplete ? null : this.currentScenario.id;
    const nextNodeId = result.scenarioComplete ? null : result.nextNodeId;

    this.session = BranchingSessionPersistence.recordChoice(
      this.session,
      answer,
      this.adaptive.state,
      {
        scenarioId: this.currentScenario.id,
        nodeId: result.scenarioComplete ? null : result.nextNodeId,
        path: [...this.branchState.state.path],
        signals: { ...this.branchState.state.signals },
        flags: { ...this.branchState.state.flags },
        completedScenarioIds: [...this.branchState.state.completedScenarioIds]
      },
      this.session.elapsedMs
    );

    if (this.pendingConsequence.text) {
      this.showingConsequence = true;
      this.scenarioRenderer.renderConsequence(this.pendingConsequence.text, result.tone ?? this.branchState.state.tone, {
        onContinue: () => this.advanceAfterConsequence(),
        onSelectOption: () => undefined,
        onInteract: () => undefined
      });
      return;
    }

    this.advanceAfterConsequence();
  }

  private advanceAfterConsequence() {
    if (!this.pendingConsequence || !this.currentScenario) return;
    const { nextNodeId, scenarioComplete } = this.pendingConsequence;
    this.showingConsequence = false;
    this.pendingConsequence = null;

    if (scenarioComplete || !nextNodeId) {
      this.branchState.completeScenario(this.currentScenario.id);
      this.persistState(null, null);
      this.fadeOut(() => void this.advanceScenario());
      return;
    }

    this.fadeOut(() => this.enterNode(this.currentScenario!.id, nextNodeId));
  }

  private advanceFromNarrative() {
    if (!this.currentScenario || !this.currentNode) return;
    const nextId = resolveSequentialNext(
      this.currentScenario,
      this.currentNode.id,
      this.branchState
    );

    if (!nextId) {
      this.branchState.completeScenario(this.currentScenario.id);
      this.persistState(null, null);
      this.fadeOut(() => void this.advanceScenario());
      return;
    }

    this.fadeOut(() => this.enterNode(this.currentScenario!.id, nextId));
  }

  private async advanceScenario() {
    const next = this.adaptive.pickNextScenario(
      this.config,
      this.branchState.state.completedScenarioIds
    );

    if (!next) {
      await this.finish();
      return;
    }

    this.session = {
      ...this.session,
      currentScenarioId: next.id,
      currentNodeId: next.entryNodeId
    };
    BranchingSessionPersistence.save(this.session);
    this.enterNode(next.id, next.entryNodeId);
  }

  private persistState(scenarioId: string | null, nodeId: string | null) {
    this.session = {
      ...this.branchState.toPersisted(this.session),
      currentScenarioId: scenarioId,
      currentNodeId: nodeId
    };
    BranchingSessionPersistence.save(this.session);
  }

  private fadeIn(cb: () => void) {
    this.cameras.main.setAlpha(0.92);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 220,
      ease: "Sine.easeOut",
      onComplete: cb
    });
  }

  private fadeOut(cb: () => void) {
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.cameras.main.fadeIn(200, 0, 0, 0);
      cb();
    });
  }

  private async finish() {
    try {
      this.session = attachBranchingSummaryToSession(this.session, this.config);
      this.telemetry.emitSessionComplete(
        this.session.sessionSummary as Record<string, unknown>,
        this.session.sessionAnalytics as Record<string, unknown>
      );
      await this.telemetry.flush();
      await Promise.race([
        this.telemetry.finalize(this.session.sessionSummary as Record<string, unknown>),
        new Promise<void>((resolve) => {
          this.time.delayedCall(4000, () => resolve());
        })
      ]);
    } catch (err) {
      console.error("[BranchingScene] finish error", err);
    } finally {
      BranchingSessionPersistence.clear(this.session.moduleId);
      this.callbacks.onComplete(this.session);
      this.scene.start("BranchingCompleteScene");
    }
  }
}

export class BranchingCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: "BranchingCompleteScene" });
  }

  create() {
    const theme = getBranchingTheme();
    this.cameras.main.setBackgroundColor(theme.bg);
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, "Scenario module complete ✓", {
      fontSize: "22px",
      color: theme.text
    });
    t.setOrigin(0.5);
  }
}
