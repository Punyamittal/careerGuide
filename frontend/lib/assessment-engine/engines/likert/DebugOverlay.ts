import Phaser from "phaser";
import type { LikertItemConfig, LikertModuleConfig } from "../../configs/module-config.types";
import { isLikertDebugMode, likertLog, likertTextStyle } from "./debug";
import { getLikertTheme } from "./theme";

const DEBUG_DEPTH = 8000;

/** Collapsible dev panel — visible only with ?debug=true */
export class DebugOverlay {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private expanded = false;

  constructor(private scene: Phaser.Scene) {}

  render(ctx: {
    moduleId: string;
    item: LikertItemConfig | null;
    config: LikertModuleConfig;
    rendererType: string;
  }) {
    this.destroy();
    if (!isLikertDebugMode()) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const theme = getLikertTheme();

    const tab = this.scene.add.text(12, h - 36, this.expanded ? "◀ Debug" : "▶ Debug", {
      ...likertTextStyle({
        fontSize: "11px",
        color: "#ffffff",
        backgroundColor: "rgba(15,23,42,0.75)",
        padding: { x: 8, y: 4 }
      })
    });
    tab.setDepth(DEBUG_DEPTH);
    tab.setInteractive({ useHandCursor: true });
    tab.on("pointerdown", () => {
      this.expanded = !this.expanded;
      this.render(ctx);
    });
    this.objects.push(tab);

    if (!this.expanded) {
      likertLog("debug-collapsed");
      return;
    }

    const preview = ctx.item
      ? JSON.stringify(
          { id: ctx.item.id, type: ctx.item.type, prompt: ctx.item.prompt.slice(0, 60) },
          null,
          0
        )
      : "(no item)";

    const lines = [
      `module: ${ctx.moduleId}`,
      `question: ${ctx.item?.id ?? "—"}`,
      `renderer: ${ctx.rendererType}`,
      `scene: ${Math.round(w)}×${Math.round(h)}`,
      `items: ${ctx.config.items.length}`,
      preview
    ];

    const panel = this.scene.add.text(12, h - 36 - lines.length * 14 - 24, lines.join("\n"), {
      ...likertTextStyle({
        fontSize: "10px",
        color: theme.text,
        backgroundColor: "rgba(15,23,42,0.88)",
        padding: { x: 10, y: 8 }
      })
    });
    panel.setOrigin(0, 1);
    panel.setDepth(DEBUG_DEPTH - 1);
    this.objects.push(panel);

    likertLog("debug-expanded", { itemId: ctx.item?.id });
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.objects = [];
  }
}
