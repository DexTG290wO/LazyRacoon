import { px, ellipse, PAL } from './art.js?v=14';

// Tile coordinates for each of the five gifts hidden around the forest.
export const ITEM_DEFS = [
  { id: 'pinkFlower', name: 'Pink Flower', tx: 8, ty: 23, color: '#ff9dc4' },
  { id: 'purpleFlower', name: 'Purple Flower', tx: 49, ty: 18, color: '#c49af2' },
  { id: 'goldenStar', name: 'Golden Star', tx: 12, ty: 7, color: PAL.gold },
  { id: 'blueCrystal', name: 'Blue Crystal', tx: 34, ty: 30, color: PAL.crystal },
  { id: 'ribbon', name: 'Special Ribbon', tx: 34, ty: 10, color: '#ffc2da' },
];

export class Collectibles {
  constructor(sprites) {
    this.sprites = sprites;
    this.collected = new Set();
    this.items = ITEM_DEFS.map((def) => ({
      ...def,
      x: def.tx * 16 + 8,
      y: def.ty * 16 + 8,
      phase: def.tx * 0.7 + def.ty * 0.3,
    }));
  }

  reset() {
    this.collected.clear();
  }

  load(saved) {
    this.collected.clear();
    if (Array.isArray(saved)) {
      for (const id of saved) {
        if (ITEM_DEFS.some((d) => d.id === id)) this.collected.add(id);
      }
    }
  }

  serialize() {
    return this.items.filter((i) => this.collected.has(i.id)).map((i) => i.id);
  }

  get count() { return this.collected.size; }
  get all() { return this.collected.size === this.items.length; }

  // Nearest uncollected item and its distance from the player, in pixels.
  nearest(px_, py) {
    let best = null;
    let bestD = Infinity;
    for (const item of this.items) {
      if (this.collected.has(item.id)) continue;
      const d = Math.hypot(item.x - px_, item.y - py);
      if (d < bestD) { bestD = d; best = item; }
    }
    return best ? { item: best, dist: bestD } : null;
  }

  // Try to collect the closest item within range. Returns the item or null.
  tryCollect(x, y, range = 26) {
    let best = null;
    let bestD = range;
    for (const item of this.items) {
      if (this.collected.has(item.id)) continue;
      const d = Math.hypot(item.x - x, item.y - y);
      if (d <= bestD) { bestD = d; best = item; }
    }
    if (best) this.collected.add(best.id);
    return best;
  }

  draw(ctx, cam, time) {
    for (const item of this.items) {
      if (this.collected.has(item.id)) continue;
      const sx = Math.round(item.x - cam.x);
      const sy = Math.round(item.y - cam.y);
      if (sx < -24 || sy < -32 || sx > ctx.canvas.width + 24 || sy > ctx.canvas.height + 32) continue;

      // Soft glowing pool on the ground.
      ctx.globalAlpha = 0.22 + Math.sin(time * 3 + item.phase) * 0.06;
      ellipse(ctx, sx, sy + 7, 10, 4, item.color);
      ctx.globalAlpha = 1;

      const bob = Math.round(Math.sin(time * 2.6 + item.phase) * 2);
      const sprite = this.sprites[item.id];
      ctx.drawImage(sprite, sx - sprite.width / 2, sy - 12 + bob);

      // Twinkling sparkle.
      const tw = (time * 1.8 + item.phase) % (Math.PI * 2);
      if (Math.sin(tw) > 0.55) {
        const ox = sx + 8;
        const oy = sy - 10 + bob;
        px(ctx, ox, oy - 2, 1, 5, '#ffffff');
        px(ctx, ox - 2, oy, 5, 1, '#ffffff');
        px(ctx, ox, oy, 1, 1, item.color);
      }
    }
  }

  // Small icons used by the quest HUD.
  drawIcon(ctx, id, x, y, unlocked) {
    const sprite = this.sprites[id];
    ctx.save();
    if (!unlocked) ctx.globalAlpha = 0.32;
    ctx.drawImage(sprite, x + 2, y + 1);
    ctx.restore();
  }
}
