import Phaser from "phaser";
import { categoryLabel } from "../../configs/category-labels";
import type { LikertItemConfig } from "../../configs/module-config.types";
import { likertLog, likertTextStyle } from "./debug";
import { computeLikertLayout, zoneCenterY, type LikertLayout } from "./layout";
import { getLikertTheme, type LikertTheme } from "./theme";

export type RenderCallbacks = {
  onInteract: () => void;
  onValueChange: (value: number | string) => void;
  onContinue?: () => void;
};

export type RenderContext = {
  item: LikertItemConfig;
  progressIndex: number;
  progressTotal: number;
  moduleTitle: string;
  sessionHint?: string;
  /** Final item — require explicit submit instead of auto-advance. */
  isLastItem?: boolean;
  /** Pre-fill when revisiting an item (e.g. browser back within session). */
  initialValue?: number | string | null;
  /** Restore an in-progress answer (e.g. after canvas resize). */
  keepValue?: boolean;
  callbacks: RenderCallbacks;
};

type OptionTarget = {
  value: number | string;
  hit: Phaser.GameObjects.GameObject;
  visual: Phaser.GameObjects.GameObject[];
};

export class QuestionRenderer {
  private widgets: Phaser.GameObjects.GameObject[] = [];
  private optionTargets: OptionTarget[] = [];
  private value: number | string | null = null;
  private theme: LikertTheme;
  private layout!: LikertLayout;
  private interactionCount = 0;
  private firstValue: number | string | null = null;
  private focusIndex = 0;
  private itemType: LikertItemConfig["type"] = "frequency";
  private isLastItem = false;
  private continueCallbacks: RenderCallbacks | null = null;
  private advanceTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene) {
    this.theme = getLikertTheme();
  }

  getValue() {
    return this.value;
  }

  getInteractionCount() {
    return this.interactionCount;
  }

  getChangedAnswer() {
    return this.firstValue != null && this.value != null && this.firstValue !== this.value;
  }

  render(ctx: RenderContext) {
    const priorInteractionCount = this.interactionCount;
    const startValue = ctx.keepValue
      ? this.value
      : ctx.initialValue !== undefined
        ? ctx.initialValue
        : null;
    this.theme = getLikertTheme();
    this.layout = computeLikertLayout(
      this.scene.scale.width,
      this.scene.scale.height,
      ctx.item.prompt.length
    );
    this.destroyWidgets();
    this.advanceTimer?.remove(false);
    this.value = startValue;
    this.firstValue = startValue;
    this.interactionCount =
      startValue != null ? (ctx.keepValue ? priorInteractionCount : 0) : 0;
    this.focusIndex = startValue != null ? Math.max(0, Number(startValue) - 1) : 0;
    this.itemType = ctx.item.type;
    this.isLastItem = ctx.isLastItem ?? false;
    this.optionTargets = [];

    likertLog("question-render", {
      itemId: ctx.item.id,
      type: ctx.item.type,
      layout: this.layout.zones
    });

    this.drawHeader(ctx);
    this.drawPrompt(ctx.item.prompt);
    this.continueCallbacks = ctx.callbacks;
    this.drawFooter(ctx.item.type, this.isLastItem);

    switch (ctx.item.type) {
      case "frequency":
        this.renderFrequency(ctx.item, ctx.callbacks);
        break;
      case "semantic_differential":
        this.renderSemantic(ctx.item, ctx.callbacks);
        break;
      case "binary":
        this.renderBinary(ctx.item, ctx.callbacks);
        break;
    }

    if (this.value != null) {
      this.applySelectedStyles(this.value);
      this.showContinueButton(ctx.callbacks);
    } else {
      this.refreshFocusVisuals();
    }
  }

  handleKeyboard(event: KeyboardEvent, item: LikertItemConfig, callbacks: RenderCallbacks) {
    const opts = this.optionTargets;
    if (!opts.length) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      this.focusIndex = (this.focusIndex + 1) % opts.length;
      this.refreshFocusVisuals();
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      this.focusIndex = (this.focusIndex - 1 + opts.length) % opts.length;
      this.refreshFocusVisuals();
      event.preventDefault();
      return;
    }

    if (item.type === "binary") {
      if (event.key === "a" || event.key === "A" || event.key === "1") {
        this.selectValue(0, callbacks);
      } else if (event.key === "b" || event.key === "B" || event.key === "2") {
        this.selectValue(1, callbacks);
      }
      return;
    }

    const num = Number(event.key);
    if (num >= 1 && num <= opts.length) {
      this.selectValue(num, callbacks);
    }
  }

  destroyWidgets() {
    this.advanceTimer?.remove(false);
    for (const w of this.widgets) w.destroy();
    this.widgets = [];
    this.optionTargets = [];
  }

  private scheduleAdvance(callbacks: RenderCallbacks) {
    if (!callbacks.onContinue) return;
    this.advanceTimer?.remove(false);
    const delay = 280;
    this.advanceTimer = this.scene.time.delayedCall(delay, () => callbacks.onContinue?.());
  }

  private selectValue(v: number | string, callbacks: RenderCallbacks, advance = true) {
    this.interactionCount += 1;
    if (this.firstValue == null) this.firstValue = v;
    this.value = v;
    callbacks.onInteract();
    callbacks.onValueChange(v);
    this.applySelectedStyles(v);
    this.showContinueButton(callbacks);
    likertLog("answer-select", { value: v });
    const autoAdvance = advance && !this.isLastItem;
    if (autoAdvance) this.scheduleAdvance(callbacks);
  }

  private showContinueButton(callbacks: RenderCallbacks) {
    if (!callbacks.onContinue) return;
    const existing = this.widgets.find((w) => w.getData?.("continueBtn"));
    if (existing) return;

    const z = this.layout.zones.footer;
    const btnW = 160;
    const btnH = 40;
    const x = this.layout.centerX - btnW / 2;
    const y = z.top + z.height * 0.52;

    const g = this.scene.add.graphics();
    g.fillStyle(this.theme.accent, 1);
    g.fillRoundedRect(x, y, btnW, btnH, 10);
    g.setData("continueBtn", true);
    g.setInteractive(new Phaser.Geom.Rectangle(x, y, btnW, btnH), Phaser.Geom.Rectangle.Contains);
    g.on("pointerdown", () => callbacks.onContinue?.());
    this.add(g, 200);

    const label = this.scene.add.text(
      this.layout.centerX,
      y + btnH / 2,
      this.isLastItem ? "Submit assessment" : "Continue",
      likertTextStyle({ fontSize: "14px", color: "#ffffff", fontStyle: "bold" })
    );
    label.setOrigin(0.5);
    label.setData("continueBtn", true);
    label.setInteractive({ useHandCursor: true });
    label.on("pointerdown", () => callbacks.onContinue?.());
    this.add(label, 201);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T, depth = 100): T {
    if ("setDepth" in obj && typeof obj.setDepth === "function") {
      obj.setDepth(depth);
    }
    this.widgets.push(obj);
    return obj;
  }

  private tweenIf(target: Phaser.GameObjects.GameObject, props: object, duration = 180) {
    if (this.theme.reducedMotion) return;
    this.scene.tweens.add({
      targets: target,
      duration,
      ease: "Sine.easeOut",
      ...props
    });
  }

  private drawHeader(ctx: RenderContext) {
    const z = this.layout.zones.header;
    const y = z.top + this.layout.pad * 0.6;

    const title = this.scene.add.text(
      this.layout.contentLeft,
      y,
      ctx.moduleTitle,
      likertTextStyle({
        fontSize: this.theme.titleSize,
        color: this.theme.textSecondary,
        fontStyle: "bold"
      })
    );
    title.setOrigin(0, 0);
    this.add(title, 10);

    const progressLabel = `${ctx.progressIndex} of ${ctx.progressTotal}`;
    const progressText = this.scene.add.text(
      this.layout.contentLeft + this.layout.contentWidth,
      y,
      progressLabel,
      likertTextStyle({ fontSize: this.theme.captionSize, color: this.theme.textMuted })
    );
    progressText.setOrigin(1, 0);
    this.add(progressText, 10);

    const categoryText = this.scene.add.text(
      this.layout.contentLeft,
      y + 18,
      categoryLabel(ctx.item.category),
      likertTextStyle({ fontSize: "11px", color: this.theme.textMuted })
    );
    categoryText.setOrigin(0, 0);
    this.add(categoryText, 10);

    if (ctx.sessionHint) {
      const hint = this.scene.add.text(
        this.layout.contentLeft + this.layout.contentWidth,
        y + 18,
        ctx.sessionHint,
        likertTextStyle({ fontSize: "11px", color: this.theme.textMuted })
      );
      hint.setOrigin(1, 0);
      this.add(hint, 10);
    }

    const barY = y + (ctx.sessionHint ? 36 : 32);
    const barW = this.layout.contentWidth;
    const pct = ctx.progressTotal > 0 ? ctx.progressIndex / ctx.progressTotal : 0;

    const track = this.scene.add.graphics();
    track.fillStyle(this.theme.track, 1);
    track.fillRoundedRect(this.layout.contentLeft, barY, barW, 6, 3);
    this.add(track, 10);

    const fill = this.scene.add.graphics();
    fill.fillStyle(this.theme.trackFill, 1);
    fill.fillRoundedRect(this.layout.contentLeft, barY, Math.max(6, barW * pct), 6, 3);
    this.add(fill, 11);
  }

  private drawPrompt(text: string) {
    const z = this.layout.zones.question;
    const prompt = this.scene.add.text(
      this.layout.centerX,
      zoneCenterY(z),
      text,
      likertTextStyle({
        fontSize: this.layout.mobile ? "19px" : this.theme.promptSize,
        color: this.theme.text,
        align: "center",
        wordWrap: { width: this.layout.contentWidth },
        lineSpacing: 8
      })
    );
    prompt.setOrigin(0.5, 0.5);
    this.add(prompt, 20);

    if (!this.theme.reducedMotion) {
      prompt.setAlpha(0);
      this.scene.tweens.add({
        targets: prompt,
        alpha: 1,
        y: prompt.y + 6,
        duration: 220,
        ease: "Sine.easeOut"
      });
    }
  }

  private drawFooter(itemType: LikertItemConfig["type"], isLastItem: boolean) {
    const z = this.layout.zones.footer;
    const submitHint = isLastItem ? "Enter to submit" : "Enter to continue";
    const keyHint =
      itemType === "binary"
        ? `1 / 2 or A / B  ·  ${submitHint}`
        : `1–5 to answer  ·  ← → to move  ·  ${submitHint}`;

    const line1 = this.scene.add.text(
      this.layout.centerX,
      z.top + z.height * 0.35,
      keyHint,
      likertTextStyle({
        fontSize: this.theme.captionSize,
        color: this.theme.textSecondary,
        align: "center"
      })
    );
    line1.setOrigin(0.5, 0.5);
    this.add(line1, 10);

    const line2 = this.scene.add.text(
      this.layout.centerX,
      z.top + z.height * 0.72,
      "Alt + ← to go back",
      likertTextStyle({
        fontSize: "11px",
        color: this.theme.textMuted,
        align: "center"
      })
    );
    line2.setOrigin(0.5, 0.5);
    this.add(line2, 10);
  }

  private registerOption(value: number | string, hit: Phaser.GameObjects.GameObject, visual: Phaser.GameObjects.GameObject[]) {
    this.optionTargets.push({ value, hit, visual });
  }

  private refreshFocusVisuals() {
    const selected = this.value;
    const focused = this.optionTargets[this.focusIndex]?.value;

    this.optionTargets.forEach((opt) => {
      const isSelected = selected === opt.value;
      const isFocused = focused === opt.value && selected == null;

      for (const v of opt.visual) {
        if (v instanceof Phaser.GameObjects.Arc) {
          if (isSelected) {
            v.setFillStyle(this.theme.accent);
            v.setStrokeStyle(3, this.theme.accentDark);
          } else if (isFocused) {
            v.setFillStyle(this.theme.surface);
            v.setStrokeStyle(3, this.theme.focusRing);
          } else {
            v.setFillStyle(this.theme.surface);
            v.setStrokeStyle(2, this.theme.border);
          }
        }
        if (v instanceof Phaser.GameObjects.Graphics) {
          /* binary buttons redrawn in applySelectedStyles */
        }
      }
    });
  }

  private applySelectedStyles(value: number | string) {
    this.optionTargets.forEach((opt) => {
      const active = opt.value === value;
      for (const v of opt.visual) {
        if (v instanceof Phaser.GameObjects.Arc) {
          v.setFillStyle(active ? this.theme.accent : this.theme.surface);
          v.setStrokeStyle(active ? 3 : 2, active ? this.theme.accentDark : this.theme.border);
        }
        if (v instanceof Phaser.GameObjects.Graphics) {
          const redraw = v.getData("redraw") as (() => void) | undefined;
          redraw?.();
        }
      }
    });
    this.refreshFocusVisuals();
  }

  private renderFrequency(item: LikertItemConfig, callbacks: RenderCallbacks) {
    const labels = item.scaleLabels ?? ["1", "2", "3", "4", "5"];
    const z = this.layout.zones.answer;
    const y = zoneCenterY(z) - (this.layout.mobile ? 8 : 0);
    const count = labels.length;
    const radius = this.layout.mobile ? 30 : 26;
    const gap = Math.min(
      this.layout.mobile ? 56 : 72,
      (this.layout.contentWidth - radius * 2) / Math.max(count - 1, 1)
    );
    const startX = this.layout.centerX - ((count - 1) * gap) / 2;

    labels.forEach((label, i) => {
      const x = startX + i * gap;
      const val = i + 1;
      const circle = this.scene.add.circle(x, y, radius, this.theme.surface);
      circle.setStrokeStyle(2, this.theme.border);
      circle.setInteractive({ useHandCursor: true });
      circle.setData("idx", val);
      circle.on("pointerover", () => {
        if (this.value != null) return;
        circle.setStrokeStyle(2, this.theme.focusRing);
        this.tweenIf(circle, { scale: 1.06 });
      });
      circle.on("pointerout", () => {
        if (this.value === val) return;
        circle.setStrokeStyle(2, this.theme.border);
        circle.setScale(1);
      });
      circle.on("pointerdown", () => this.selectValue(val, callbacks));
      this.add(circle, 30);

      const num = this.scene.add.text(
        x,
        y,
        String(val),
        likertTextStyle({
          fontSize: "16px",
          color: this.theme.text,
          fontStyle: "bold"
        })
      );
      num.setOrigin(0.5);
      num.setData("aria", `Option ${val}`);
      num.setInteractive({ useHandCursor: true });
      num.on("pointerdown", () => this.selectValue(val, callbacks));
      this.add(num, 31);

      const cap = this.scene.add.text(
        x,
        y + radius + 14,
        label,
        likertTextStyle({
          fontSize: this.theme.labelSize,
          color: this.theme.textSecondary,
          align: "center",
          wordWrap: { width: gap + 16 }
        })
      );
      cap.setOrigin(0.5, 0);
      cap.setInteractive({ useHandCursor: true });
      cap.on("pointerdown", () => this.selectValue(val, callbacks));
      this.add(cap, 31);

      this.registerOption(val, circle, [circle]);
    });
  }

  private renderSemantic(item: LikertItemConfig, callbacks: RenderCallbacks) {
    const [left, right] = item.poles ?? ["Low", "High"];
    const z = this.layout.zones.answer;
    const y = zoneCenterY(z) - 12;
    const lineW = this.layout.contentWidth;
    const x0 = this.layout.contentLeft;
    const x1 = this.layout.contentLeft + lineW;

    const line = this.scene.add.graphics();
    line.lineStyle(3, this.theme.track, 1);
    line.lineBetween(x0, y, x1, y);
    this.add(line, 25);

    const leftT = this.scene.add.text(
      x0,
      y + 28,
      left,
      likertTextStyle({
        fontSize: this.theme.labelSize,
        color: this.theme.textSecondary,
        wordWrap: { width: lineW * 0.44 }
      })
    );
    leftT.setOrigin(0, 0);
    this.add(leftT, 31);

    const rightT = this.scene.add.text(
      x1,
      y + 28,
      right,
      likertTextStyle({
        fontSize: this.theme.labelSize,
        color: this.theme.textSecondary,
        wordWrap: { width: lineW * 0.44 },
        align: "right"
      })
    );
    rightT.setOrigin(1, 0);
    this.add(rightT, 31);

    const knob = this.scene.add.circle(x0 + lineW / 2, y, 20, this.theme.accent);
    knob.setStrokeStyle(2, this.theme.accentDark);
    knob.setInteractive({ draggable: true, useHandCursor: true });
    knob.setData("idx", 3);
    this.add(knob, 35);

    const snap = (px: number, advance: boolean) => {
      const t = Phaser.Math.Clamp((px - x0) / lineW, 0, 1);
      const idx = Math.round(t * 4) + 1;
      const snapX = x0 + ((idx - 1) / 4) * lineW;
      knob.setX(snapX);
      knob.setData("idx", idx);
      this.selectValue(idx, callbacks, advance);
    };

    this.scene.input.setDraggable(knob);
    knob.on("drag", (_p: Phaser.Input.Pointer, dragX: number) => snap(dragX, false));
    knob.on("dragend", () => {
      if (this.value != null && !this.isLastItem) this.scheduleAdvance(callbacks);
    });

    const ticks: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 5; i++) {
      const tx = x0 + (i / 4) * lineW;
      const val = i + 1;
      const tick = this.scene.add.circle(tx, y, 8, this.theme.surface);
      tick.setStrokeStyle(2, this.theme.border);
      tick.setInteractive({ useHandCursor: true });
      tick.on("pointerover", () => tick.setStrokeStyle(2, this.theme.focusRing));
      tick.on("pointerout", () => {
        if (this.value !== val) tick.setStrokeStyle(2, this.theme.border);
      });
      tick.on("pointerdown", () => {
        knob.setX(tx);
        knob.setData("idx", val);
        this.selectValue(val, callbacks);
      });
      this.add(tick, 30);
      ticks.push(tick);
      this.registerOption(val, tick, [tick]);
    }

    this.add(knob, 35);
  }

  private renderBinary(item: LikertItemConfig, callbacks: RenderCallbacks) {
    const [a, b] = item.binaryLabels ?? ["No", "Yes"];
    const z = this.layout.zones.answer;
    const y = zoneCenterY(z);
    const btnW = Math.min(this.layout.mobile ? 140 : 200, (this.layout.contentWidth - this.layout.pad) / 2);
    const h = this.layout.mobile ? 56 : 52;
    const gap = this.layout.pad;
    const cx = this.layout.centerX;

    const makeBtn = (label: string, x: number, val: number, keyLabel: string) => {
      const g = this.scene.add.graphics();
      const t = this.scene.add.text(x, y - 6, label, likertTextStyle({
        fontSize: this.theme.labelSize,
        color: this.theme.text,
        align: "center",
        wordWrap: { width: btnW - 20 }
      }));
      t.setOrigin(0.5);

      const badge = this.scene.add.text(
        x,
        y + h / 2 - 14,
        keyLabel,
        likertTextStyle({ fontSize: "11px", color: this.theme.textMuted })
      );
      badge.setOrigin(0.5);

      const redraw = () => {
        const selected = this.value === val;
        g.clear();
        g.fillStyle(selected ? this.theme.accent : this.theme.surface, 1);
        g.lineStyle(2, selected ? this.theme.accentDark : this.theme.border, 1);
        g.fillRoundedRect(x - btnW / 2, y - h / 2, btnW, h, 14);
        g.strokeRoundedRect(x - btnW / 2, y - h / 2, btnW, h, 14);
        t.setColor(selected ? "#ffffff" : this.theme.text);
        badge.setColor(selected ? "#ecfdf5" : this.theme.textMuted);
      };

      redraw();
      g.setData("redraw", redraw);
      g.setInteractive(
        new Phaser.Geom.Rectangle(x - btnW / 2, y - h / 2, btnW, h),
        Phaser.Geom.Rectangle.Contains
      );
      g.on("pointerover", () => {
        if (this.value !== val) {
          g.clear();
          g.fillStyle(this.theme.surfaceHover, 1);
          g.lineStyle(2, this.theme.focusRing, 1);
          g.fillRoundedRect(x - btnW / 2, y - h / 2, btnW, h, 14);
          g.strokeRoundedRect(x - btnW / 2, y - h / 2, btnW, h, 14);
        }
      });
      g.on("pointerout", () => redraw());
      g.on("pointerdown", () => this.selectValue(val, callbacks));

      this.add(g, 30);
      this.add(t, 31);
      this.add(badge, 31);
      this.registerOption(val, g, [g]);
    };

    makeBtn(a, cx - btnW / 2 - gap / 2, 0, "1 / A");
    makeBtn(b, cx + btnW / 2 + gap / 2, 1, "2 / B");
  }
}
