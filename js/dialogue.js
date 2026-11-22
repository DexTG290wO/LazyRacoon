import { panel, label, UI } from './ui.js?v=11';
import { drawText, drawWrapped } from './font.js?v=11';

const CPS = 52; // characters per second

export class Dialogue {
  constructor() {
    this.active = false;
    this.pages = [];
    this.index = 0;
    this.chars = 0;
    this.speaker = '';
    this.onClose = null;
  }

  start(pages, speaker = 'Sign', onClose = null) {
    this.pages = Array.isArray(pages) ? pages : [pages];
    this.index = 0;
    this.chars = 0;
    this.speaker = speaker;
    this.onClose = onClose;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    const full = this.pages[this.index] || '';
    if (this.chars < full.length) {
      this.chars = Math.min(full.length, this.chars + CPS * dt);
    }
  }

  // Returns true if this call closed the dialogue.
  advance() {
    if (!this.active) return false;
    const full = this.pages[this.index] || '';
    if (this.chars < full.length) {
      this.chars = full.length; // reveal the rest instantly
      return false;
    }
    if (this.index < this.pages.length - 1) {
      this.index++;
      this.chars = 0;
      return false;
    }
    this.active = false;
    if (this.onClose) this.onClose();
    return true;
  }

  close() {
    this.active = false;
    if (this.onClose) this.onClose();
  }

  render(ctx, time) {
    if (!this.active) return;
    const x = 12, y = 132, w = 360, h = 72;
    panel(ctx, x, y, w, h, { fill: '#34214f' });

    // Speaker name tag.
    ctx.fillStyle = UI.ink;
    ctx.fillRect(x + 8, y - 8, Math.max(58, this.speaker.length * 7.2 + 14), 16);
    ctx.fillStyle = UI.panelLight;
    ctx.fillRect(x + 9, y - 7, Math.max(56, this.speaker.length * 7.2 + 12), 14);
    label(ctx, this.speaker, x + 15, y - 4, { scale: 1, color: UI.gold });

    const full = this.pages[this.index] || '';
    const shown = full.slice(0, Math.floor(this.chars));
    drawWrapped(ctx, shown, x + 14, y + 12, w - 30, {
      scale: 1.1, color: UI.cream, shadow: UI.ink, lineHeight: 14,
    });

    // Blinking continue arrow.
    if (Math.floor(time * 2.5) % 2 === 0) {
      const ax = x + w - 18;
      const ay = y + h - 14;
      drawText(ctx, 'v', ax, ay, { scale: 1, color: UI.gold });
    }
  }
}
