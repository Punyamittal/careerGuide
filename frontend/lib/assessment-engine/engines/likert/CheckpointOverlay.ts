import Phaser from "phaser";
import { likertTextStyle } from "./debug";
import { prefersReducedMotion } from "./layout";
import { getLikertTheme } from "./theme";

/** Lightweight pacing overlay — driven by config checkpoint messages. */
export class CheckpointOverlay {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private resolveWait: (() => void) | null = null;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(private scene: Phaser.Scene) {}

  show(message: string): Promise<void> {
    this.destroy();

    return new Promise((resolve) => {
      this.resolveWait = resolve;
      const theme = getLikertTheme();
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;

      const dim = this.scene.add.graphics();
      dim.fillStyle(0x0f172a, 0.35);
      dim.fillRect(0, 0, w, h);
      dim.setDepth(500);
      this.objects.push(dim);

      const cardW = Math.min(420, w - 48);
      const cardH = 140;
      const cx = (w - cardW) / 2;
      const cy = h / 2 - cardH / 2;

      const card = this.scene.add.graphics();
      card.fillStyle(theme.surface, 1);
      card.lineStyle(1, theme.border, 1);
      card.fillRoundedRect(cx, cy, cardW, cardH, 16);
      card.strokeRoundedRect(cx, cy, cardW, cardH, 16);
      card.setDepth(501);
      this.objects.push(card);

      const title = this.scene.add.text(
        w / 2,
        cy + 24,
        "Checkpoint",
        likertTextStyle({ fontSize: "13px", color: theme.textMuted, fontStyle: "bold" })
      );
      title.setOrigin(0.5, 0);
      title.setDepth(502);
      this.objects.push(title);

      const body = this.scene.add.text(
        w / 2,
        cy + 52,
        message,
        likertTextStyle({
          fontSize: "15px",
          color: theme.text,
          align: "center",
          wordWrap: { width: cardW - 40 },
          lineSpacing: 6
        })
      );
      body.setOrigin(0.5, 0);
      body.setDepth(502);
      this.objects.push(body);

      const btnLabel = this.scene.add.text(
        w / 2,
        cy + cardH - 28,
        "Continue  ·  Enter",
        likertTextStyle({ fontSize: "13px", color: theme.textSecondary })
      );
      btnLabel.setOrigin(0.5, 0.5);
      btnLabel.setDepth(502);
      btnLabel.setInteractive({ useHandCursor: true });
      btnLabel.on("pointerdown", () => this.dismiss());
      this.objects.push(btnLabel);

      this.keyHandler = (e: KeyboardEvent) => {
        if (e.key === "Enter") this.dismiss();
      };
      window.addEventListener("keydown", this.keyHandler);

      if (!prefersReducedMotion()) {
        for (const o of this.objects) {
          if ("setAlpha" in o) (o as Phaser.GameObjects.Text).setAlpha(0);
        }
        this.scene.tweens.add({
          targets: this.objects.filter((o) => "setAlpha" in o),
          alpha: 1,
          duration: 200,
          ease: "Sine.easeOut"
        });
      }
    });
  }

  private dismiss() {
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = undefined;
    }
    this.destroy();
    this.resolveWait?.();
    this.resolveWait = null;
  }

  destroy() {
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = undefined;
    }
    for (const o of this.objects) o.destroy();
    this.objects = [];
  }
}
