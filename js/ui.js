import { drawText, textWidth } from './font.js?v=11';

export const UI = {
  ink: '#120b20',
  panel: '#241438',
  panelLight: '#392050',
  border: '#a675d8',
  borderLight: '#e0bcff',
  cream: '#fff9ee',
  pink: '#ffacd0',
  gold: '#ffdc72',
  blue: '#a9e4ff',
  green: '#b5f1a7',
};

// Chunky pixel panel with a double border and drop shadow.
export function panel(ctx, x, y, w, h, opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const fill = opts.fill || UI.panel;
  const border = opts.border || UI.border;
  const light = opts.light || UI.borderLight;
  if (opts.shadow !== false) {
    ctx.fillStyle = 'rgba(10,5,20,0.45)';
    ctx.fillRect(x + 3, y + 3, w, h);
  }
  ctx.fillStyle = UI.ink;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = border;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  // Corner highlights.
  ctx.fillStyle = light;
  ctx.fillRect(x + 1, y + 1, 4, 1);
  ctx.fillRect(x + 1, y + 1, 1, 4);
  ctx.fillRect(x + w - 5, y + h - 2, 4, 1);
  ctx.fillRect(x + w - 2, y + h - 5, 1, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 3, y + h - 4, w - 6, 1);
}

export function button(ctx, rect, label, opts = {}) {
  const { x, y, w, h } = rect;
  const hovered = opts.hovered;
  const disabled = opts.disabled;
  const base = disabled ? '#463554' : (hovered ? '#a26ed4' : '#7d4fae');
  ctx.fillStyle = 'rgba(8,4,16,0.5)';
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = UI.ink;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = disabled ? '#5d4a6d' : UI.borderLight;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = base;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = disabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 3, y + 3, w - 6, 2);
  const color = disabled ? '#9a8aa8' : UI.cream;
  drawText(ctx, label, x + w / 2, y + Math.floor((h - 7) / 2) + 1, {
    scale: opts.scale || 1, color, align: 'center', shadow: UI.ink,
  });
}

export function pointIn(rect, mx, my) {
  return mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h;
}

export function label(ctx, text, x, y, opts = {}) {
  drawText(ctx, text, x, y, { scale: 1, color: UI.cream, shadow: UI.ink, ...opts });
}

export function textCenter(ctx, text, cx, y, opts = {}) {
  drawText(ctx, text, cx, y, { scale: 1, align: 'center', color: UI.cream, shadow: UI.ink, ...opts });
}
