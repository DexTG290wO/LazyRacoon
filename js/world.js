import { drawGround, hash2, PAL, px, ellipse } from './art.js?v=14';
import { drawText } from './font.js?v=14';

export const TILE = 16;
export const WORLD_W = 60;
export const WORLD_H = 44;

const HOUSE = { x: 25, y: 4, w: 5, h: 4, drawX: 394, drawY: 53 };
export const DOOR_TILE = { x: 27, y: 7 };
export const START = { x: 10 * TILE + 8, y: 36 * TILE + 8 };
export const SIGN_TILE = { x: 8, y: 34 };

// Optional night-time side area, tucked against the southern end of the woods.
export const STREET = { x1: 17, y1: 10, x2: 27, y2: 16, cx: 22, cy: 13 };
export const STALLS = [
  { id: 'fox', type: 'stallFox', tx: 19, ty: 12, name: 'Fox Lantern Maker' },
  { id: 'owl', type: 'stallOwl', tx: 23, ty: 11, name: 'Owl Musician' },
  { id: 'bear', type: 'stallBear', tx: 26, ty: 14, name: 'Cookie Bear' },
];

export class World {
  constructor(art) {
    this.art = art;
    this.w = WORLD_W;
    this.h = WORLD_H;
    this.pixelW = WORLD_W * TILE;
    this.pixelH = WORLD_H * TILE;
    this.ground = [];
    this.objects = [];
    this.house = HOUSE;
    this.doorTile = DOOR_TILE;
    this.doorOpen = false;
    this.streetLit = false;
    this.build();
  }

  build() {
    const { w, h } = this;
    this.ground = Array.from({ length: h }, () => new Array(w).fill('grass'));
    this.objects = [];

    const set = (tx, ty, type) => {
      if (tx >= 0 && ty >= 0 && tx < w && ty < h) this.ground[ty][tx] = type;
    };
    // Place a landmark even if random scenery already occupies the tile.
    const place = (type, tx, ty) => {
      this.objects = this.objects.filter((o) => o.tx !== tx || o.ty !== ty);
      this.addObject(type, tx, ty);
    };
    const clearArea = (x1, y1, x2, y2) => {
      this.objects = this.objects.filter((o) => o.tx < x1 || o.tx > x2 || o.ty < y1 || o.ty > y2);
    };

    const carveH = (x1, x2, y, width = 1) => {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
        for (let i = 0; i < width; i++) if (this.ground[y + i] && this.ground[y + i][x] === 'grass') set(x, y + i, 'path');
    };
    const carveV = (y1, y2, x, width = 1) => {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
        for (let i = 0; i < width; i++) if (this.ground[y] && this.ground[y][x + i] === 'grass') set(x + i, y, 'path');
    };
    const clearAround = (tx, ty, r = 1) => {
      for (let y = ty - r; y <= ty + r; y++)
        for (let x = tx - r; x <= tx + r; x++) {
          set(x, y, 'grass');
          this.objects = this.objects.filter((o) => Math.abs(o.tx - x) > 1 || Math.abs(o.ty - y) > 1);
        }
    };

    // ---- Paths -------------------------------------------------------
    // Start clearing and the main spine of the forest.
    for (let y = 34; y <= 38; y++) for (let x = 8; x <= 12; x++) set(x, y, 'path');
    carveV(24, 36, 10, 2);
    carveH(8, 18, 24, 2);
    carveV(16, 25, 16, 2);
    carveH(16, 28, 17, 2);
    carveV(8, 18, 27, 2);
    carveH(17, 38, 21, 2);
    // Route to the pond bridge and beyond.
    carveV(17, 22, 50, 2);
    carveH(50, 54, 22, 2);
    // Northern trail to the golden star.
    carveH(10, 24, 7, 2);
    carveV(7, 17, 12, 2);
    // Trail to the ribbon near the house.
    carveH(28, 35, 10, 2);
    carveV(10, 17, 34, 2);
    // Trail south to the crystal.
    carveV(22, 30, 34, 2);
    carveH(30, 35, 30, 2);
    // Garden approach.
    carveH(6, 10, 26, 2);

    // ---- Flower garden ----------------------------------------------
    for (let y = 20; y <= 25; y++)
      for (let x = 4; x <= 9; x++) if (this.ground[y][x] !== 'path') set(x, y, 'soil');
    for (let x = 3; x <= 10; x += 1) {
      this.addObject('fence', x, 19);
      this.addObject('fence', x, 26);
    }
    for (let y = 20; y <= 25; y += 1) {
      this.addObject('fence', 3, y);
      this.addObject('fence', 10, y);
    }

    // ---- Pond + bridge ------------------------------------------------
    const cx = 44, cy = 22, rx = 8, ry = 5;
    for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
      for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
        const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (v <= 1) set(x, y, 'water');
        else if (v <= 1.25 && hash2(x, y) > 0.55) set(x, y, 'grass');
      }
    }
    for (let x = 37; x <= 51; x++) set(x, cy, 'bridge');
    // Reeds and rocks around the pond.
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * (rx + 2));
      const y = Math.round(cy + Math.sin(a) * (ry + 2));
      if (this.ground[y] && this.ground[y][x] === 'grass') this.addObject(i % 3 === 0 ? 'rock' : 'bush', x, y);
    }

    // ---- Birthday house ----------------------------------------------
    for (let y = HOUSE.y; y < HOUSE.y + HOUSE.h; y++)
      for (let x = HOUSE.x; x < HOUSE.x + HOUSE.w; x++) set(x, y, 'wall');
    set(DOOR_TILE.x, DOOR_TILE.y, 'floor');
    set(DOOR_TILE.x, DOOR_TILE.y + 1, 'path');
    // Little front garden.
    for (const [x, y] of [[23, 8], [30, 8], [24, 9], [29, 9]]) this.addObject('flower', x, y);
    for (const [x, y] of [[24, 10], [30, 10], [26, 11]]) this.addObject('bush', x, y);

    // ---- Trees --------------------------------------------------------
    // Dense border keeps the player inside the forest.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const edge = x < 2 || y < 2 || x > w - 3 || y > h - 3;
        if (edge && hash2(x, y) > 0.12 && this.ground[y][x] === 'grass') this.addObject('tree', x, y);
      }
    // Forest canopy in the north.
    for (let y = 3; y < 16; y++)
      for (let x = 2; x < w - 2; x++) {
        if (this.ground[y][x] !== 'grass') continue;
        if (hash2(x * 3 + 11, y * 5 + 7) > 0.6) this.addObject('tree', x, y);
      }
    // Sparse trees and nature elsewhere.
    for (let y = 16; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        if (this.ground[y][x] !== 'grass') continue;
        const r = hash2(x * 7 + 3, y * 11 + 5);
        if (r > 0.955) this.addObject('tree', x, y);
        else if (r > 0.93) this.addObject('rock', x, y);
        else if (r > 0.905) this.addObject('bush', x, y);
        else if (r > 0.88) this.addObject('flower', x, y);
      }

    // Flowers inside the soil patch.
    for (let y = 20; y <= 25; y++)
      for (let x = 4; x <= 9; x++)
        if (hash2(x + 21, y + 31) > 0.08) this.addObject('flower', x, y);

    // Cosy woodland details: toadstools, stumps, fallen logs and tall grass.
    for (let y = 6; y < h - 3; y++)
      for (let x = 3; x < w - 3; x++) {
        if (this.ground[y][x] !== 'grass') continue;
        const r = hash2(x * 13 + 7, y * 17 + 3);
        if (r > 0.978) this.addObject('mushroom', x, y);
        else if (r > 0.966) this.addObject('stump', x, y);
        else if (r > 0.958) this.addObject('log', x, y);
        else if (r > 0.93) this.addObject('tallGrass', x, y);
      }
    // Give the house a clear front garden so its facade is visible.
    clearArea(23, 8, 31, 13);
    // Warm lanterns light the way near the start and the birthday house.
    for (const [x, y] of [[7, 33], [13, 33], [23, 11], [31, 11], [26, 12], [27, 9]]) {
      this.objects = this.objects.filter((o) => o.tx !== x || o.ty !== y);
      this.addObject('lantern', x, y);
    }

    // ---- Lantern Street (Phố Đèn Lồng) ---------------------------------
    // A small night market reached from the Whispering Woods path at (22,17).
    for (let y = STREET.y1; y <= STREET.y2; y++)
      for (let x = STREET.x1; x <= STREET.x2; x++) set(x, y, 'lane');
    clearArea(STREET.x1, STREET.y1, STREET.x2, STREET.y2);
    for (let y = 16; y <= 18; y++) set(22, y, y === 16 ? 'lane' : 'path');

    // Red paper lanterns hanging along both sides of the lane.
    for (const [x, y] of [
      [17, 10], [20, 10], [24, 10], [27, 10],
      [17, 13], [27, 13], [17, 16], [25, 16],
    ]) place('redLantern', x, y);
    place('streetSign', 22, 15);
    for (const stall of STALLS) place(stall.type, stall.tx, stall.ty);

    // ---- Places worth discovering --------------------------------------
    // Picnic clearing on the south-west shore of the pond.
    clearArea(34, 27, 41, 33);
    for (let y = 28; y <= 31; y++)
      for (let x = 35; x <= 39; x++) set(x, y, 'grass');
    place('blanket', 37, 29);
    place('basket', 38, 29);
    place('bench', 37, 31);

    // Fairy ring of glowing mushrooms in the south.
    clearArea(16, 30, 24, 38);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.round(20 + Math.cos(a) * 3);
      const y = Math.round(34 + Math.sin(a) * 3);
      set(x, y, 'grass');
      place('glowMushroom', x, y);
    }
    set(20, 34, 'grass');
    place('crystalCluster', 20, 34);

    // Ancient stone circle in the north-east with a crystal at its heart.
    clearArea(49, 6, 55, 12);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.round(52 + Math.cos(a) * 2);
      const y = Math.round(9 + Math.sin(a) * 2);
      set(x, y, 'grass');
      place('rock', x, y);
    }
    set(52, 9, 'grass');
    place('crystalCluster', 52, 9);

    // A shy forest bunny and more signs with local gossip.
    set(14, 22, 'grass');
    place('bunny', 14, 22);
    for (const [x, y] of [[20, 17], [54, 22], [18, 31], [52, 14]]) {
      place('sign', x, y);
    }

    // ---- Landmarks / safe zones ---------------------------------------
    const items = [[8, 23], [49, 18], [12, 7], [34, 30], [34, 10]];
    for (const [x, y] of items) clearAround(x, y, 1);
    for (let y = 32; y <= 38; y++)
      for (let x = 6; x <= 14; x++) {
        set(x, y, this.ground[y][x] === 'wall' || this.ground[y][x] === 'water' ? this.ground[y][x] : 'path');
        this.objects = this.objects.filter((o) => Math.abs(o.tx - x) > 2 || Math.abs(o.ty - y) > 2);
      }
    // Re-apply the house footprint in case carving clipped it.
    for (let y = HOUSE.y; y < HOUSE.y + HOUSE.h; y++)
      for (let x = HOUSE.x; x < HOUSE.x + HOUSE.w; x++) set(x, y, 'wall');
    set(DOOR_TILE.x, DOOR_TILE.y, 'floor');
    set(DOOR_TILE.x, DOOR_TILE.y + 1, 'path');

    // ---- Sign ---------------------------------------------------------
    // A deliberately marked tree conceals a tiny optional birthday nook.
    clearArea(24, 4, 26, 6);
    place('tree', 25, 5);
    this.addObject('sign', SIGN_TILE.x, SIGN_TILE.y);
    this.objects = this.objects.filter((o) => o.type !== 'tree' && o.type !== 'rock' && o.type !== 'bush'
      ? true : Math.abs(o.tx - SIGN_TILE.x) > 1 || Math.abs(o.ty - SIGN_TILE.y) > 1);

    // Keep every object's draw position precomputed for sorting/rendering.
    for (const o of this.objects) {
      o.variant = Math.floor(hash2(o.tx + 1, o.ty + 2) * 3);
      const s = this.spriteFor(o);
      o.sprite = s;
      o.drawX = o.tx * TILE + 8 - s.width / 2;
      if (o.type === 'tree') o.drawY = o.ty * TILE - 26;
      else if (o.type === 'sign') o.drawY = o.ty * TILE - 8;
      else if (o.type === 'fence') o.drawY = o.ty * TILE - 2;
      else if (o.type === 'lantern') o.drawY = o.ty * TILE - 14;
      else if (o.type === 'bunny') o.drawY = o.ty * TILE - 8;
      else if (o.type === 'bench') o.drawY = o.ty * TILE + 4;
      else if (o.type === 'blanket') o.drawY = o.ty * TILE + 6;
      else if (o.type === 'basket') o.drawY = o.ty * TILE + 5;
      else if (o.type === 'glowMushroom') o.drawY = o.ty * TILE + 3;
      else if (o.type === 'crystalCluster') o.drawY = o.ty * TILE + 2;
      else if (o.type === 'redLantern') o.drawY = o.ty * TILE - 6;
      else if (o.type === 'streetSign') o.drawY = o.ty * TILE - 6;
      else if (o.type.startsWith('stall')) o.drawY = o.ty * TILE - 14;
      else if (o.type === 'flower') o.drawY = o.ty * TILE + 1;
      else if (o.type === 'tallGrass') o.drawY = o.ty * TILE + 3;
      else if (o.type === 'mushroom') o.drawY = o.ty * TILE + 5;
      else if (o.type === 'stump' || o.type === 'log') o.drawY = o.ty * TILE + 5;
      else o.drawY = o.ty * TILE + 9;
      o.bottomY = o.drawY + s.height;
    }
  }

  addObject(type, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    if (this.objects.some((o) => o.tx === tx && o.ty === ty)) return;
    // Never place solid scenery on a path, bridge, water or house tile.
    // Signs and lanterns are the exception - they belong beside the paths.
    const g = this.ground[ty][tx];
    const allowed = g === 'grass' || g === 'soil' || g === 'lane'
      || ((type === 'lantern' || type === 'sign') && g === 'path');
    if (!allowed) return;
    const soft = ['flower', 'tallGrass', 'mushroom', 'glowMushroom', 'blanket', 'basket', 'bunny',
      'redLantern', 'streetSign'];
    this.objects.push({
      type, tx, ty,
      solid: !soft.includes(type),
    });
  }

  spriteFor(o) {
    const a = this.art;
    switch (o.type) {
      case 'tree': return a.tree[o.variant || 0];
      case 'rock': return a.rock;
      case 'bush': return a.bush[(o.variant || 0) % a.bush.length];
      case 'fence': return a.fence;
      case 'sign': return a.sign;
      case 'stump': return a.stump;
      case 'mushroom': return a.mushroom;
      case 'log': return a.log;
      case 'lantern': return a.lantern;
      case 'tallGrass': return a.tallGrass;
      case 'bunny': return a.bunny;
      case 'blanket': return a.blanket;
      case 'basket': return a.basket;
      case 'bench': return a.bench;
      case 'glowMushroom': return a.glowMushroom;
      case 'crystalCluster': return a.crystalCluster;
      case 'redLantern': return a.redLantern;
      case 'streetSign': return a.streetSign;
      case 'stallFox': return a.stallFox;
      case 'stallOwl': return a.stallOwl;
      case 'stallBear': return a.stallBear;
      case 'flower': return a.flowers[(o.tx + o.ty) % a.flowers.length];
      default: return a.rock;
    }
  }

  groundAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 'wall';
    return this.ground[ty][tx];
  }

  objectAt(tx, ty) {
    for (const o of this.objects) if (o.tx === tx && o.ty === ty && o.solid) return o;
    return null;
  }

  isSolid(x, y, w = 10, h = 8) {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 1) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const g = this.groundAt(tx, ty);
        if (g === 'wall' || g === 'water') return true;
        if (this.objectAt(tx, ty)) return true;
      }
    }
    return false;
  }

  isDoorTile(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return tx === DOOR_TILE.x && ty === DOOR_TILE.y;
  }

  render(ctx, cam, time) {
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;
    const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const x1 = Math.min(this.w - 1, Math.ceil((cam.x + viewW) / TILE) + 1);
    const y1 = Math.min(this.h - 1, Math.ceil((cam.y + viewH) / TILE) + 1);

    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        drawGround(ctx, this.ground[ty][tx], tx, ty, time, cam);

    // Lantern Street: dim the cobbles, then hang warm bulbs above the lane.
    const stLeft = STREET.x1 * TILE - cam.x;
    const stTop = STREET.y1 * TILE - cam.y;
    const stW = (STREET.x2 - STREET.x1 + 1) * TILE;
    const stH = (STREET.y2 - STREET.y1 + 1) * TILE;
    if (stLeft < viewW && stLeft + stW > 0 && stTop < viewH && stTop + stH > 0) {
      ctx.fillStyle = this.streetLit ? 'rgba(18,11,38,0.20)' : 'rgba(18,11,38,0.42)';
      ctx.fillRect(stLeft, stTop, stW, stH);

      // Three sagging strings of fairy lights.
      for (const row of [0, 3, 6]) {
        const baseY = stTop + row * TILE + 7;
        for (let i = 0; i <= stW; i += 2) {
          const sag = Math.sin((i / stW) * Math.PI) * 5;
          px(ctx, stLeft + i, baseY + sag, 2, 1, '#5b456b');
        }
        for (let i = 12; i < stW - 6; i += 26) {
          const sag = Math.sin((i / stW) * Math.PI) * 5;
          const bx = Math.round(stLeft + i);
          const by = Math.round(baseY + sag);
          const twinkle = Math.sin(time * 3 + i * 0.4 + row) > -0.2;
          ctx.globalAlpha = twinkle ? 0.95 : 0.45;
          ellipse(ctx, bx, by + 2, 4, 3, PAL.lanternGlow);
          ctx.fillStyle = i % 52 === 12 ? '#fff0a8' : (row === 3 ? '#ffd0e0' : '#ffcf8a');
          ctx.fillRect(bx, by + 1, 2, 3);
          ctx.globalAlpha = 1;
        }
      }

      // Warm pools of light beneath every hanging lantern.
      for (const o of this.objects) {
        if (o.type !== 'redLantern') continue;
        const sx = o.tx * TILE + 8 - cam.x;
        const sy = o.ty * TILE + 10 - cam.y;
        if (sx < -20 || sy < -20 || sx > viewW + 20 || sy > viewH + 20) continue;
        ctx.globalAlpha = 0.16 + Math.sin(time * 2 + o.tx) * 0.06;
        ellipse(ctx, sx, sy, 12, 9, PAL.lanternGlow);
        ctx.globalAlpha = 1;
      }

      // Hanging sign above the street entrance.
      const bx = STREET.cx * TILE + 40 - cam.x;
      const by = STREET.y2 * TILE + 18 - cam.y;
      drawText(ctx, 'LANTERN STREET', bx, by, {
        scale: 1, align: 'center', color: '#ffd9a0', shadow: '#1a0f2c',
      });
    }

    // Sun-dappled shade and soft contact shadows beneath scenery.
    for (const o of this.objects) {
      if (o.tx < x0 - 2 || o.tx > x1 + 2 || o.ty < y0 - 3 || o.ty > y1 + 2) continue;
      const sx = o.tx * TILE + 8 - cam.x;
      const sy = o.ty * TILE + 13 - cam.y;
      if (o.type === 'tree') {
        ctx.globalAlpha = 0.13;
        ellipse(ctx, sx + 3, sy - 4, 16, 7, '#123a26');
        ctx.globalAlpha = 1;
      } else if (o.type !== 'flower' && o.type !== 'tallGrass') {
        ctx.globalAlpha = 0.2;
        ellipse(ctx, sx, sy, o.type === 'log' ? 11 : 7, 3, '#160e24');
        ctx.globalAlpha = 1;
      }
    }

    // Floating pollen / fireflies drifting through the forest.
    for (let i = 0; i < 26; i++) {
      const wx = hash2(i * 3 + 1, 9) * this.pixelW + Math.sin(time * 0.6 + i) * 14;
      const wy = hash2(i, i * 5 + 2) * this.pixelH + Math.cos(time * 0.45 + i * 2) * 10 - (time * 3) % 12;
      const sx = Math.round(wx - cam.x);
      const sy = Math.round(wy - cam.y);
      if (sx < 0 || sy < 0 || sx > viewW || sy > viewH) continue;
      const glow = Math.sin(time * 2.4 + i * 1.7);
      if (glow > -0.35) {
        ctx.globalAlpha = 0.35 + glow * 0.3;
        ctx.fillStyle = i % 4 === 0 ? '#ffe6a3' : '#d9f2c0';
        ctx.fillRect(sx, sy, 1, 1);
        if (i % 5 === 0) ctx.fillRect(sx - 1, sy + 1, 1, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Two little butterflies wobbling around the flower garden.
    for (let i = 0; i < 2; i++) {
      const bx = (5 + i * 3) * TILE + Math.sin(time * 0.8 + i * 3) * 20 - cam.x;
      const by = (22 + i * 2) * TILE + Math.cos(time * 1.1 + i) * 12 - cam.y;
      if (bx < -10 || by < -10 || bx > viewW + 10 || by > viewH + 10) continue;
      const flap = Math.sin(time * 9 + i) > 0 ? 1 : 0;
      ctx.fillStyle = i ? '#ffc2da' : '#d9b6f5';
      ctx.fillRect(Math.round(bx), Math.round(by), 1, 2);
      ctx.fillRect(Math.round(bx + 2 + flap), Math.round(by), 1, 2);
    }

    // Lily pads on the pond for a bit of life.
    for (const [lx, ly] of [[41, 20], [46, 24], [43, 25]]) {
      const sx = lx * TILE + 8 - cam.x;
      const sy = ly * TILE + 9 - cam.y;
      if (sx < -10 || sy < -10 || sx > viewW + 10 || sy > viewH + 10) continue;
      ellipse(ctx, sx, sy, 5, 3, '#3f8f62');
      px(ctx, sx + 1, sy, 3, 1, '#6fc188');
      px(ctx, sx - 3, sy - 2, 2, 1, '#ffc2da');
    }

    // Soft halos around the glowing toadstools in the fairy ring.
    for (const o of this.objects) {
      if (o.type !== 'glowMushroom') continue;
      const sx = o.tx * TILE + 8 - cam.x;
      const sy = o.ty * TILE + 8 - cam.y;
      if (sx < -20 || sy < -20 || sx > viewW + 20 || sy > viewH + 20) continue;
      ctx.globalAlpha = 0.14 + Math.sin(time * 2.6 + o.tx) * 0.07;
      ellipse(ctx, sx, sy, 9, 7, '#b48ae2');
      ctx.globalAlpha = 1;
    }

    // Everything that overlaps is depth-sorted by its bottom edge.
    const drawables = [];
    for (const o of this.objects) {
      if (o.bottomY < cam.y - 60 || o.drawY > cam.y + viewH + 20) continue;
      drawables.push({ y: o.bottomY, draw: () => ctx.drawImage(o.sprite, Math.round(o.drawX - cam.x), Math.round(o.drawY - cam.y)) });
    }
    drawables.push({
      y: HOUSE.drawY + 72,
      draw: () => {
        const hx = HOUSE.drawX - cam.x;
        const hy = HOUSE.drawY - cam.y;
        ctx.drawImage(this.art.house, Math.round(hx), Math.round(hy));
        // Warm light breathing behind the two windows.
        ctx.globalAlpha = 0.1 + Math.sin(time * 2) * 0.04;
        ellipse(ctx, hx + 19, hy + 44, 10, 8, '#ffe9a8');
        ellipse(ctx, hx + 59, hy + 44, 10, 8, '#ffe9a8');
        ctx.globalAlpha = 1;
        // Lazy chimney smoke drifting into the sky.
        for (let i = 0; i < 4; i++) {
          const p = (time * 0.32 + i * 0.25) % 1;
          const sx = hx + 56 + Math.sin(p * 5 + i) * 5;
          const sy = hy + 8 - p * 28;
          ctx.globalAlpha = (1 - p) * 0.32;
          ellipse(ctx, sx, sy, 2 + p * 3, 1.5 + p * 2, '#d8c8e8');
        }
        ctx.globalAlpha = 1;
      },
    });
    drawables.push({
      y: DOOR_TILE.y * TILE + 12,
      draw: () => {
        const dx = DOOR_TILE.x * TILE + 1 - cam.x;
        const dy = DOOR_TILE.y * TILE - 10 - cam.y;
        const door = this.doorOpen ? this.art.doorOpen : this.art.doorClosed;
        ctx.drawImage(door, Math.round(dx), Math.round(dy));
        // A little padlock hangs on the door until the quest is complete.
        const lx = Math.round(dx + 7);
        const ly = Math.round(dy - 5);
        if (!this.doorOpen) {
          ctx.fillStyle = '#3a2444';
          ctx.fillRect(lx - 2, ly - 3, 5, 1);
          ctx.fillRect(lx - 3, ly - 2, 1, 4);
          ctx.fillRect(lx + 2, ly - 2, 1, 4);
          ctx.fillStyle = PAL.gold;
          ctx.fillRect(lx - 3, ly + 2, 7, 5);
          ctx.fillStyle = '#a9781f';
          ctx.fillRect(lx - 2, ly + 3, 5, 3);
          ctx.fillStyle = '#3a2444';
          ctx.fillRect(lx, ly + 4, 1, 2);
        } else {
          ctx.globalAlpha = 0.18 + Math.sin(time * 3) * 0.08;
          ellipse(ctx, lx, ly + 22, 12, 14, '#ffe6a0');
          ctx.globalAlpha = 1;
          const sy = ly - 1 - Math.round((time * 6) % 5);
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(lx, sy, 1, 3);
          ctx.fillRect(lx - 1, sy + 1, 3, 1);
        }
      },
    });
    return drawables;
  }

  doorWorld() {
    return { x: DOOR_TILE.x * TILE + 8, y: DOOR_TILE.y * TILE + 8 };
  }

  signWorld() {
    return { x: SIGN_TILE.x * TILE + 8, y: SIGN_TILE.y * TILE + 8 };
  }

  bunnyWorld() {
    return { x: 14 * TILE + 8, y: 22 * TILE + 8 };
  }
}
