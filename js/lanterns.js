import { px, ellipse } from './art.js?v=14';

// Three lanterns that the night wind scattered around Lantern Street.
export const LANTERN_DEFS = [
  { id: 'windLantern1', name: 'Red Lantern', tx: 18, ty: 14, color: '#ff8f7a' },
  { id: 'windLantern2', name: 'Red Lantern', tx: 26, ty: 12, color: '#ff8f7a' },
  { id: 'windLantern3', name: 'Red Lantern', tx: 23, ty: 16, color: '#ff8f7a' },
];

// Side quest. Deliberately separate from the five-treasure birthday quest:
// finishing it never changes the main quest or blocks the birthday house.
export class LanternQuest {
  constructor(sprite) {
    this.sprite = sprite;
    this.found = new Set();
    this.items = LANTERN_DEFS.map((def) => ({
      ...def,
      x: def.tx * 16 + 8,
      y: def.ty * 16 + 8,
      phase: def.tx * 0.6 + def.ty * 0.9,
    }));
  }

  reset() { this.found.clear(); }

  load(saved) {
    this.found.clear();
    if (!Array.isArray(saved)) return;
    for (const id of saved) {
      if (LANTERN_DEFS.some((d) => d.id === id)) this.found.add(id);
    }
  }

  serialize() {
    return this.items.filter((i) => this.found.has(i.id)).map((i) => i.id);
  }

  get count() { return this.found.size; }
  get all() { return this.found.size === this.items.length; }

  nearest(x, y) {
    let best = null, bestD = Infinity;
    for (const item of this.items) {
      if (this.found.has(item.id)) continue;
      const d = Math.hypot(item.x - x, item.y - y);
      if (d < bestD) { bestD = d; best = item; }
    }
    return best ? { item: best, dist: bestD } : null;
  }

  tryCollect(x, y, range = 32) {
    let best = null, bestD = range;
    for (const item of this.items) {
      if (this.found.has(item.id)) continue;
      const d = Math.hypot(item.x - x, item.y - y);
      if (d <= bestD) { bestD = d; best = item; }
    }
    if (best) this.found.add(best.id);
    return best;
  }

  draw(ctx, cam, time) {
    for (const item of this.items) {
      if (this.found.has(item.id)) continue;
      const sx = Math.round(item.x - cam.x);
      const sy = Math.round(item.y - cam.y);
      if (sx < -20 || sy < -24 || sx > ctx.canvas.width + 20 || sy > ctx.canvas.height + 24) continue;

      ctx.globalAlpha = 0.18 + Math.sin(time * 3 + item.phase) * 0.07;
      ellipse(ctx, sx, sy + 7, 9, 4, item.color);
      ctx.globalAlpha = 1;

      const bob = Math.round(Math.sin(time * 2.4 + item.phase) * 2);
      ctx.drawImage(this.sprite, sx - 6, sy - 9 + bob);

      if (Math.sin(time * 2.2 + item.phase) > 0.7) {
        px(ctx, sx + 6, sy - 8 + bob, 1, 4, '#fff3d0');
        px(ctx, sx + 4, sy - 6 + bob, 5, 1, '#fff3d0');
      }
    }
  }
}
