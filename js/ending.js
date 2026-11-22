import { drawText, drawWrapped, textWidth } from './font.js?v=14';
import { translate } from './i18n.js?v=14';
import { panel, button, UI } from './ui.js?v=14';
import { px, ellipse, PAL } from './art.js?v=14';

const PHASES = [
  { name: 'fade', dur: 0.9 },
  { name: 'walk', dur: 1.7 },
  { name: 'shake', dur: 0.9 },
  { name: 'open', dur: 0.8 },
  { name: 'party', dur: 3.4 },
  { name: 'message', dur: Infinity },
];

const MESSAGE_A = 'HAPPY BIRTHDAY, LAZY!';
const BIRTHDAY_LETTER = `Dear Lazy,\n\nToday, the main character of this little adventure gets to celebrate another year of life!\n\nI hope this new chapter brings you countless happy moments, wonderful memories, exciting experiences, and people who genuinely care about you.\n\nLife isn't always like a game where every level is easy to complete. Sometimes there are difficult stages, unexpected obstacles, and moments when things don't go as planned.\n\nBut I hope you never forget how valuable you are. Take your time, enjoy the little things, and never feel like you have to rush through life.\n\nMay you always have reasons to smile, games worth playing, dreams worth chasing, and friends who make even ordinary days feel special.\n\nThank you for being the inspiration behind this little world. Every flower, every star, and every tiny adventure was placed here to make you smile.\n\nYou deserve happiness, not just today, but every day.\n\nHappy Birthday, Lazy!\n\nMay your next chapter be your favorite one yet.\n\nWith love,\nYour Little Raccoon.`;

const LETTER = translate(BIRTHDAY_LETTER);

export class Ending {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.replayRect = { x: w / 2 - 52, y: h - 26, w: 104, h: 18 };
    this.reset();
  }

  reset() {
    this.phaseIndex = 0;
    this.t = 0;
    this.fireworkTimer = 0.4;
    this.done = false;
    this.raccoonX = 52;
    this.letterOpen = false;
    this.letterChars = 0;
    this.letterScroll = 0;
    this.letterRect = { x: this.w / 2 - 72, y: this.h - 50, w: 144, h: 18 };
  }

  get phase() { return PHASES[this.phaseIndex].name; }

  begin(audio) {
    this.reset();
    audio.startMusic('forest');
  }

  update(dt, audio, effects) {
    this.t += dt;
    if (this.phase === 'message') this.letterChars = Math.min(LETTER.length, this.letterChars + dt * 58);
    const phase = PHASES[this.phaseIndex];
    if (this.t >= phase.dur && phase.dur !== Infinity) {
      this.phaseIndex++;
      this.t = 0;
      const next = this.phase;
      if (next === 'walk') audio.sfx('ui');
      if (next === 'open') {
        audio.sfx('gift');
        effects.spawnCelebration(this.w, this.h);
      }
      if (next === 'party') {
        audio.sfx('celebrate');
        audio.startMusic('party');
      }
      if (next === 'message') this.done = true;
    }

    // Raccoon walks toward the gift during the walk phase.
    if (this.phase === 'walk') {
      const p = Math.min(1, this.t / PHASES[1].dur);
      const ease = p * p * (3 - 2 * p);
      this.raccoonX = 52 + (148 - 52) * ease;
    } else if (this.phaseIndex > 1) {
      this.raccoonX = 148;
    }

    // Periodic fireworks during the party and message phases.
    if (this.phase === 'party' || this.phase === 'message') {
      this.fireworkTimer -= dt;
      if (this.fireworkTimer <= 0) {
        effects.spawnFirework(60 + Math.random() * (this.w - 120), 30 + Math.random() * 70);
        this.fireworkTimer = this.phase === 'party' ? 0.55 : 1.1;
      }
    }
  }

  draw(ctx, time, sprites, objects, hoverReplay = false) {
    const { w, h } = this;
    // Night-garden backdrop drawn in soft horizontal bands (pixel friendly).
    const bands = [
      [0, 46, '#1a1030'], [46, 44, '#251540'], [90, 40, '#2f1a4c'],
      [130, 35, '#332051'], [165, 51, '#241a3c'],
    ];
    for (const [y, bh, c] of bands) px(ctx, 0, y, w, bh, c);
    // Warm glow behind the gift.
    ctx.globalAlpha = 0.22 + Math.sin(time * 1.6) * 0.04;
    ellipse(ctx, 192, 132, 92, 52, '#b47ad6');
    ctx.globalAlpha = 1;

    // Fireflies / floating stars.
    for (let i = 0; i < 18; i++) {
      const sx = (i * 47 + Math.sin(time * 0.7 + i) * 12 + w) % w;
      const sy = 30 + ((i * 29 - time * 9) % 120 + 120) % 120;
      const tw = Math.sin(time * 3 + i * 1.7) > 0;
      if (tw) {
        px(ctx, sx, sy, 1, 3, '#ffe6a3');
        px(ctx, sx - 1, sy + 1, 3, 1, '#ffe6a3');
      }
    }

    // Ground hill.
    ellipse(ctx, 192, 200, 210, 26, '#1c2c35');
    ellipse(ctx, 192, 194, 200, 22, '#274035');
    for (let i = 0; i < 26; i++) {
      const gx = 10 + ((i * 53) % (w - 20));
      px(ctx, gx, 182 + (i % 3) * 4, 2, 2, '#3c6b4a');
    }

    // Cake with flickering candles.
    if (this.phaseIndex >= 3) {
      const cake = objects.cake.canvas;
      ctx.drawImage(cake, 260, 168 - cake.height);
      for (let i = 0; i < objects.cake.flames.length; i++) {
        const f = objects.cake.flames[i];
        const fy = 168 - cake.height + f.y + (Math.sin(time * 9 + i) > 0 ? 0 : 1);
        px(ctx, 260 + f.x, fy, 1, 2, '#ffdc72');
        px(ctx, 260 + f.x, fy, 1, 1, '#fff6cf');
      }
    }

    // Companion raccoon (mirrored so it faces the gift), gently bobbing.
    const buddyBob = Math.floor(Math.sin(time * 2.2) * 1);
    const buddy = sprites.side.idle[Math.floor(time * 1.6) % 2];
    ctx.save();
    ctx.translate(252 + buddy.width, 168 - buddy.height + buddyBob);
    ctx.scale(-1, 1);
    ctx.drawImage(buddy, 0, 0);
    ctx.restore();

    // Gift box.
    let giftSprite = objects.giftClosed;
    if (this.phase === 'shake') giftSprite = (Math.floor(this.t * 16) % 2) ? objects.giftShake : objects.giftClosed;
    else if (this.phaseIndex >= 3) giftSprite = objects.giftOpen;
    const giftJiggle = this.phase === 'shake' ? Math.round(Math.sin(this.t * Math.PI * 2 * (3 / PHASES[2].dur)) * 2) : 0;
    ctx.drawImage(giftSprite, 178 + giftJiggle, 168 - giftSprite.height);

    // Player raccoon approaching the gift.
    const walking = this.phase === 'walk';
    const frame = walking
      ? sprites.side.walk[Math.floor(time * 9) % 4]
      : (this.phaseIndex >= 4 ? sprites.side.idle[Math.floor(time * 2) % 2] : sprites.side.idle[0]);
    const ry = 168 - frame.height + Math.floor(Math.sin(time * 2) * 1);
    ctx.drawImage(frame, Math.round(this.raccoonX), ry);
    if (this.phaseIndex >= 4) {
      const hx = Math.round(this.raccoonX + frame.width / 2);
      px(ctx, hx - 5, ry - 2, 10, 2, '#f5c95b');
      px(ctx, hx - 3, ry - 7, 6, 5, '#e66d7a');
      px(ctx, hx - 1, ry - 6, 2, 2, '#fff0a8');
    }

    // Soft dim overlay once the cutscene begins.
    if (this.phaseIndex > 0) {
      const a = this.phase === 'fade' ? 0.6 * Math.min(1, this.t / PHASES[0].dur) : 0.16;
      ctx.fillStyle = `rgba(10,6,20,${a})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.phase === 'message') this.drawMessage(ctx, time, hoverReplay);
  }

  drawMessage(ctx, time, hoverReplay) {
    const { w, h } = this;
    ctx.fillStyle = 'rgba(9,5,18,0.58)';
    ctx.fillRect(0, 0, w, h);

    const panelH = 138;
    const panelY = 16;
    panel(ctx, 16, panelY, w - 32, panelH, { fill: '#352049' });

    // Decorative stars in the title row.
    for (const sx of [30, w - 36]) {
      px(ctx, sx, panelY + 12, 1, 7, UI.gold);
      px(ctx, sx - 3, panelY + 15, 7, 1, UI.gold);
    }
    drawText(ctx, MESSAGE_A, w / 2, panelY + 12, {
      scale: 2, align: 'center', color: UI.gold, shadow: '#5b2d1e',
    });

    drawText(ctx, 'THE WHOLE FOREST IS CELEBRATING YOU!', w / 2, panelY + 47, {
      scale: 1.2,
      align: 'center', color: UI.cream, shadow: UI.ink,
    });
    drawText(ctx, 'A birthday letter is waiting inside.', w / 2, panelY + 69, {
      scale: 1.2,
      align: 'center', color: '#d8c2ef', shadow: UI.ink,
    });

    // Animated little hearts under the signature.
    for (let i = 0; i < 5; i++) {
      const hx = w / 2 - 30 + i * 15;
      const hy = panelY + 121 - ((time * 12 + i * 9) % 14);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3 + i);
      px(ctx, hx - 1, hy, 1, 2, UI.pink);
      px(ctx, hx + 1, hy, 1, 2, UI.pink);
      px(ctx, hx - 1, hy + 1, 3, 1, UI.pink);
      ctx.globalAlpha = 1;
    }

    this.letterRect.y = h - 50;
    this.replayRect.y = h - 26;
    button(ctx, this.letterRect, 'READ THE LETTER', { hovered: false });
    button(ctx, this.replayRect, 'PLAY AGAIN', { hovered: hoverReplay });
    if (this.letterOpen) this.drawLetter(ctx);
  }

  drawLetter(ctx) {
    const { w, h } = this;
    ctx.fillStyle = 'rgba(7,4,15,0.84)'; ctx.fillRect(0, 0, w, h);
    panel(ctx, 12, 10, w - 24, h - 20, { fill: '#352049' });
    drawText(ctx, 'HAPPY BIRTHDAY, LAZY!', w / 2, 18, { scale: 1.5, align: 'center', color: UI.gold, shadow: UI.ink });
    const shown = LETTER.slice(0, Math.floor(this.letterChars));
    const words = shown.replace(/\n/g, '  ').split(/\s+/);
    const lines = []; let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, 1.25) > w - 48 && line) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const visible = 10;
    this.letterScroll = Math.min(Math.max(0, lines.length - visible), Math.max(0, this.letterScroll));
    for (let i = this.letterScroll; i < Math.min(lines.length, this.letterScroll + visible); i++) {
      drawText(ctx, lines[i], 24, 34 + (i - this.letterScroll) * 15, { scale: 1.25, color: UI.cream, shadow: UI.ink });
    }
    drawText(ctx, this.letterChars < LETTER.length ? '...READING...' : 'TAP / ESC TO CLOSE', w / 2, h - 22, { align: 'center', color: UI.pink });
  }
}
