import { panel, UI } from './ui.js?v=11';
import { drawTiny } from './font.js?v=11';
import { ITEM_DEFS } from './collectibles.js?v=11';

export class Quest {
  constructor(collectibles) {
    this.items = collectibles;
  }

  // Short hint pointing to the nearest remaining treasure.
  hint(player) {
    if (this.items.all) return { text: 'ALL FOUND! GO INSIDE', dir: null };
    const near = this.items.nearest(player.x, player.y);
    if (!near) return { text: 'EXPLORE THE FOREST', dir: null };
    const dx = near.item.x - player.x;
    const dy = near.item.y - player.y;
    const arrow = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '>' : '<') : (dy > 0 ? 'v' : '^');
    return { text: `${near.item.name.toUpperCase()} ${arrow}`, dir: arrow };
  }

  renderHUD(ctx, player, touchMode = false) {
    const c = this.items;

    // Compact quest panel - top left, small enough to see the world behind it.
    panel(ctx, 4, 4, 126, 32, { fill: '#211331' });
    drawTiny(ctx, 'BIRTHDAY QUEST', 9, 9, { color: UI.gold });
    drawTiny(ctx, `${c.count}/5`, 125, 9, { color: UI.pink, align: 'right' });

    for (let i = 0; i < ITEM_DEFS.length; i++) {
      const def = ITEM_DEFS[i];
      const x = 8 + i * 23;
      const y = 17;
      const got = c.collected.has(def.id);
      ctx.fillStyle = got ? '#67418d' : '#120b20';
      ctx.fillRect(x, y, 19, 14);
      ctx.fillStyle = got ? '#c9a2e8' : '#4c3a60';
      ctx.fillRect(x, y, 19, 1);
      ctx.fillRect(x, y, 1, 14);
      ctx.fillRect(x + 18, y, 1, 14);
      ctx.fillRect(x, y + 13, 19, 1);
      const sprite = c.sprites[def.id];
      ctx.save();
      if (!got) ctx.globalAlpha = 0.4;
      ctx.drawImage(sprite, x + 3, y + 1, Math.min(13, sprite.width), Math.min(12, sprite.height));
      ctx.restore();
      if (got) drawTiny(ctx, '+', x + 14, y + 8, { color: UI.green });
    }

    // Compact hint panel - top right, beside the minimap.
    const h = this.hint(player);
    panel(ctx, 134, 4, 168, 17, { fill: '#211331' });
    drawTiny(ctx, `NEXT: ${h.text}`.slice(0, 32), 138, 9, {
      color: c.all ? UI.green : UI.cream,
    });

    // Slim control hint along the bottom edge.
    if (!touchMode) {
      panel(ctx, 4, 202, 150, 12, { fill: '#211331', shadow: false });
      drawTiny(ctx, 'MOVE WASD/ARROWS  ACT E/SPACE', 8, 205, { color: '#fff2dd' });
    }
  }
}
