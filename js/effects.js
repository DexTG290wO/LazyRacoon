// Screen-space particle effects: sparkles, fireworks, hearts and confetti.

const COLORS = ['#ff9dc4', '#c49af2', '#f5c95b', '#8fd0f0', '#9fd6a0', '#ffffff'];

export class Effects {
  constructor() {
    this.particles = [];
  }

  clear() { this.particles.length = 0; }

  add(p) {
    if (this.particles.length > 400) this.particles.shift();
    this.particles.push(p);
  }

  spawnCollect(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const sp = 22 + Math.random() * 45;
      this.add({
        type: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 14,
        life: 0.7 + Math.random() * 0.4, age: 0,
        size: Math.random() > 0.5 ? 2 : 1,
        color: i % 3 === 0 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 42,
      });
    }
  }

  spawnFirework(x, y) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + Math.random() * 0.2;
      const sp = 40 + Math.random() * 75;
      this.add({
        type: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.8 + Math.random() * 0.7, age: 0,
        size: Math.random() > 0.6 ? 2 : 1,
        color: Math.random() > 0.3 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 26,
      });
    }
    this.add({ type: 'ring', x, y, age: 0, life: 0.35, color });
  }

  spawnCelebration(w, h) {
    for (let i = 0; i < 90; i++) {
      this.add({
        type: Math.random() > 0.75 ? 'heart' : 'confetti',
        x: Math.random() * w,
        y: -10 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 26,
        vy: 24 + Math.random() * 42,
        life: 5 + Math.random() * 3, age: 0,
        size: 1 + Math.floor(Math.random() * 2),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 4,
        sway: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) { this.particles.splice(i, 1); continue; }
      if (p.type === 'ring') continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      if (p.sway != null) {
        p.sway += dt * 4;
        p.x += Math.sin(p.sway) * 12 * dt;
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.globalAlpha = alpha;
      const x = Math.round(p.x), y = Math.round(p.y);
      switch (p.type) {
        case 'spark':
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, p.size, p.size);
          break;
        case 'ring': {
          const r = 3 + (p.age / p.life) * 22;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'confetti': {
          ctx.fillStyle = p.color;
          const flip = Math.abs(Math.sin(p.sway * 1.7)) > 0.5 ? 2 : 1;
          ctx.fillRect(x, y, p.size + flip, p.size);
          break;
        }
        case 'heart': {
          ctx.fillStyle = p.color;
          ctx.fillRect(x - 1, y, 1, 2);
          ctx.fillRect(x + 1, y, 1, 2);
          ctx.fillRect(x - 1, y + 1, 3, 1);
          ctx.fillRect(x, y + 2, 1, 1);
          break;
        }
        default:
          break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
