// Procedural pixel art. Everything is drawn at 1:1 pixel scale onto small
// offscreen canvases, then blitted with imageSmoothingEnabled = false.

export const PAL = {
  outline: '#241a33',
  fur: '#98a1b8',
  furLight: '#cfd5e2',
  furDark: '#666e88',
  mask: '#2f2a40',
  white: '#f8f1e7',
  pink: '#ef96b2',
  pinkDeep: '#d96a94',
  nose: '#3a2d3d',
  eye: '#fffdf7',
  tailDark: '#4c516a',
  wood: '#a9744a',
  woodDark: '#6d4530',
  woodLight: '#c79467',
  leaf: '#4f9b64',
  leafLight: '#7fc57f',
  leafDark: '#2f704b',
  leaf2: '#5aa777',
  grass: '#79ad6f',
  grassAlt: '#6da064',
  grassDark: '#568a5b',
  dirt: '#c9a87e',
  dirtDark: '#ad8b64',
  water: '#5f96c7',
  waterLight: '#8dc3e0',
  waterDark: '#4075ac',
  cream: '#f6e7c9',
  roof: '#b58ad6',
  roofDark: '#7c559f',
  gold: '#f5c95b',
  crystal: '#7fd4f2',
  purple: '#b48ae2',
  lanternRed: '#e8606a',
  lanternGlow: '#ffb074',
};

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx };
}

export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Pixel-perfect filled ellipse (no anti-aliasing).
export function ellipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  const yStart = Math.floor(cy - ry);
  const yEnd = Math.ceil(cy + ry);
  for (let y = yStart; y <= yEnd; y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const half = rx * Math.sqrt(1 - dy * dy);
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half - 0.0001);
    ctx.fillRect(x0, y, Math.max(1, x1 - x0 + 1), 1);
  }
}

export function ring(ctx, cx, cy, rx, ry, outlineColor, fillColor) {
  ellipse(ctx, cx, cy, rx, ry, outlineColor);
  ellipse(ctx, cx, cy, rx - 1, ry - 1, fillColor);
}

export function hash2(x, y) {
  // 32-bit integer hash (Math.imul avoids floating point precision loss).
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

/* ------------------------------------------------------------------ */
/*  RACCOON                                                             */
/* ------------------------------------------------------------------ */

function drawTail(ctx, dir, step) {
  const sway = step === 1 || step === 3 ? 1 : 0;
  let segs;
  if (dir === 'side') {
    segs = [
      { x: 6, y: 15 + sway, r: 3.2, c: PAL.furDark },
      { x: 4, y: 15 - sway, r: 2.7, c: PAL.tailDark },
      { x: 2, y: 14 - sway, r: 2.1, c: PAL.furDark },
      { x: 1, y: 13 - sway, r: 1.6, c: PAL.tailDark },
    ];
  } else if (dir === 'up') {
    segs = [
      { x: 10, y: 16 + sway, r: 3.4, c: PAL.furDark },
      { x: 10, y: 19 - sway, r: 2.8, c: PAL.tailDark },
      { x: 10, y: 21 - sway, r: 2.1, c: PAL.furDark },
    ];
  } else {
    segs = [
      { x: 13, y: 15 + sway, r: 3.4, c: PAL.furDark },
      { x: 16, y: 16 - sway, r: 2.9, c: PAL.tailDark },
      { x: 18, y: 17 - sway, r: 2.2, c: PAL.furDark },
      { x: 19, y: 18 - sway, r: 1.5, c: PAL.tailDark },
    ];
  }
  for (const s of segs) {
    ellipse(ctx, s.x, s.y, s.r + 0.7, s.r + 0.5, PAL.outline);
    ellipse(ctx, s.x, s.y, s.r, s.r - 0.3, s.c);
  }
}

function drawHead(ctx, dir, headY) {
  // Ears
  for (const ex of [6.5, 13.5]) {
    ellipse(ctx, ex, headY - 4.4, 2.5, 3.0, PAL.outline);
    ellipse(ctx, ex, headY - 4.4, 1.8, 2.3, PAL.furDark);
    ellipse(ctx, ex, headY - 4.2, 1.0, 1.4, PAL.pink);
  }
  // Head
  ring(ctx, 10, headY, 6.2, 5.3, PAL.outline, PAL.fur);
  ellipse(ctx, 10, headY - 2.2, 4.2, 2.1, PAL.furLight);
  // White eyebrow patches frame the dark mask.
  ellipse(ctx, 6.6, headY - 1.6, 2.3, 1.5, PAL.white);
  ellipse(ctx, 13.4, headY - 1.6, 2.3, 1.5, PAL.white);

  if (dir === 'up') {
    // Back of head: a darker cap and two little fur tufts.
    ellipse(ctx, 10, headY - 0.6, 4.6, 3.4, PAL.furDark);
    ellipse(ctx, 8, headY - 3, 1.4, 0.9, PAL.furLight);
    ellipse(ctx, 12, headY - 3.2, 1.2, 0.8, PAL.furLight);
    return;
  }

  if (dir === 'side') {
    // Mask sweeps back from the eye, white muzzle points forward (right).
    ellipse(ctx, 9.5, headY + 0.3, 5.1, 2.8, PAL.mask);
    ellipse(ctx, 14, headY + 1.8, 2.7, 1.7, PAL.white);
    ellipse(ctx, 12, headY - 0.4, 1.9, 1.8, PAL.eye);
    ellipse(ctx, 12.4, headY - 0.4, 0.9, 1.0, PAL.nose);
    ellipse(ctx, 16.2, headY + 1.4, 1.1, 0.9, PAL.nose);
    // cheek fluff
    ellipse(ctx, 7, headY + 2.4, 2.0, 1.2, PAL.furLight);
    return;
  }

  // Down / front facing: broad bandit mask with bright eyes inside it.
  ellipse(ctx, 10, headY + 0.3, 5.5, 2.9, PAL.mask);
  ellipse(ctx, 10, headY + 1.5, 4.3, 1.7, PAL.mask);
  ellipse(ctx, 10, headY + 2.9, 2.7, 1.4, PAL.white);
  for (const ex of [7.4, 12.6]) {
    ellipse(ctx, ex, headY - 0.2, 1.8, 1.7, PAL.eye);
    ellipse(ctx, ex + 0.2, headY - 0.2, 0.95, 1.05, PAL.nose);
    px(ctx, Math.round(ex - 0.4), Math.round(headY - 1.3), 1, 1, '#ffffff');
  }
  // Nose + tiny mouth.
  ellipse(ctx, 10, headY + 2.3, 1.3, 0.95, PAL.nose);
  px(ctx, 10, headY + 3.3, 1, 1, PAL.nose);
  px(ctx, 9, headY + 3.7, 1, 1, PAL.nose);
  px(ctx, 11, headY + 3.7, 1, 1, PAL.nose);
  // cheek fluff
  ellipse(ctx, 5.4, headY + 2.6, 1.6, 1.2, PAL.furLight);
  ellipse(ctx, 14.6, headY + 2.6, 1.6, 1.2, PAL.furLight);
}

function raccoonFrame(dir, mode, step) {
  const { canvas, ctx } = makeCanvas(22, 24);
  const bob = mode === 'walk' ? (step % 2 === 0 ? 0 : 1) : (step === 1 ? 1 : 0);
  const bodyY = 15 - bob;
  const headY = 7 - bob;

  // Soft ground shadow.
  ellipse(ctx, 11, 21, 7, 2, 'rgba(20,10,32,0.28)');

  drawTail(ctx, dir, step);

  // Body.
  ring(ctx, 10, bodyY, 5.2, 5.0, PAL.outline, PAL.fur);
  ellipse(ctx, 10, bodyY + 0.8, 3.2, 3.4, PAL.furLight);
  ellipse(ctx, 10, bodyY - 2.6, 3.6, 1.6, PAL.furDark);

  drawHead(ctx, dir, headY);

  // Paws / arms.
  const lift = mode === 'interact' ? -4 : 0;
  let leftY = bodyY + 4;
  let rightY = bodyY + 4;
  if (mode === 'walk') {
    leftY += step % 2 === 0 ? -1 : 1;
    rightY += step % 2 === 0 ? 1 : -1;
  }
  for (const [px_, py_, c] of [[6.5, leftY + lift, PAL.furDark], [13.5, rightY + lift, PAL.furDark]]) {
    ellipse(ctx, px_, py_ + 0.7, 2.0, 1.9, PAL.outline);
    ellipse(ctx, px_, py_ + 0.2, 1.6, 1.5, c);
  }

  if (mode === 'interact') {
    // Tiny sparkle above the raised paws.
    const sx = 10, sy = 1;
    px(ctx, sx, sy - 1, 1, 3, PAL.white);
    px(ctx, sx - 1, sy, 3, 1, PAL.white);
    px(ctx, sx, sy, 1, 1, PAL.gold);
  }

  return canvas;
}

export function buildRaccoon() {
  const out = {};
  for (const dir of ['down', 'up', 'side']) {
    out[dir] = {
      idle: [raccoonFrame(dir, 'idle', 0), raccoonFrame(dir, 'idle', 1)],
      walk: [
        raccoonFrame(dir, 'walk', 0),
        raccoonFrame(dir, 'walk', 1),
        raccoonFrame(dir, 'walk', 2),
        raccoonFrame(dir, 'walk', 3),
      ],
      interact: raccoonFrame(dir, 'interact', 0),
    };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  WORLD OBJECTS                                                       */
/* ------------------------------------------------------------------ */

function treeCanvas(variant) {
  const { canvas, ctx } = makeCanvas(40, 48);
  const schemes = [
    { dark: '#2c6b47', mid: '#4f9b64', light: '#86c98a', fruit: PAL.gold },
    { dark: '#2f7357', mid: '#5aa777', light: '#9ad9a8', fruit: PAL.pink },
    { dark: '#245a49', mid: '#3f8f67', light: '#71bd88', fruit: '#c8e6a0' },
  ];
  const s = schemes[variant % schemes.length];
  const cx = 20;

  // Trunk with roots, bark shading and a knot.
  px(ctx, 17, 33, 6, 13, PAL.outline);
  px(ctx, 18, 33, 4, 13, PAL.woodDark);
  px(ctx, 19, 34, 2, 12, PAL.wood);
  px(ctx, 19, 38, 1, 5, '#d6a875');
  px(ctx, 16, 44, 5, 2, PAL.outline);
  px(ctx, 20, 44, 5, 2, PAL.outline);
  px(ctx, 17, 44, 3, 1, PAL.woodDark);
  px(ctx, 21, 44, 3, 1, PAL.woodDark);
  px(ctx, 18, 36, 1, 2, '#5a3a28');

  if (variant === 2) {
    // Pine: stacked, stepped boughs.
    for (let i = 0; i < 5; i++) {
      const w = 8 + i * 6;
      const yy = 6 + i * 6;
      px(ctx, cx - w / 2, yy, w, 6, PAL.outline);
      px(ctx, cx - w / 2 + 1, yy + 1, w - 2, 4, s.dark);
      px(ctx, cx - w / 2 + 2, yy + 1, w - 4, 2, s.mid);
      px(ctx, cx - 4 + (i % 2), yy + 2, 4, 1, s.light);
      px(ctx, cx - w / 2 + 1, yy + 5, w - 2, 1, 'rgba(10,40,25,0.4)');
    }
    px(ctx, cx, 2, 2, 4, s.light);
    return canvas;
  }

  // Rounded canopy: outline, shadow body, mid tone, sunlit crown.
  ellipse(ctx, cx, 21, 18, 13, PAL.outline);
  ellipse(ctx, cx, 21, 17, 12, s.dark);
  ellipse(ctx, cx, 20, 15, 10.5, s.mid);
  ellipse(ctx, cx - 4, 15, 8, 5.5, s.light);
  ellipse(ctx, cx + 7, 18, 6, 4.5, s.light);
  ellipse(ctx, cx, 27, 10, 3.5, s.dark);
  // Leaf clusters for texture.
  for (let i = 0; i < 16; i++) {
    const a = i * 2.399;
    const rr = 5 + (i % 4) * 2.6;
    const lx = Math.round(cx + Math.cos(a) * rr * 1.25);
    const ly = Math.round(20 + Math.sin(a) * rr * 0.75);
    px(ctx, lx, ly, 2, 1, i % 3 === 0 ? s.light : s.dark);
    if (i % 4 === 0) px(ctx, lx, ly - 1, 1, 1, s.light);
  }
  // Blossoms or fruit.
  for (const [bx, by] of [[10, 18], [27, 14], [31, 24], [15, 27], [23, 29]]) {
    px(ctx, bx, by, 2, 2, s.fruit);
    px(ctx, bx, by, 1, 1, PAL.white);
  }
  // Sunlit rim on top-left.
  px(ctx, 10, 13, 6, 1, s.light);
  px(ctx, 8, 15, 3, 1, s.light);
  return canvas;
}

function rockCanvas() {
  const { canvas, ctx } = makeCanvas(22, 15);
  ellipse(ctx, 11, 9, 10, 5.5, PAL.outline);
  ellipse(ctx, 11, 8.3, 9, 4.7, '#8790a5');
  ellipse(ctx, 9, 6.7, 6, 2.8, '#abb3c5');
  px(ctx, 6, 5, 4, 1, '#d5dce8');
  px(ctx, 5, 6, 2, 1, '#c2cad9');
  // Cracks and moss.
  px(ctx, 13, 7, 1, 3, '#676f85');
  px(ctx, 14, 9, 2, 1, '#676f85');
  px(ctx, 16, 6, 3, 1, '#5c9a63');
  px(ctx, 17, 7, 2, 1, '#76b878');
  px(ctx, 8, 10, 3, 1, '#6d758b');
  return canvas;
}

function bushCanvas(variant) {
  const { canvas, ctx } = makeCanvas(24, 15);
  const mid = variant ? '#5aa777' : '#4f9b64';
  const light = variant ? '#9ad9a8' : '#86c98a';
  ellipse(ctx, 12, 9, 11, 5.8, PAL.outline);
  ellipse(ctx, 12, 8.5, 10, 5, '#2f6b48');
  ellipse(ctx, 12, 8, 9, 4.3, mid);
  ellipse(ctx, 9, 6.5, 5, 3, light);
  ellipse(ctx, 16, 7, 4.5, 2.6, light);
  for (let i = 0; i < 8; i++) {
    const bx = 4 + i * 2.2;
    px(ctx, bx, 6 + (i % 3), 1, 1, i % 2 ? '#2f6b48' : light);
  }
  for (const [bx, by] of [[7, 9], [13, 6], [18, 10]]) {
    px(ctx, bx, by, 2, 2, variant ? PAL.pink : '#f0d06b');
    px(ctx, bx, by, 1, 1, PAL.white);
  }
  return canvas;
}

function flowerCanvas(color, center) {
  const { canvas, ctx } = makeCanvas(12, 14);
  // Stem, leaves and petals with a darker underside.
  px(ctx, 5, 7, 1, 6, '#3d7a4c');
  px(ctx, 3, 9, 2, 1, PAL.leaf);
  px(ctx, 4, 10, 1, 1, PAL.leafLight);
  px(ctx, 6, 11, 2, 1, PAL.leafDark);
  px(ctx, 4, 1, 3, 4, color);
  px(ctx, 3, 2, 5, 2, color);
  px(ctx, 4, 5, 3, 1, color);
  px(ctx, 2, 3, 1, 1, color);
  px(ctx, 8, 3, 1, 1, color);
  px(ctx, 4, 2, 1, 1, '#ffffff');
  px(ctx, 5, 3, 1, 1, center);
  px(ctx, 6, 2, 1, 1, center);
  return canvas;
}

function stumpCanvas() {
  const { canvas, ctx } = makeCanvas(16, 12);
  px(ctx, 3, 6, 10, 5, PAL.outline);
  px(ctx, 4, 7, 8, 4, PAL.woodDark);
  px(ctx, 4, 7, 8, 2, PAL.wood);
  ellipse(ctx, 8, 5, 5, 2.5, PAL.outline);
  ellipse(ctx, 8, 4.6, 4, 1.8, '#d2a472');
  ellipse(ctx, 8, 4.6, 2, 0.9, '#a87a4e');
  px(ctx, 12, 9, 2, 1, '#6fa06b');
  return canvas;
}

function mushroomCanvas() {
  const { canvas, ctx } = makeCanvas(12, 10);
  px(ctx, 5, 6, 2, 3, '#f0e2cd');
  px(ctx, 4, 8, 4, 1, '#cdbbab');
  ellipse(ctx, 6, 5, 5, 3.5, PAL.outline);
  ellipse(ctx, 6, 4.6, 4.2, 2.8, '#e4647f');
  px(ctx, 4, 3, 1, 1, '#ffe9f0');
  px(ctx, 7, 4, 1, 1, '#ffe9f0');
  px(ctx, 8, 5, 1, 1, '#ffe9f0');
  return canvas;
}

function logCanvas() {
  const { canvas, ctx } = makeCanvas(24, 12);
  px(ctx, 1, 4, 22, 7, PAL.outline);
  px(ctx, 2, 5, 20, 5, PAL.woodDark);
  px(ctx, 2, 5, 20, 2, PAL.wood);
  px(ctx, 5, 6, 6, 1, '#7b5036');
  px(ctx, 13, 8, 5, 1, '#7b5036');
  ellipse(ctx, 21, 7, 4, 4, PAL.outline);
  ellipse(ctx, 21, 7, 3, 3, '#c79a68');
  ellipse(ctx, 21, 7, 1.5, 1.5, '#9c7048');
  px(ctx, 6, 3, 3, 2, '#5c9a63');
  px(ctx, 7, 2, 2, 1, '#7fbe7c');
  return canvas;
}

function lanternCanvas() {
  const { canvas, ctx } = makeCanvas(12, 22);
  px(ctx, 5, 0, 2, 14, PAL.outline);
  px(ctx, 6, 1, 1, 13, '#7a6a5a');
  px(ctx, 3, 0, 6, 2, PAL.outline);
  px(ctx, 2, 12, 8, 7, PAL.outline);
  px(ctx, 3, 13, 6, 5, '#ffe6a0');
  px(ctx, 4, 14, 4, 3, '#fff6d2');
  px(ctx, 2, 18, 8, 2, PAL.outline);
  px(ctx, 3, 18, 6, 1, '#9c7a52');
  return canvas;
}

function marketStallCanvas() {
  const { canvas, ctx } = makeCanvas(32, 28);
  ellipse(ctx, 16, 26, 14, 2, 'rgba(20,10,30,0.28)');
  px(ctx, 2, 8, 28, 3, PAL.outline);
  px(ctx, 3, 9, 26, 2, '#f3c36c');
  px(ctx, 4, 3, 24, 6, PAL.outline);
  px(ctx, 5, 4, 22, 4, '#c95056');
  for (let x = 6; x < 27; x += 6) px(ctx, x, 4, 3, 4, '#f3bd6d');
  px(ctx, 5, 11, 3, 14, PAL.woodDark);
  px(ctx, 24, 11, 3, 14, PAL.woodDark);
  px(ctx, 4, 20, 24, 6, PAL.outline);
  px(ctx, 5, 21, 22, 4, PAL.wood);
  px(ctx, 8, 22, 4, 1, PAL.woodLight);
  px(ctx, 20, 23, 4, 1, PAL.woodLight);
  return canvas;
}

function foxVendorCanvas() {
  const { canvas, ctx } = makeCanvas(20, 25);
  ellipse(ctx, 10, 22, 7, 2, 'rgba(20,10,30,0.25)');
  ellipse(ctx, 10, 17, 6, 6, PAL.outline);
  ellipse(ctx, 10, 17, 5, 5, '#d87945');
  // big pointy ears
  for (const ex of [5, 15]) {
    px(ctx, ex - 2, 3, 4, 7, PAL.outline);
    px(ctx, ex - 1, 4, 2, 5, '#d87945');
    px(ctx, ex - 1, 5, 1, 2, '#ffd2ba');
  }
  ellipse(ctx, 10, 10, 6.5, 5.5, PAL.outline);
  ellipse(ctx, 10, 10, 5.5, 4.5, '#e9874e');
  ellipse(ctx, 10, 12, 3.4, 2.1, '#fff0d9');
  px(ctx, 7, 9, 1, 2, PAL.nose); px(ctx, 12, 9, 1, 2, PAL.nose);
  px(ctx, 9, 12, 2, 1, PAL.nose);
  px(ctx, 5, 17, 10, 2, '#b64b56');
  px(ctx, 8, 19, 4, 4, '#d86162');
  return canvas;
}

function owlMusicianCanvas() {
  const { canvas, ctx } = makeCanvas(20, 25);
  ellipse(ctx, 10, 22, 7, 2, 'rgba(20,10,30,0.25)');
  ellipse(ctx, 10, 16, 7, 7, PAL.outline);
  ellipse(ctx, 10, 16, 6, 6, '#8d779a');
  px(ctx, 3, 7, 3, 4, PAL.outline); px(ctx, 14, 7, 3, 4, PAL.outline);
  px(ctx, 4, 7, 2, 3, '#b69ac4'); px(ctx, 14, 7, 2, 3, '#b69ac4');
  for (const ex of [6.5, 13.5]) {
    ellipse(ctx, ex, 11, 3.4, 3.4, PAL.outline);
    ellipse(ctx, ex, 11, 2.5, 2.5, '#f6e7c9');
    px(ctx, ex - 0.5, 10, 1, 2, PAL.nose);
  }
  px(ctx, 9, 14, 2, 2, '#f5c95b');
  // tiny lute
  ellipse(ctx, 16, 19, 3, 4, PAL.outline);
  ellipse(ctx, 16, 19, 2, 3, '#c58a52');
  px(ctx, 11, 15, 1, 7, '#e5c080');
  return canvas;
}

function cookieRaccoonCanvas() {
  const { canvas, ctx } = makeCanvas(20, 25);
  ellipse(ctx, 10, 22, 7, 2, 'rgba(20,10,30,0.25)');
  ellipse(ctx, 10, 17, 6, 6, PAL.outline);
  ellipse(ctx, 10, 17, 5, 5, PAL.furDark);
  ellipse(ctx, 10, 10, 6.5, 5.5, PAL.outline);
  ellipse(ctx, 10, 10, 5.5, 4.5, PAL.fur);
  for (const ex of [6, 14]) {
    ellipse(ctx, ex, 5, 2.5, 3, PAL.outline);
    ellipse(ctx, ex, 5, 1.6, 2.2, PAL.furDark);
  }
  ellipse(ctx, 10, 11, 5.2, 2.7, PAL.mask);
  px(ctx, 7, 10, 1, 1, PAL.eye); px(ctx, 12, 10, 1, 1, PAL.eye);
  ellipse(ctx, 10, 13, 2.5, 1.5, PAL.white);
  px(ctx, 9, 12, 2, 1, PAL.nose);
  // cookie held at the counter
  ellipse(ctx, 16, 18, 3, 3, PAL.outline);
  ellipse(ctx, 16, 18, 2, 2, '#e6b66d');
  px(ctx, 15, 17, 1, 1, '#7d543a'); px(ctx, 17, 19, 1, 1, '#7d543a');
  return canvas;
}

function tallGrassCanvas() {
  const { canvas, ctx } = makeCanvas(14, 12);
  for (let i = 0; i < 6; i++) {
    const gx = 2 + i * 2;
    const gh = 5 + (i % 3) * 3;
    px(ctx, gx, 12 - gh, 1, gh, i % 2 ? '#4d8e58' : '#6fac6d');
    px(ctx, gx + 1, 12 - gh + 1, 1, 1, '#93c98c');
  }
  return canvas;
}

function bunnyCanvas() {
  const { canvas, ctx } = makeCanvas(20, 24);
  // Shadow and tail.
  ellipse(ctx, 10, 21, 7, 2, 'rgba(20,10,30,0.25)');
  ellipse(ctx, 16, 17, 3, 3, PAL.outline);
  ellipse(ctx, 16, 17, 2, 2, PAL.white);
  // Ears.
  for (const [ex, tilt] of [[6, -1], [13, 1]]) {
    ellipse(ctx, ex + tilt, 5, 2.3, 5.5, PAL.outline);
    ellipse(ctx, ex + tilt, 5, 1.5, 4.6, '#f6ecdd');
    ellipse(ctx, ex + tilt, 5, 0.8, 3.4, PAL.pink);
  }
  // Body and head.
  ring(ctx, 10, 16, 6, 5, PAL.outline, '#f3e8d8');
  ellipse(ctx, 10, 17, 3.4, 3, PAL.white);
  ring(ctx, 10, 10, 5.5, 4.6, PAL.outline, '#f6ecdd');
  ellipse(ctx, 8, 8, 2, 1.4, 'rgba(255,255,255,0.6)');
  // Eyes, nose and blush.
  ellipse(ctx, 8, 10, 1.2, 1.3, PAL.nose);
  ellipse(ctx, 12, 10, 1.2, 1.3, PAL.nose);
  px(ctx, 8, 9, 1, 1, PAL.white);
  px(ctx, 12, 9, 1, 1, PAL.white);
  ellipse(ctx, 10, 12, 1, 0.8, PAL.pink);
  px(ctx, 6, 12, 2, 1, 'rgba(239,150,178,0.5)');
  px(ctx, 13, 12, 2, 1, 'rgba(239,150,178,0.5)');
  // Little paws.
  ellipse(ctx, 7, 20, 2, 1.5, PAL.outline);
  ellipse(ctx, 7, 19.6, 1.5, 1, PAL.white);
  ellipse(ctx, 13, 20, 2, 1.5, PAL.outline);
  ellipse(ctx, 13, 19.6, 1.5, 1, PAL.white);
  return canvas;
}

function blanketCanvas() {
  const { canvas, ctx } = makeCanvas(28, 18);
  ellipse(ctx, 14, 14, 14, 4, 'rgba(20,10,30,0.2)');
  px(ctx, 1, 5, 26, 11, PAL.outline);
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 6; x++)
      px(ctx, 2 + x * 4, 6 + y * 3, 4, 3, (x + y) % 2 ? '#f6c4d8' : '#fff0e0');
  px(ctx, 7, 8, 4, 3, '#c49af2');
  px(ctx, 17, 11, 4, 3, '#8fd0f0');
  return canvas;
}

function basketCanvas() {
  const { canvas, ctx } = makeCanvas(16, 14);
  ellipse(ctx, 8, 12, 7, 2, 'rgba(20,10,30,0.2)');
  px(ctx, 2, 6, 12, 7, PAL.outline);
  px(ctx, 3, 7, 10, 5, '#c99661');
  for (let x = 4; x < 13; x += 3) px(ctx, x, 7, 1, 5, '#9c6f45');
  px(ctx, 2, 6, 12, 1, '#e0b888');
  // Handle.
  px(ctx, 5, 2, 6, 1, PAL.outline);
  px(ctx, 4, 3, 1, 3, PAL.outline);
  px(ctx, 11, 3, 1, 3, PAL.outline);
  px(ctx, 5, 3, 6, 1, '#9c6f45');
  // A pie peeking out.
  ellipse(ctx, 8, 6, 4, 2, PAL.outline);
  ellipse(ctx, 8, 5.6, 3.2, 1.5, '#e8b877');
  return canvas;
}

function benchCanvas() {
  const { canvas, ctx } = makeCanvas(26, 16);
  ellipse(ctx, 13, 14, 12, 2, 'rgba(20,10,30,0.2)');
  px(ctx, 2, 6, 22, 4, PAL.outline);
  px(ctx, 3, 7, 20, 2, PAL.woodLight);
  px(ctx, 2, 10, 22, 3, PAL.outline);
  px(ctx, 3, 10, 20, 2, PAL.wood);
  px(ctx, 4, 13, 3, 3, PAL.woodDark);
  px(ctx, 19, 13, 3, 3, PAL.woodDark);
  px(ctx, 3, 3, 20, 3, PAL.outline);
  px(ctx, 4, 4, 18, 2, PAL.wood);
  return canvas;
}

function glowMushroomCanvas() {
  const { canvas, ctx } = makeCanvas(14, 14);
  px(ctx, 6, 7, 2, 5, '#e6ddf4');
  ellipse(ctx, 7, 6, 6, 4, PAL.outline);
  ellipse(ctx, 7, 5.6, 5, 3.2, '#b48ae2');
  ellipse(ctx, 5, 4, 2, 1.2, '#e8d6ff');
  px(ctx, 9, 5, 1, 1, '#f6ecff');
  px(ctx, 7, 7, 1, 1, '#d9b6f5');
  return canvas;
}

function crystalClusterCanvas() {
  const { canvas, ctx } = makeCanvas(22, 18);
  ellipse(ctx, 11, 16, 10, 2, 'rgba(20,10,30,0.25)');
  const shards = [
    [5, 12, 4, 8, '#7fd4f2'], [11, 10, 5, 11, '#a3e4f7'],
    [17, 13, 4, 7, '#6fc3e8'],
  ];
  for (const [x, y, w, hgt, c] of shards) {
    ctx.fillStyle = PAL.outline;
    ctx.beginPath(); ctx.moveTo(x, y - hgt); ctx.lineTo(x + w, y); ctx.lineTo(x - 1, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x + 1, y - hgt + 2); ctx.lineTo(x + w - 1, y - 1); ctx.lineTo(x, y - 1); ctx.closePath(); ctx.fill();
    px(ctx, x + 1, y - hgt + 3, 1, 3, '#eafaff');
  }
  return canvas;
}

function fenceCanvas() {
  const { canvas, ctx } = makeCanvas(18, 18);
  // Two rails.
  px(ctx, 0, 6, 18, 3, PAL.outline);
  px(ctx, 0, 7, 18, 1, PAL.woodLight);
  px(ctx, 0, 12, 18, 3, PAL.outline);
  px(ctx, 0, 13, 18, 1, PAL.wood);
  // Post.
  px(ctx, 6, 2, 6, 15, PAL.outline);
  px(ctx, 7, 3, 4, 13, PAL.woodDark);
  px(ctx, 8, 3, 1, 12, PAL.woodLight);
  px(ctx, 7, 1, 4, 2, PAL.outline);
  px(ctx, 8, 1, 2, 1, PAL.woodLight);
  return canvas;
}

function signCanvas() {
  const { canvas, ctx } = makeCanvas(18, 24);
  px(ctx, 8, 12, 3, 11, PAL.outline);
  px(ctx, 9, 12, 1, 11, PAL.woodDark);
  px(ctx, 2, 2, 14, 11, PAL.outline);
  px(ctx, 3, 3, 12, 9, PAL.woodLight);
  px(ctx, 3, 3, 12, 1, '#e0b888');
  px(ctx, 5, 5, 8, 1, PAL.woodDark);
  px(ctx, 5, 7, 6, 1, PAL.woodDark);
  px(ctx, 5, 9, 7, 1, PAL.woodDark);
  return canvas;
}

function houseCanvas() {
  const { canvas, ctx } = makeCanvas(80, 72);
  const ox = 6, oy = 10;
  // Walls.
  px(ctx, ox + 6, oy + 24, 62, 38, PAL.outline);
  px(ctx, ox + 7, oy + 25, 60, 36, PAL.cream);
  px(ctx, ox + 7, oy + 25, 60, 3, '#fff6e2');
  // Wooden beams.
  for (const bx of [ox + 9, ox + 27, ox + 45, ox + 63]) px(ctx, bx, oy + 25, 2, 36, '#d8b98d');
  px(ctx, ox + 7, oy + 48, 60, 2, '#d8b98d');
  // Roof: overlapping shingle rows form a solid stepped triangle.
  for (let i = 0; i < 11; i++) {
    // i = 0 is the wide eave at the bottom; the rows narrow toward the ridge.
    const w = 74 - i * 6;
    const ry = oy + 25 - i * 2;
    px(ctx, 40 - w / 2, ry, w, 4, PAL.outline);
    px(ctx, 40 - w / 2 + 1, ry + 1, w - 2, 3, i % 2 ? PAL.roof : PAL.roofDark);
    px(ctx, 40 - w / 2 + 2, ry + 1, w - 4, 1, 'rgba(255,255,255,0.18)');
    // Individual shingle splits.
    for (let sx = 40 - w / 2 + 4; sx < 40 + w / 2 - 3; sx += 7) px(ctx, sx, ry + 2, 1, 2, PAL.roofDark);
  }
  // Ridge cap.
  px(ctx, 37, oy - 1, 6, 3, PAL.outline);
  px(ctx, 38, oy, 4, 2, PAL.roof);
  // Chimney.
  px(ctx, ox + 50, oy - 1, 9, 16, PAL.outline);
  px(ctx, ox + 51, oy, 7, 15, '#a06f8d');
  px(ctx, ox + 51, oy, 7, 3, '#c68cae');
  // Windows with warm glow.
  for (const wx of [ox + 13, ox + 53]) {
    px(ctx, wx, oy + 33, 13, 13, PAL.outline);
    px(ctx, wx + 1, oy + 34, 11, 11, '#f9d98a');
    px(ctx, wx + 5, oy + 34, 2, 11, PAL.woodDark);
    px(ctx, wx + 1, oy + 39, 11, 2, PAL.woodDark);
    px(ctx, wx + 1, oy + 34, 11, 2, 'rgba(255,255,255,0.45)');
  }
  // Window flower boxes and little curtains.
  for (const wx of [ox + 13, ox + 53]) {
    px(ctx, wx - 1, oy + 46, 15, 6, PAL.outline);
    px(ctx, wx, oy + 47, 13, 4, PAL.woodDark);
    px(ctx, wx + 1, oy + 47, 11, 1, PAL.woodLight);
    for (let i = 0; i < 4; i++) {
      const fx = wx + 1 + i * 3;
      px(ctx, fx, oy + 46, 1, 2, '#5c9a63');
      px(ctx, fx - 1, oy + 45, 3, 1, i % 2 ? PAL.pink : '#c49af2');
      px(ctx, fx, oy + 45, 1, 1, PAL.gold);
    }
    px(ctx, wx + 1, oy + 35, 2, 8, 'rgba(255,170,205,0.5)');
    px(ctx, wx + 10, oy + 35, 2, 8, 'rgba(255,170,205,0.5)');
  }
  // Striped awning above the door.
  px(ctx, ox + 29, oy + 36, 22, 5, PAL.outline);
  for (let i = 0; i < 5; i++) px(ctx, ox + 30 + i * 4, oy + 37, 4, 3, i % 2 ? '#f79bc0' : PAL.cream);
  px(ctx, ox + 29, oy + 40, 22, 1, PAL.outline);
  // Heart garland under the eaves.
  for (let i = 0; i < 7; i++) {
    const hx = ox + 10 + i * 9;
    const hy = oy + 21 + (i % 3 === 1 ? 2 : 0);
    px(ctx, hx, hy, 1, 1, PAL.pink);
    px(ctx, hx + 2, hy, 1, 1, PAL.pink);
    px(ctx, hx, hy + 1, 3, 1, PAL.pink);
    px(ctx, hx + 1, hy + 2, 1, 1, PAL.pinkDeep);
  }
  // Door frame (door drawn separately so it can open).
  px(ctx, ox + 32, oy + 39, 16, 23, PAL.outline);
  px(ctx, ox + 33, oy + 40, 14, 22, '#6d4a7a');
  // Doormat and porch steps.
  px(ctx, ox + 31, oy + 61, 18, 3, PAL.woodDark);
  px(ctx, ox + 33, oy + 61, 14, 2, PAL.woodLight);
  px(ctx, ox + 29, oy + 64, 22, 3, PAL.outline);
  px(ctx, ox + 30, oy + 64, 20, 2, '#d2a77d');
  px(ctx, ox + 27, oy + 67, 26, 3, PAL.outline);
  px(ctx, ox + 28, oy + 67, 24, 2, '#c19a70');
  // A tiny nameplate beside the door.
  px(ctx, ox + 49, oy + 50, 11, 7, PAL.outline);
  px(ctx, ox + 50, oy + 51, 9, 5, '#f3d9a8');
  px(ctx, ox + 52, oy + 52, 5, 1, PAL.woodDark);
  px(ctx, ox + 53, oy + 54, 3, 1, PAL.woodDark);
  return canvas;
}

function doorCanvas(open) {
  const { canvas, ctx } = makeCanvas(14, 22);
  if (!open) {
    px(ctx, 0, 0, 14, 22, PAL.outline);
    px(ctx, 1, 1, 12, 21, PAL.woodDark);
    px(ctx, 2, 2, 10, 19, PAL.wood);
    px(ctx, 3, 3, 8, 17, '#8d5e3d');
    px(ctx, 6, 2, 2, 17, PAL.woodLight);
    px(ctx, 9, 11, 2, 2, PAL.gold);
    px(ctx, 2, 2, 10, 2, 'rgba(255,255,255,0.15)');
  } else {
    px(ctx, 0, 0, 4, 22, PAL.outline);
    px(ctx, 1, 1, 2, 21, '#3a2444');
    ellipse(ctx, 6, 11, 8, 10, 'rgba(255,220,150,0.55)');
  }
  return canvas;
}

function giftCanvas(state) {
  const { canvas, ctx } = makeCanvas(28, 28);
  const shake = state === 'shake' ? 1 : 0;
  const bx = 14 + shake;
  // Box.
  px(ctx, bx - 10, 12, 20, 14, PAL.outline);
  px(ctx, bx - 9, 13, 18, 12, '#e86f9e');
  px(ctx, bx - 9, 13, 18, 3, '#f79bc0');
  px(ctx, bx - 2, 13, 4, 12, PAL.gold);
  px(ctx, bx - 10, 17, 20, 3, PAL.gold);
  if (state === 'open') {
    // Lid tipped up.
    px(ctx, bx - 12, 5, 24, 6, PAL.outline);
    px(ctx, bx - 11, 6, 22, 4, '#f79bc0');
    px(ctx, bx - 2, 4, 4, 8, PAL.gold);
    px(ctx, bx - 5, 9, 10, 2, PAL.gold);
    ellipse(ctx, bx, 13, 9, 3, 'rgba(255,240,190,0.85)');
  } else {
    px(ctx, bx - 12, 9, 24, 6, PAL.outline);
    px(ctx, bx - 11, 10, 22, 4, '#f79bc0');
    px(ctx, bx - 2, 8, 4, 7, PAL.gold);
    // Bow.
    ellipse(ctx, bx - 5, 6, 4, 3, PAL.outline);
    ellipse(ctx, bx + 5, 6, 4, 3, PAL.outline);
    ellipse(ctx, bx - 5, 6, 3, 2, '#ffc0d8');
    ellipse(ctx, bx + 5, 6, 3, 2, '#ffc0d8');
    ellipse(ctx, bx, 6, 2, 2, PAL.gold);
  }
  return canvas;
}

function cakeCanvas() {
  const { canvas, ctx } = makeCanvas(34, 30);
  // Plate.
  ellipse(ctx, 17, 26, 15, 3, PAL.outline);
  ellipse(ctx, 17, 25, 14, 2.5, '#dfe6f2');
  // Layers.
  px(ctx, 4, 13, 26, 12, PAL.outline);
  px(ctx, 5, 14, 24, 10, '#f4d9e8');
  px(ctx, 5, 19, 24, 4, '#e597bd');
  px(ctx, 5, 14, 24, 3, '#fff3e0');
  // Icing drips.
  for (let i = 0; i < 5; i++) {
    const dx = 6 + i * 5;
    px(ctx, dx, 17, 3, 1 + (i % 2), '#fff3e0');
    px(ctx, dx, 17 + (i % 2), 3, 1, '#fff3e0');
  }
  // Candles.
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const cx = 8 + i * 5;
    px(ctx, cx, 6, 2, 7, i % 2 ? '#8fd0f0' : '#f6a8c8');
    px(ctx, cx, 6, 2, 1, '#ffffff');
    flames.push({ x: cx + 1, y: 4 });
  }
  return { canvas: canvas, flames };
}

/* ------------------------------------------------------------------ */
/*  LANTERN STREET                                                      */
/* ------------------------------------------------------------------ */

function redLanternCanvas() {
  const { canvas, ctx } = makeCanvas(14, 22);
  px(ctx, 6, 0, 2, 4, '#4a3340');
  px(ctx, 4, 3, 6, 2, PAL.outline);
  px(ctx, 5, 3, 4, 1, PAL.gold);
  ellipse(ctx, 7, 11, 6, 7, PAL.outline);
  ellipse(ctx, 7, 11, 5, 6, PAL.lanternRed);
  ellipse(ctx, 5, 8, 2, 3, '#ff9a9a');
  px(ctx, 9, 13, 2, 3, '#b83248');
  px(ctx, 3, 11, 8, 1, '#c23e52');
  px(ctx, 4, 17, 6, 2, PAL.outline);
  px(ctx, 5, 17, 4, 1, PAL.gold);
  px(ctx, 6, 19, 2, 3, PAL.gold);
  return canvas;
}

function lostLanternCanvas() {
  const { canvas, ctx } = makeCanvas(12, 12);
  ellipse(ctx, 6, 10, 5, 2, 'rgba(20,10,30,0.3)');
  px(ctx, 4, 1, 4, 1, '#5a3f3f');
  px(ctx, 3, 2, 6, 7, PAL.outline);
  px(ctx, 4, 3, 4, 5, '#c9555f');
  px(ctx, 5, 4, 1, 2, '#ffb0a0');
  px(ctx, 3, 9, 6, 2, PAL.outline);
  px(ctx, 5, 10, 2, 2, '#f5c95b');
  return canvas;
}

function streetSignCanvas() {
  const { canvas, ctx } = makeCanvas(28, 14);
  px(ctx, 13, 0, 2, 4, PAL.outline);
  px(ctx, 2, 4, 24, 9, PAL.outline);
  px(ctx, 3, 5, 22, 7, '#8a5a3c');
  px(ctx, 4, 6, 20, 1, '#c79467');
  px(ctx, 5, 8, 3, 2, PAL.gold);
  px(ctx, 10, 8, 3, 2, PAL.pink);
  px(ctx, 15, 8, 3, 2, '#8fd0f0');
  px(ctx, 20, 8, 3, 2, PAL.gold);
  return canvas;
}

function vendorStallCanvas(kind) {
  const { canvas, ctx } = makeCanvas(34, 30);
  const cfg = kind === 'fox'
    ? { fur: '#e08a4b', dark: '#a85e33', light: '#ffe0bd' }
    : kind === 'owl'
      ? { fur: '#9a86c9', dark: '#6a579b', light: '#e2d5f7' }
      : { fur: '#a87455', dark: '#714a36', light: '#f0cba6' };

  // Wooden frame and striped awning.
  px(ctx, 3, 14, 28, 14, PAL.outline);
  px(ctx, 4, 15, 26, 12, '#7d5338');
  px(ctx, 4, 15, 26, 2, '#b88253');
  for (let i = 0; i < 6; i++) {
    px(ctx, 2 + i * 5, 7, 5, 8, PAL.outline);
    px(ctx, 3 + i * 5, 8, 3, 6, i % 2 ? PAL.lanternRed : '#f6e7c9');
  }
  px(ctx, 2, 14, 30, 2, PAL.outline);

  // Friendly vendor behind the counter.
  ellipse(ctx, 17, 19, 7, 8, PAL.outline);
  ellipse(ctx, 17, 19, 6, 7, cfg.fur);
  if (kind === 'fox') {
    px(ctx, 10, 9, 4, 6, cfg.fur);
    px(ctx, 20, 9, 4, 6, cfg.fur);
    px(ctx, 11, 11, 2, 3, cfg.dark);
    px(ctx, 21, 11, 2, 3, cfg.dark);
    ellipse(ctx, 17, 20, 5, 4, cfg.light);
    ellipse(ctx, 14, 17, 1, 1, PAL.nose);
    ellipse(ctx, 20, 17, 1, 1, PAL.nose);
    px(ctx, 17, 20, 2, 1, PAL.nose);
  } else if (kind === 'owl') {
    ellipse(ctx, 12, 12, 3, 4, cfg.dark);
    ellipse(ctx, 22, 12, 3, 4, cfg.dark);
    ellipse(ctx, 14, 17, 2, 2, PAL.white);
    ellipse(ctx, 20, 17, 2, 2, PAL.white);
    px(ctx, 14, 17, 1, 1, PAL.nose);
    px(ctx, 20, 17, 1, 1, PAL.nose);
    px(ctx, 17, 19, 2, 2, PAL.gold);
  } else {
    ellipse(ctx, 12, 12, 3, 3, cfg.fur);
    ellipse(ctx, 22, 12, 3, 3, cfg.fur);
    ellipse(ctx, 17, 20, 4, 3, cfg.light);
    ellipse(ctx, 14, 17, 1, 1, PAL.nose);
    ellipse(ctx, 20, 17, 1, 1, PAL.nose);
    px(ctx, 17, 20, 2, 1, PAL.nose);
  }
  // What they are selling.
  if (kind === 'fox') { px(ctx, 27, 20, 2, 5, PAL.lanternRed); px(ctx, 26, 22, 4, 2, PAL.gold); }
  else if (kind === 'owl') { px(ctx, 27, 21, 1, 4, PAL.gold); px(ctx, 25, 19, 5, 1, PAL.gold); }
  else { px(ctx, 26, 22, 5, 2, '#f6e7c9'); px(ctx, 27, 21, 3, 1, '#ffffff'); }

  // Counter drawn last so the vendor sits behind it.
  px(ctx, 2, 23, 30, 5, PAL.outline);
  px(ctx, 3, 23, 28, 3, '#b88253');
  px(ctx, 3, 23, 28, 1, '#d6a878');
  return canvas;
}

export function buildObjects() {
  return {
    tree: [treeCanvas(0), treeCanvas(1), treeCanvas(2)],
    rock: rockCanvas(),
    bush: [bushCanvas(0), bushCanvas(1)],
    flowers: [flowerCanvas(PAL.pink, PAL.gold), flowerCanvas(PAL.purple, PAL.gold), flowerCanvas(PAL.white, PAL.gold)],
    fence: fenceCanvas(),
    sign: signCanvas(),
    stump: stumpCanvas(),
    mushroom: mushroomCanvas(),
    log: logCanvas(),
    lantern: lanternCanvas(),
    tallGrass: tallGrassCanvas(),
    bunny: bunnyCanvas(),
    blanket: blanketCanvas(),
    basket: basketCanvas(),
    bench: benchCanvas(),
    glowMushroom: glowMushroomCanvas(),
    crystalCluster: crystalClusterCanvas(),
    redLantern: redLanternCanvas(),
    lostLantern: lostLanternCanvas(),
    streetSign: streetSignCanvas(),
    stallFox: vendorStallCanvas('fox'),
    stallOwl: vendorStallCanvas('owl'),
    stallBear: vendorStallCanvas('bear'),
    house: houseCanvas(),
    doorClosed: doorCanvas(false),
    doorOpen: doorCanvas(true),
    giftClosed: giftCanvas('closed'),
    giftShake: giftCanvas('shake'),
    giftOpen: giftCanvas('open'),
    cake: cakeCanvas(),
  };
}

/* ------------------------------------------------------------------ */
/*  COLLECTIBLES                                                        */
/* ------------------------------------------------------------------ */

function starCanvas() {
  const { canvas, ctx } = makeCanvas(16, 16);
  const pts = [
    [8, 0], [10, 5], [15, 5], [11, 9], [13, 14],
    [8, 11], [3, 14], [5, 9], [1, 5], [6, 5],
  ];
  ctx.fillStyle = PAL.outline;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1] + 1);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAL.gold;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
  px(ctx, 7, 4, 2, 4, '#fff3b0');
  px(ctx, 5, 6, 2, 1, '#fff3b0');
  return canvas;
}

function crystalCanvas() {
  const { canvas, ctx } = makeCanvas(14, 18);
  const poly = [[7, 0], [12, 6], [10, 15], [7, 17], [4, 15], [2, 6]];
  ctx.fillStyle = PAL.outline;
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAL.crystal;
  ctx.beginPath();
  ctx.moveTo(7, 1); ctx.lineTo(11, 6); ctx.lineTo(9, 14); ctx.lineTo(7, 16);
  ctx.lineTo(5, 14); ctx.lineTo(3, 6); ctx.closePath();
  ctx.fill();
  px(ctx, 6, 3, 2, 6, '#d9f6ff');
  px(ctx, 5, 4, 1, 3, '#eefcff');
  px(ctx, 9, 9, 1, 4, '#4fa9d6');
  return canvas;
}

function ribbonCanvas() {
  const { canvas, ctx } = makeCanvas(18, 16);
  // Loops.
  ellipse(ctx, 5, 5, 4.5, 3.6, PAL.outline);
  ellipse(ctx, 13, 5, 4.5, 3.6, PAL.outline);
  ellipse(ctx, 5, 5, 3.5, 2.7, '#ffc2da');
  ellipse(ctx, 13, 5, 3.5, 2.7, '#ffc2da');
  ellipse(ctx, 5, 5, 1.7, 1.3, PAL.pinkDeep);
  ellipse(ctx, 13, 5, 1.7, 1.3, PAL.pinkDeep);
  // Tails.
  ctx.fillStyle = PAL.outline;
  ctx.beginPath();
  ctx.moveTo(7, 8); ctx.lineTo(4, 15); ctx.lineTo(8, 13); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(11, 8); ctx.lineTo(14, 15); ctx.lineTo(10, 13); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffc2da';
  ctx.beginPath();
  ctx.moveTo(7, 8); ctx.lineTo(5, 14); ctx.lineTo(8, 12); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(11, 8); ctx.lineTo(13, 14); ctx.lineTo(10, 12); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill();
  // Knot.
  ellipse(ctx, 9, 7, 2.5, 2.5, PAL.outline);
  ellipse(ctx, 9, 7, 1.8, 1.8, PAL.gold);
  return canvas;
}

export function buildCollectibles() {
  return {
    pinkFlower: flowerCanvas('#ff9dc4', PAL.gold),
    purpleFlower: flowerCanvas('#c49af2', PAL.gold),
    goldenStar: starCanvas(),
    blueCrystal: crystalCanvas(),
    ribbon: ribbonCanvas(),
  };
}

/* ------------------------------------------------------------------ */
/*  GROUND TILES                                                        */
/* ------------------------------------------------------------------ */

export function drawGround(ctx, type, tx, ty, time, cam) {
  const x = Math.round(tx * 16 - cam.x);
  const y = Math.round(ty * 16 - cam.y);
  const h = hash2(tx, ty);
  const h2 = hash2(tx + 31, ty + 17);
  switch (type) {
    case 'water': {
      // Depth gradient (dark at the far edge, lighter in the shallows).
      px(ctx, x, y, 16, 4, '#4a7fb4');
      px(ctx, x, y + 4, 16, 8, PAL.water);
      px(ctx, x, y + 12, 16, 4, '#6ba7cf');
      px(ctx, x, y, 16, 2, PAL.waterDark);
      // Drifting wavelets.
      const flow = time * 7 + h * 20;
      for (let i = 0; i < 3; i++) {
        const wy = y + 3 + i * 5 + ((i + tx) % 2);
        const wx = x + ((Math.floor(flow) + i * 5 + Math.floor(h2 * 9)) % 14);
        px(ctx, wx, wy, 4, 1, PAL.waterLight);
        px(ctx, wx + 4, wy - 1, 2, 1, 'rgba(220,245,255,0.7)');
      }
      // Sun sparkle on the surface.
      if (Math.sin(time * 2 + tx * 0.8 + ty) > 0.7) {
        px(ctx, x + 5 + Math.floor(h * 5), y + 7, 1, 3, '#eafaff');
        px(ctx, x + 4 + Math.floor(h * 5), y + 8, 3, 1, '#eafaff');
      }
      px(ctx, x + 1, y + 14, 3, 1, 'rgba(30,70,110,0.35)');
      break;
    }
    case 'bridge': {
      px(ctx, x, y, 16, 16, '#4b3123');
      // Four wide planks with grain, seams and iron nails.
      for (let i = 0; i < 4; i++) {
        const py2 = y + i * 4;
        px(ctx, x, py2, 16, 3, i % 2 ? '#a67449' : '#b88253');
        px(ctx, x, py2, 16, 1, '#cf9c6c');
        px(ctx, x + 3 + Math.floor(h * 6), py2 + 1, 5, 1, '#8d5f3c');
        px(ctx, x + 2, py2 + 1, 1, 1, '#5e432f');
        px(ctx, x + 13, py2 + 1, 1, 1, '#5e432f');
      }
      // Rope handrails at the top and bottom edges.
      px(ctx, x, y, 16, 1, '#7c5234');
      px(ctx, x, y + 15, 16, 1, '#7c5234');
      if (tx % 2 === 0) {
        px(ctx, x + 1, y + 1, 2, 3, '#6d4530');
        px(ctx, x + 13, y + 12, 2, 3, '#6d4530');
      }
      break;
    }
    case 'lane': {
      // Lantern Street: cool cobblestones under a wash of warm light.
      px(ctx, x, y, 16, 16, '#2c2442');
      for (let r = 0; r < 3; r++) {
        for (let cIdx = 0; cIdx < 3; cIdx++) {
          const ox2 = cIdx * 6 + (r % 2 ? 1 : 0);
          const oy2 = r * 5 + 1;
          ctx.fillStyle = (cIdx + r) % 2 ? '#3d3357' : '#47395f';
          ctx.fillRect(x + ox2, y + oy2, 5, 4);
          px(ctx, x + ox2 + 1, y + oy2, 3, 1, 'rgba(255,220,180,0.14)');
        }
      }
      px(ctx, x, y + 15, 16, 1, '#1d1830');
      if (h > 0.7) {
        ctx.globalAlpha = 0.2 + Math.sin(time * 2 + tx + ty) * 0.08;
        ellipse(ctx, x + 8, y + 9, 7, 6, PAL.lanternGlow);
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'path': {
      px(ctx, x, y, 16, 16, PAL.dirt);
      // Soft edges and a worn centre.
      px(ctx, x, y, 16, 1, '#b89a72');
      px(ctx, x, y + 15, 16, 1, '#b89a72');
      px(ctx, x + 5, y + 2, 6, 12, 'rgba(228,199,157,0.35)');
      // Pebbles and leaf litter.
      for (let i = 0; i < 4; i++) {
        const hx = Math.floor(hash2(tx * 3 + i, ty) * 14);
        const hy = Math.floor(hash2(tx, ty * 3 + i) * 14);
        px(ctx, x + hx, y + hy, 1, 1, i % 2 ? '#9c7d59' : '#e8cdaa');
        if (i === 0) px(ctx, x + hx + 1, y + hy, 1, 1, '#9c7d59');
      }
      if (h > 0.82) {
        px(ctx, x + 10, y + 11, 2, 1, '#c98655');
        px(ctx, x + 11, y + 12, 1, 1, '#a8683f');
      }
      break;
    }
    case 'soil': {
      px(ctx, x, y, 16, 16, '#8b6a52');
      px(ctx, x, y, 16, 1, '#7a5b48');
      // Tilled furrows.
      for (let r = 0; r < 3; r++) {
        const ry = y + 3 + r * 5;
        px(ctx, x + 1, ry, 14, 2, '#9c775c');
        px(ctx, x + 1, ry + 2, 14, 1, '#765742');
      }
      // Seedlings and damp speckles.
      if (h2 > 0.5) {
        const sx = x + 4 + Math.floor(h * 6);
        px(ctx, sx, y + 5, 1, 2, '#79b36c');
        px(ctx, sx - 1, y + 5, 1, 1, '#a4d68b');
        px(ctx, sx + 1, y + 5, 1, 1, '#a4d68b');
      }
      px(ctx, x + 2 + Math.floor(h2 * 10), y + 14, 1, 1, '#6b4d3a');
      break;
    }
    case 'floor': {
      px(ctx, x, y, 16, 16, '#d9bb90');
      px(ctx, x, y + 7, 16, 1, '#c2a276');
      px(ctx, x, y + 15, 16, 1, '#c2a276');
      px(ctx, x + (tx % 2 ? 4 : 11), y, 1, 7, '#c2a276');
      px(ctx, x + (tx % 2 ? 9 : 3), y + 8, 1, 7, '#c2a276');
      px(ctx, x + 2, y + 3, 3, 1, 'rgba(255,246,224,0.5)');
      break;
    }
    default: {
      // Grass: layered patches, tufts, clover, tiny blossoms and fallen leaves.
      const base = h > 0.55 ? PAL.grass : PAL.grassAlt;
      px(ctx, x, y, 16, 16, base);
      px(ctx, x, y, 16, 6, h2 > 0.5 ? 'rgba(150,200,130,0.16)' : 'rgba(40,90,60,0.10)');
      px(ctx, x, y + 10, 16, 6, h > 0.5 ? 'rgba(35,85,55,0.10)' : 'rgba(160,205,135,0.10)');
      const tufts = [
        [2 + Math.floor(h * 4), 3], [8 + Math.floor(h * 5), 6],
        [4 + Math.floor(h * 6), 11], [11, 13 - Math.floor(h * 3)],
        [Math.floor(h2 * 13), 8],
      ];
      for (let i = 0; i < tufts.length; i++) {
        const [gx, gy] = tufts[i];
        px(ctx, x + gx, y + gy, 1, 2, i % 2 ? '#4f8b57' : '#9ccc8e');
        px(ctx, x + gx + 1, y + gy + 1, 1, 1, '#4f8b57');
        if (i % 3 === 0) px(ctx, x + gx - 1, y + gy + 1, 1, 1, '#6fa96b');
      }
      // Clover / tiny wildflowers.
      if (h > 0.88) {
        px(ctx, x + 6, y + 8, 1, 1, '#ffe4ef');
        px(ctx, x + 7, y + 8, 1, 1, PAL.gold);
        px(ctx, x + 7, y + 9, 1, 1, '#ffe4ef');
      } else if (h2 > 0.9) {
        px(ctx, x + 11, y + 4, 1, 1, '#d7bdf2');
        px(ctx, x + 12, y + 5, 1, 1, PAL.gold);
      }
      // Occasional fallen leaf.
      if (h > 0.96) {
        px(ctx, x + 3, y + 13, 2, 1, '#d59a5e');
        px(ctx, x + 4, y + 14, 1, 1, '#a86c40');
      }
      break;
    }
  }
}
