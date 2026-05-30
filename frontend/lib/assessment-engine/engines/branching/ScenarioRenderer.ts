import Phaser from "phaser";
import type {
  BranchingNode,
  BranchingOption,
  ScenarioAvatar,
  ScenarioConfig
} from "../../configs/module-config.types";
import { getBranchingTheme, themePadding, type BranchingTheme } from "./theme";

export type ScenarioRenderCallbacks = {
  onContinue: () => void;
  onSelectOption: (option: BranchingOption) => void;
  onInteract: () => void;
};

const AVATAR_LABEL: Record<ScenarioAvatar, string> = {
  coach: "Coach",
  peer: "Peer",
  manager: "Manager",
  user: "You",
  narrator: "Scene"
};

const AVATAR_COLOR: Record<ScenarioAvatar, number> = {
  coach: 0x6366f1,
  peer: 0x0ea5e9,
  manager: 0xf59e0b,
  user: 0x10b981,
  narrator: 0x64748b
};

export class ScenarioRenderer {
  private widgets: Phaser.GameObjects.GameObject[] = [];
  private theme: BranchingTheme;
  private pad: number;
  private selectedOptionId: string | null = null;
  private interactionCount = 0;
  private firstOptionId: string | null = null;
  private optionButtons = new Map<string, Phaser.GameObjects.Container>();

  constructor(
    private scene: Phaser.Scene,
    private width: number,
    private height: number
  ) {
    this.theme = getBranchingTheme();
    this.pad = themePadding(width);
  }

  getInteractionCount() {
    return this.interactionCount;
  }

  getChangedChoice() {
    return (
      this.firstOptionId != null &&
      this.selectedOptionId != null &&
      this.firstOptionId !== this.selectedOptionId
    );
  }

  getSelectedOption(options: BranchingOption[]): BranchingOption | null {
    if (!this.selectedOptionId) return null;
    return options.find((o) => o.id === this.selectedOptionId) ?? null;
  }

  renderScenarioHeader(scenario: ScenarioConfig, scenarioIndex: number, scenarioTotal: number) {
    this.destroyWidgets();
    this.theme = getBranchingTheme();
    this.pad = themePadding(this.width);
    this.drawProgress(scenarioIndex, scenarioTotal, scenario.title);
    this.drawSetting(scenario.setting);
  }

  renderNarrative(
    node: BranchingNode,
    tone: "calm" | "tense" | "neutral" | "hopeful",
    callbacks: ScenarioRenderCallbacks
  ) {
    this.resetChoiceState();
    this.drawDialogue(node, tone);
    this.drawContinueButton(callbacks);
  }

  renderChoice(
    node: BranchingNode,
    tone: "calm" | "tense" | "neutral" | "hopeful",
    callbacks: ScenarioRenderCallbacks
  ) {
    this.resetChoiceState();
    this.drawDialogue(node, tone);
    if (node.options?.length) {
      this.drawOptions(node.options, callbacks);
    }
  }

  renderConsequence(
    text: string,
    tone: "calm" | "tense" | "neutral" | "hopeful",
    callbacks: ScenarioRenderCallbacks
  ) {
    this.clearOptions();
    const cardY = this.pad + 120;
    const cardW = this.width - this.pad * 2;
    const panel = this.scene.add.graphics();
    panel.fillStyle(this.toneSurface(tone), 1);
    panel.lineStyle(+2, this.toneBorder(tone), 1);
    panel.fillRoundedRect(this.pad, cardY, cardW, 100, 12);
    panel.strokeRoundedRect(this.pad, cardY, cardW, 100, 12);
    this.add(panel);

    const label = this.scene.add.text(this.pad + 16, cardY + 12, "What happens next", {
      fontSize: "12px",
      color: this.theme.textMuted,
      fontStyle: "bold"
    });
    this.add(label);

    const body = this.scene.add.text(this.pad + 16, cardY + 36, text, {
      fontSize: "15px",
      color: this.theme.text,
      wordWrap: { width: cardW - 32 },
      lineSpacing: 4
    });
    this.add(body);

    this.drawContinueButton(callbacks, "Continue →");
  }

  handleKeyboard(
    event: KeyboardEvent,
    node: BranchingNode,
    callbacks: ScenarioRenderCallbacks
  ) {
    if (node.type === "choice" && node.options?.length) {
      const keyMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      const idx = keyMap[event.key.toLowerCase()];
      if (idx != null && node.options[idx]) {
        this.selectOption(node.options[idx], callbacks);
        return;
      }
      if (event.key === "Enter" && this.selectedOptionId) {
        const opt = this.getSelectedOption(node.options);
        if (opt) callbacks.onSelectOption(opt);
      }
      return;
    }

    if (event.key === "Enter") {
      callbacks.onContinue();
    }
  }

  destroyWidgets() {
    for (const w of this.widgets) w.destroy();
    this.widgets = [];
    this.optionButtons.clear();
  }

  private resetChoiceState() {
    this.selectedOptionId = null;
    this.firstOptionId = null;
    this.interactionCount = 0;
    this.clearOptions();
  }

  private clearOptions() {
    for (const c of this.optionButtons.values()) c.destroy();
    this.optionButtons.clear();
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.widgets.push(obj);
    return obj;
  }

  private drawProgress(index: number, total: number, title: string) {
    const barY = this.pad;
    const barW = this.width - this.pad * 2;
    const pct = total > 0 ? index / total : 0;

    const track = this.scene.add.graphics();
    track.fillStyle(this.theme.track, 1);
    track.fillRoundedRect(this.pad, barY, barW, 6, 3);
    this.add(track);

    const fill = this.scene.add.graphics();
    fill.fillStyle(this.theme.trackFill, 1);
    fill.fillRoundedRect(this.pad, barY, Math.max(6, barW * pct), 6, 3);
    this.add(fill);

    const titleText = this.scene.add.text(this.pad, barY + 14, title, {
      fontSize: "13px",
      color: this.theme.textMuted,
      fontStyle: "bold"
    });
    this.add(titleText);

    const count = this.scene.add.text(this.width - this.pad, barY + 14, `${index}/${total}`, {
      fontSize: "12px",
      color: this.theme.textMuted
    });
    count.setOrigin(1, 0);
    this.add(count);
  }

  private drawSetting(setting: string) {
    const t = this.scene.add.text(this.pad, this.pad + 36, setting, {
      fontSize: "12px",
      color: this.theme.textMuted,
      wordWrap: { width: this.width - this.pad * 2 },
      lineSpacing: 2
    });
    this.add(t);
  }

  private drawDialogue(
    node: BranchingNode,
    tone: "calm" | "tense" | "neutral" | "hopeful"
  ) {
    const avatar = node.avatar ?? "narrator";
    const cardY = this.pad + 88;
    const cardW = this.width - this.pad * 2;
    const cardH = Math.min(160, this.height * 0.28);

    const bubble = this.scene.add.graphics();
    bubble.fillStyle(this.toneSurface(tone), 1);
    bubble.lineStyle(2, this.toneBorder(tone), 1);
    bubble.fillRoundedRect(this.pad, cardY, cardW, cardH, 14);
    bubble.strokeRoundedRect(this.pad, cardY, cardW, cardH, 14);
    this.add(bubble);

    const avatarCircle = this.scene.add.graphics();
    avatarCircle.fillStyle(AVATAR_COLOR[avatar], 1);
    avatarCircle.fillCircle(this.pad + 28, cardY + 28, 18);
    this.add(avatarCircle);

    const avatarInitial = this.scene.add.text(this.pad + 28, cardY + 28, avatar[0].toUpperCase(), {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    avatarInitial.setOrigin(0.5);
    this.add(avatarInitial);

    const speaker = this.scene.add.text(this.pad + 56, cardY + 12, node.speaker ?? AVATAR_LABEL[avatar], {
      fontSize: "12px",
      color: this.theme.textMuted,
      fontStyle: "bold"
    });
    this.add(speaker);

    const narrative = this.scene.add.text(this.pad + 16, cardY + 52, node.narrative, {
      fontSize: this.theme.promptSize,
      color: this.theme.text,
      wordWrap: { width: cardW - 32 },
      lineSpacing: 5
    });
    this.add(narrative);
  }

  private drawOptions(options: BranchingOption[], callbacks: ScenarioRenderCallbacks) {
    const startY = this.pad + 88 + Math.min(160, this.height * 0.28) + 16;
    const optW = this.width - this.pad * 2;
    const optH = Math.max(52, Math.min(64, (this.height - startY - 80) / 4 - 8));
    const gap = 8;

    options.slice(0, 4).forEach((opt, i) => {
      const y = startY + i * (optH + gap);
      const container = this.scene.add.container(this.pad, y);

      const bg = this.scene.add.graphics();
      bg.fillStyle(this.theme.surface, 1);
      bg.lineStyle(2, this.theme.border, 1);
      bg.fillRoundedRect(0, 0, optW, optH, 10);
      bg.strokeRoundedRect(0, 0, optW, optH, 10);
      container.add(bg);

      const badge = this.scene.add.text(12, optH / 2, opt.label, {
        fontSize: "13px",
        color: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#059669",
        padding: { x: 6, y: 4 }
      });
      badge.setOrigin(0, 0.5);
      container.add(badge);

      const text = this.scene.add.text(44, optH / 2, opt.text, {
        fontSize: this.theme.labelSize,
        color: this.theme.text,
        wordWrap: { width: optW - 56 },
        lineSpacing: 2
      });
      text.setOrigin(0, 0.5);
      container.add(text);

      container.setSize(optW, optH);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, optW, optH), Phaser.Geom.Rectangle.Contains);
      container.on("pointerdown", () => this.selectOption(opt, callbacks));
      container.on("pointerover", () => bg.clear().fillStyle(0xf0fdf4, 1).lineStyle(2, this.theme.accent, 1).fillRoundedRect(0, 0, optW, optH, 10).strokeRoundedRect(0, 0, optW, optH, 10));
      container.on("pointerout", () => {
        const selected = this.selectedOptionId === opt.id;
        bg.clear()
          .fillStyle(selected ? 0xecfdf5 : this.theme.surface, 1)
          .lineStyle(2, selected ? this.theme.accent : this.theme.border, 1)
          .fillRoundedRect(0, 0, optW, optH, 10)
          .strokeRoundedRect(0, 0, optW, optH, 10);
      });

      this.optionButtons.set(opt.id, container);
      this.add(container);
    });

    const hint = this.scene.add.text(
      this.width / 2,
      this.height - 24,
      "Tap an option · 1–4 or A–D · Enter to confirm",
      { fontSize: "11px", color: this.theme.textMuted }
    );
    hint.setOrigin(0.5, 1);
    this.add(hint);
  }

  private selectOption(option: BranchingOption, callbacks: ScenarioRenderCallbacks) {
    this.interactionCount += 1;
    if (this.firstOptionId == null) this.firstOptionId = option.id;
    this.selectedOptionId = option.id;
    callbacks.onInteract();

    for (const [id, container] of this.optionButtons) {
      const bg = container.list[0] as Phaser.GameObjects.Graphics;
      const optW = this.width - this.pad * 2;
      const optH = container.height;
      bg.clear()
        .fillStyle(id === option.id ? 0xecfdf5 : this.theme.surface, 1)
        .lineStyle(2, id === option.id ? this.theme.accent : this.theme.border, 1)
        .fillRoundedRect(0, 0, optW, optH, 10)
        .strokeRoundedRect(0, 0, optW, optH, 10);
    }

    callbacks.onSelectOption(option);
  }

  private drawContinueButton(callbacks: ScenarioRenderCallbacks, label = "Continue") {
    const btnW = 140;
    const btnH = 40;
    const x = this.width - this.pad - btnW;
    const y = this.height - this.pad - btnH;

    const bg = this.scene.add.graphics();
    bg.fillStyle(this.theme.accent, 1);
    bg.fillRoundedRect(x, y, btnW, btnH, 10);
    this.add(bg);

    const text = this.scene.add.text(x + btnW / 2, y + btnH / 2, label, {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    text.setOrigin(0.5);
    this.add(text);

    const hit = this.scene.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => callbacks.onContinue());
    this.add(hit);
  }

  private toneSurface(tone: "calm" | "tense" | "neutral" | "hopeful") {
    switch (tone) {
      case "calm":
        return 0xe0f2fe;
      case "tense":
        return 0xffe4e6;
      case "hopeful":
        return 0xd1fae5;
      default:
        return this.theme.surface;
    }
  }

  private toneBorder(tone: "calm" | "tense" | "neutral" | "hopeful") {
    switch (tone) {
      case "calm":
        return 0x38bdf8;
      case "tense":
        return 0xf87171;
      case "hopeful":
        return 0x34d399;
      default:
        return this.theme.border;
    }
  }
}
