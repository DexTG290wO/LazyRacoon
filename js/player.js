import { START } from './world.js?v=14';
import { audio } from './audio.js?v=14';

const SPEED = 82;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = START.x;
    this.y = START.y;
    this.dir = 'down';
    this.moving = false;
    this.animTime = 0;
    this.walkFrame = 0;
    this.interactTimer = 0;
    this.stepTimer = 0;
    this.locked = false;
    this.fishing = false;
    this.idleTime = 0;
    this.idleMood = 'calm';
    this.moodTimer = 0;
  }

  setDir(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else if (dy !== 0) this.dir = dy > 0 ? 'down' : 'up';
  }

  update(dt, input, world) {
    this.animTime += dt;
    if (this.interactTimer > 0) this.interactTimer -= dt;

    let dx = 0, dy = 0;
    if (!this.locked) {
      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }
    this.moving = len > 0 && !this.locked;

    if (this.moving) {
      this.idleTime = 0;
      this.idleMood = 'calm';
      this.moodTimer = 0;
    } else if (!this.locked) {
      this.idleTime += dt;
      this.moodTimer -= dt;
      if (this.idleTime > 4 && this.moodTimer <= 0) {
        const moods = ['blink', 'yawn', 'scratch', 'sleep'];
        this.idleMood = moods[Math.floor(Math.random() * moods.length)];
        this.moodTimer = this.idleMood === 'sleep' ? 3.4 : 1.8;
      }
      if (this.moodTimer <= 0 && this.idleMood !== 'calm') this.idleMood = 'calm';
    }

    if (this.moving) {
      this.setDir(dx, dy);
      // Compact hitbox so one-tile gaps between trees and stalls are passable.
      const canStand = (x, y) => !world.isSolid(x - 4, y - 3, 8, 6);

      const nx = this.x + dx * SPEED * dt;
      if (canStand(nx, this.y)) this.x = nx;
      else {
        // Corner slide: nudge sideways to slip around a protruding corner
        // instead of getting stuck when brushing past scenery.
        for (const n of [2, -2, 3, -3]) {
          if (canStand(nx, this.y + n)) { this.x = nx; this.y += n; break; }
        }
      }

      const ny = this.y + dy * SPEED * dt;
      if (canStand(this.x, ny)) this.y = ny;
      else {
        for (const n of [2, -2, 3, -3]) {
          if (canStand(this.x + n, ny)) { this.y = ny; this.x += n; break; }
        }
      }

      this.x = Math.max(5, Math.min(world.pixelW - 5, this.x));
      this.y = Math.max(5, Math.min(world.pixelH - 5, this.y));

      this.walkFrame = Math.floor(this.animTime * 9) % 4;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        audio.sfx('step');
        this.stepTimer = 0.27;
      }
    } else {
      this.stepTimer = 0;
    }
  }

  playInteract() {
    this.interactTimer = 0.45;
  }

  // Returns the sprite frame and the appropriate x flip.
  frame(sprites) {
    // The sprite sheet uses one shared "side" set for both left and right;
    // horizontal mirroring is applied in draw().
    const key = this.dir === 'left' || this.dir === 'right' ? 'side' : this.dir;
    const set = sprites[key];
    if (this.interactTimer > 0) return { img: set.interact };
    if (this.moving) return { img: set.walk[this.walkFrame] };
    return { img: set.idle[Math.floor(this.animTime * 1.8) % 2] };
  }

  draw(ctx, cam, sprites, accessory = null, time = 0) {
    const { img } = this.frame(sprites);
    const sx = Math.round(this.x - cam.x - img.width / 2);
    const sy = Math.round(this.y - cam.y - (this.fishing ? 17 : 21));
    if (this.dir === 'left') {
      ctx.save();
      ctx.translate(sx + img.width, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy);
    }
    const ax = Math.round(this.x - cam.x);
    const ay = Math.round(this.y - cam.y);
    if (accessory) {
      ctx.fillStyle = accessory === 'birthday' ? '#f5c95b' : accessory === 'mushroom' ? '#e66d7a'
        : accessory === 'bunny' ? '#f8e8ef' : accessory === 'scarf' ? '#9a76d2'
          : accessory === 'backpack' ? '#98663d' : '#f1c94f';
      if (accessory === 'scarf') ctx.fillRect(ax - 7, ay - 12, 14, 4);
      else if (accessory === 'backpack') ctx.fillRect(ax + (this.dir === 'left' ? 7 : -9), ay - 12, 4, 8);
      else if (accessory === 'bunny') { ctx.fillRect(ax - 5, ay - 25, 3, 8); ctx.fillRect(ax + 3, ay - 25, 3, 8); }
      else if (accessory === 'lantern') {
        ctx.fillStyle = '#ff8f7a';
        ctx.fillRect(ax + 6, ay - 26, 4, 3);
        ctx.fillRect(ax + 9, ay - 24, 3, 3);
        ctx.fillStyle = '#f5c95b';
        ctx.fillRect(ax + 7, ay - 25, 2, 2);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffd9a0';
        ctx.fillRect(ax + 4, ay - 29, 9, 1);
        ctx.globalAlpha = 1;
      }
      else if (accessory === 'flower') { ctx.fillRect(ax + 7, ay - 22, 3, 3); ctx.fillStyle = '#ffe8a3'; ctx.fillRect(ax + 8, ay - 21, 1, 1); }
      else if (accessory === 'mushroom') { ctx.fillRect(ax - 6, ay - 26, 12, 3); ctx.fillRect(ax - 3, ay - 30, 6, 4); ctx.fillStyle = '#fff0dc'; ctx.fillRect(ax - 3, ay - 25, 2, 1); ctx.fillRect(ax + 2, ay - 27, 2, 1); }
      else { ctx.fillRect(ax - 5, ay - 24, 10, 3); ctx.fillRect(ax - 3, ay - 30, 6, 6); }
    }
    if (!this.moving && this.idleMood === 'sleep') {
      ctx.fillStyle = '#fff0a8';
      const z = Math.floor(time * 3) % 2;
      ctx.fillRect(ax + 10 + z * 2, ay - 26 - z * 2, 2, 2);
      ctx.fillRect(ax + 14 + z * 2, ay - 31 - z * 2, 3, 3);
    } else if (!this.moving && this.idleMood === 'yawn' && this.moodTimer > 0.8) {
      ctx.fillStyle = '#3d2948'; ctx.fillRect(ax + 1, ay - 15, 3, 3);
    } else if (!this.moving && this.idleMood === 'scratch' && this.moodTimer > 0.8) {
      ctx.fillStyle = '#f4d2ad'; ctx.fillRect(ax + 8, ay - 21, 3, 2);
    }
  }

  get bottomY() { return this.y + 3; }
}
