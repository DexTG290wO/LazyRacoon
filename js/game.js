import { buildObjects, buildRaccoon, buildCollectibles, px, ellipse, makeCanvas } from './art.js?v=14';
import { World, DOOR_TILE, STREET, STALLS } from './world.js?v=14';
import { LanternQuest } from './lanterns.js?v=14';
import { Player } from './player.js?v=14';
import { Collectibles } from './collectibles.js?v=14';
import { Quest } from './quests.js?v=14';
import { Dialogue } from './dialogue.js?v=14';
import { Effects } from './effects.js?v=14';
import { Ending } from './ending.js?v=14';
import { audio } from './audio.js?v=14';
import { drawText, drawWrapped, drawTiny, tinyWidth } from './font.js?v=14';
import { panel, button, label, textCenter, UI } from './ui.js?v=14';

const SAVE_KEY = 'lazy_raccoon_save_v1';
const ACCESSORIES = ['birthday', 'mushroom', 'bunny', 'scarf', 'backpack', 'golden', 'flower', 'lantern'];

const SIGN_LINES = [
  'Hey there, little raccoon!',
  'I heard someone special has a birthday coming up...',
  'Can you collect five special items to prepare a surprise?',
  'A Pink Flower, a Purple Flower, a Golden Star,',
  'a Blue Crystal and a Special Ribbon.',
  'Hurry now - Lazy is waiting!',
];

const SIGN_DIALOGUES = {
  '8,34': SIGN_LINES,
  '20,17': [
    'The old path leads north into the tall trees.',
    'They say a golden star sleeps in a clearing up there.',
  ],
  '54,22': [
    'Mind your step on the bridge, little friend.',
    'Something blue and shiny glimmers south of the pond.',
  ],
  '18,31': [
    'A ring of glowing mushrooms grows to the east.',
    'Make a wish there - it is said to bring good luck.',
  ],
  '52,14': [
    'The stone circle in the north is very old.',
    'The crystal at its heart hums when you get close.',
  ],
};

const STALL_LINES = {
  fox: {
    waiting: [
      'Welcome to Lantern Street, little raccoon!',
      'The night wind carried away three of my red lanterns.',
      'Bring them back and I will light the whole street for Lazy!',
    ],
    close: [
      'One lantern is still out there, I can feel it.',
      'Check the ends of the lane - they love to hide.',
    ],
    done: [
      'Every lantern is home again!',
      'Look how the whole street glows. Lazy would love this.',
    ],
  },
  owl: {
    intro: [
      'Hoo hoo! A new friend in the night market.',
      'I play a little tune for anyone who says hello.',
    ],
    lit: [
      'With the lanterns lit, my music sounds even sweeter.',
      'Stay a while. The night is warm and full of stars.',
    ],
  },
  bear: {
    first: [
      'Cookie, cookie! Fresh from the little oven.',
      'Here, take two - one for you and one for Lazy.',
    ],
    again: [
      'Saving a cookie for later? Smart little raccoon.',
      'The fox needs those lanterns more than I need customers.',
    ],
  },
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.W = canvas.width;
    this.H = canvas.height;

    const objects = buildObjects();
    this.art = {
      ...objects,
      raccoon: buildRaccoon(),
      collectibleSprites: buildCollectibles(),
    };
    this.world = new World(objects);
    this.player = new Player();
    this.collectibles = new Collectibles(this.art.collectibleSprites);
    this.lanterns = new LanternQuest(this.art.lostLantern);
    this.quest = new Quest(this.collectibles);
    this.dialogue = new Dialogue();
    this.effects = new Effects();
    this.ending = new Ending(this.W, this.H);

    this.state = 'start';
    this.time = 0;
    this.cam = { x: 0, y: 0 };
    this.keys = new Set();
    this.touchMode = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    this.touch = { up: false, down: false, left: false, right: false };
    this.mouse = { x: -999, y: -999 };
    this.hover = null;
    this.announced = false;
    this.saveTimer = 0;
    this.showMap = true;
    this.discoveries = new Set();
    this.toast = null;
    this.coins = 0;
    this.cookies = 0;
    this.fish = 0;
    this.chests = [{ x: 632, y: 504 }, { x: 344, y: 584 }, { x: 896, y: 256 }].map((p) => ({ ...p, open: false }));
    this.flowers = 0;
    this.gardenWater = 0;
    this.gardenDone = false;
    this.accessories = ['birthday'];
    this.equipped = 'birthday';
    this.customizeOpen = false;
    this.fishing = null;
    this.thief = { x: 580, y: 466, active: false, timer: 18 };
    this.secretRoom = false;
    this.secretTitle = false;
    this.giantFishSeen = false;
    this.shake = 0;
    this.floaters = [];
    this.streetLit = false;
    this.bearGift = false;
    this.minimapBase = this.buildMinimapBase();

    this.buttons = {
      start: { x: this.W / 2 - 103, y: 148, w: 206, h: 30 },
      pause: this.touchMode ? { x: 272, y: 151, w: 38, h: 19 } : { x: this.W - 28, y: this.H - 22, w: 22, h: 16 },
      mute: this.touchMode ? { x: 272, y: 172, w: 38, h: 19 } : { x: this.W - 54, y: this.H - 22, w: 22, h: 16 },
      resume: { x: this.W / 2 - 62, y: 104, w: 124, h: 22 },
      restart: { x: this.W / 2 - 62, y: 134, w: 124, h: 22 },
      pauseMute: { x: this.W / 2 - 62, y: 164, w: 124, h: 22 },
      customize: this.touchMode ? { x: 272, y: 193, w: 38, h: 19 } : { x: this.W - 98, y: this.H - 22, w: 38, h: 16 },
      fullscreen: this.touchMode ? { x: 272, y: 130, w: 38, h: 19 } : { x: this.W - 144, y: this.H - 22, w: 42, h: 16 },
    };

    this.dpad = {
      up: { x: 34, y: 138, w: 30, h: 30 },
      left: { x: 4, y: 168, w: 30, h: 30 },
      down: { x: 34, y: 168, w: 30, h: 30 },
      right: { x: 64, y: 168, w: 30, h: 30 },
      act: { x: this.W - 68, y: 156, w: 48, h: 48 },
    };

    this.load();
    this.bindEvents();
  }

  /* ---------------- discovery features ---------------- */
  buildMinimapBase() {
    const map = makeCanvas(68, 50);
    const ctx = map.ctx;
    const colors = {
      grass: '#3f6b46', path: '#a98d68', soil: '#6d5543',
      water: '#4a7fb4', bridge: '#a67449', wall: '#7c559f', floor: '#c7a97c',
      lane: '#6a4f86',
    };
    for (let ty = 0; ty < this.world.h; ty++) {
      for (let tx = 0; tx < this.world.w; tx++) {
        ctx.fillStyle = colors[this.world.ground[ty][tx]] || colors.grass;
        ctx.fillRect(tx * 1.13, ty * 1.13, 2, 2);
      }
    }
    return map.canvas;
  }

  bunnyDialogue() {
    if (this.collectibles.all) {
      return ['You found every single one!', 'The birthday house is open now.', 'Lazy is going to love it!'];
    }
    if (this.collectibles.count === 0) {
      return ['Oh! A visitor!', 'I hid a pink flower in the garden, west of here.', 'It has the loveliest petals!'];
    }
    const near = this.collectibles.nearest(this.player.x, this.player.y);
    return [
      'Still searching, little friend?',
      near ? `The ${near.item.name.toLowerCase()} is not far from here.` : 'Follow the hint at the top of the screen!',
      'I am cheering for you!',
    ];
  }

  nearestSign() {
    const p = this.player;
    let best = null, bestD = 32;
    for (const o of this.world.objects) {
      if (o.type !== 'sign') continue;
      const d = Math.hypot(p.x - (o.tx * 16 + 8), p.y - (o.ty * 16 + 8));
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  nearestStall() {
    const p = this.player;
    let best = null, bestD = 40;
    for (const stall of STALLS) {
      const d = Math.hypot(p.x - (stall.tx * 16 + 8), p.y - (stall.ty * 16 + 8));
      if (d < bestD) { bestD = d; best = stall; }
    }
    return best;
  }

  lightStreet() {
    this.streetLit = true;
    this.world.streetLit = true;
    if (!this.accessories.includes('lantern')) this.accessories.push('lantern');
    this.equipped = 'lantern';
    this.shake = 0.25;
    this.effects.spawnFirework(this.W / 2, 60);
    this.effects.spawnCelebration(this.W, this.H);
    audio.sfx('unlock');
    audio.sfx('celebrate');
    this.toast = { text: 'LANTERN STREET IS GLOWING!', timer: 3.2 };
    this.dialogue.start([
      'The fox claps with delight!',
      'All three lanterns are home and the street is glowing.',
      'A little glowing bow for you - and fireflies will follow you now!',
    ], 'Lantern Street');
    this.save();
  }

  talkToStall(stall) {
    audio.sfx('interact');
    this.player.playInteract();
    if (stall.id === 'fox') {
      if (this.lanterns.all && !this.streetLit) { this.lightStreet(); return; }
      const lines = this.streetLit ? STALL_LINES.fox.done
        : this.lanterns.count >= 2 ? STALL_LINES.fox.close : STALL_LINES.fox.waiting;
      this.dialogue.start(lines, 'Fox Lantern Maker');
      return;
    }
    if (stall.id === 'owl') {
      audio.sfx('chime');
      this.dialogue.start(this.streetLit ? STALL_LINES.owl.lit : STALL_LINES.owl.intro, 'Owl Musician');
      return;
    }
    // Cookie bear: a small one-time gift, then friendly chatter.
    const firstTime = !this.bearGift;
    if (firstTime) {
      this.bearGift = true;
      this.cookies += 2;
      this.sayFloat('+2 COOKIES', this.player.x, this.player.y - 26, '#ffd9a0');
      this.save();
    }
    this.dialogue.start(firstTime ? STALL_LINES.bear.first : STALL_LINES.bear.again, 'Cookie Bear');
  }

  collectLantern() {
    const got = this.lanterns.tryCollect(this.player.x, this.player.y, 34);
    if (!got) return false;
    audio.sfx('collect');
    this.player.playInteract();
    this.effects.spawnCollect(this.player.x - this.cam.x, this.player.y - this.cam.y, got.color);
    this.sayFloat('LANTERN FOUND!', this.player.x, this.player.y - 26, '#ffd9a0');
    if (this.lanterns.all && !this.streetLit) {
      this.toast = { text: 'ALL LANTERNS FOUND! RETURN TO THE FOX', timer: 3 };
    }
    this.save();
    return true;
  }

  getPrompt() {
    const p = this.player;
    const door = this.world.doorWorld();
    if (Math.hypot(p.x - door.x, p.y - door.y) < 32)
      return this.collectibles.all ? 'SPACE  ENTER HOUSE' : 'LOCKED  FIND 5 ITEMS';
    const bunny = this.world.bunnyWorld();
    if (this.customizeOpen) return 'C  CLOSE WARDROBE';
    if (this.secretRoom) return 'E / SPACE  LEAVE HIDDEN ROOM';
    if (this.fishing) return this.fishing.bite ? 'E / SPACE  REEL IT IN!' : 'WAIT FOR A BITE...';
    if (this.near(p.x, p.y, 408, 88, 38)) return 'E / SPACE  PEEK BEHIND TREE';
    if (this.near(this.player.x, this.player.y, 704, 448, 38)) return 'E / SPACE  FISH';
    if (this.near(this.player.x, this.player.y, 104, 360, 34)) return 'E / SPACE  WATER FLOWERS';
    const chest = this.chests.find((c) => !c.open && this.near(this.player.x, this.player.y, c.x, c.y, 30));
    if (chest) return 'E / SPACE  OPEN TREASURE';
    const stall = this.nearestStall();
    if (stall) return stall.id === 'fox' && this.lanterns.all && !this.streetLit
      ? 'E / SPACE  RELIGHT THE STREET' : 'E / SPACE  TALK';
    const nearLantern = this.lanterns.nearest(p.x, p.y);
    if (nearLantern && nearLantern.dist < 34) return 'E / SPACE  PICK UP LANTERN';
    if (Math.hypot(p.x - bunny.x, p.y - bunny.y) < 34) return 'SPACE  TALK TO BUNNY';
    if (this.nearestSign()) return 'SPACE  READ SIGN';
    const near = this.collectibles.nearest(p.x, p.y);
    if (near && near.dist < 34) return 'E / SPACE  COLLECT';
    return null;
  }

  near(x, y, tx, ty, r) { return Math.hypot(x - tx, y - ty) < r; }

  checkDiscoveries() {
    const p = this.player;
    const zones = [
      ['garden', 'Flower Garden', p.x < 220 && p.y > 300 && p.y < 440],
      ['forest', 'Whispering Woods', p.y < 230],
      ['house', 'Birthday House', p.x > 350 && p.x < 520 && p.y < 230],
      ['pond', 'Mirror Pond', p.x > 520 && p.x < 870 && p.y > 250 && p.y < 480],
      ['picnic', 'Picnic Clearing', Math.hypot(p.x - 592, p.y - 472) < 62],
      ['fairy', 'Fairy Ring', Math.hypot(p.x - 328, p.y - 552) < 62],
      ['stones', 'Ancient Stone Circle', Math.hypot(p.x - 840, p.y - 152) < 52],
      ['street', 'Lantern Street', p.x > STREET.x1 * 16 && p.x < (STREET.x2 + 1) * 16
        && p.y > STREET.y1 * 16 && p.y < (STREET.y2 + 1) * 16],
    ];
    for (const [id, name, inside] of zones) {
      if (inside && !this.discoveries.has(id)) {
        this.discoveries.add(id);
        this.toast = { text: `DISCOVERED: ${name}`, timer: 2.6 };
        audio.sfx('ui');
      }
    }
  }

  /* ---------------- persistence ---------------- */
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d) return;
      this.collectibles.load(d.items);
      this.lanterns.load(d.lanterns);
      this.streetLit = !!d.streetLit;
      this.world.streetLit = this.streetLit;
      this.bearGift = !!d.bearGift;
      if (d.player) {
        this.player.x = Math.max(8, Math.min(this.world.pixelW - 8, d.player.x));
        this.player.y = Math.max(8, Math.min(this.world.pixelH - 8, d.player.y));
      }
      this.coins = Math.max(0, d.coins || 0);
      this.cookies = Math.max(0, d.cookies || 0);
      this.fish = Math.max(0, d.fish || 0);
      this.flowers = Math.max(0, d.flowers || 0);
      this.chests.forEach((c, i) => { c.open = !!(d.chests && d.chests[i]); });
      this.gardenWater = Math.min(3, d.gardenWater || 0);
      this.gardenDone = !!d.gardenDone;
      this.accessories = Array.isArray(d.accessories) ? [...new Set(['birthday', ...d.accessories.filter((a) => ACCESSORIES.includes(a))])] : ['birthday'];
      this.equipped = this.accessories.includes(d.equipped) ? d.equipped : 'birthday';
      if (this.streetLit && !this.accessories.includes('lantern')) this.accessories.push('lantern');
      this.secretTitle = !!d.secretTitle;
      this.giantFishSeen = !!d.giantFishSeen;
      if (this.collectibles.all) this.world.doorOpen = true;
    } catch (e) { /* ignore broken saves */ }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        items: this.collectibles.serialize(),
        lanterns: this.lanterns.serialize(),
        streetLit: this.streetLit, bearGift: this.bearGift,
        player: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
        coins: this.coins, cookies: this.cookies, fish: this.fish, flowers: this.flowers,
        chests: this.chests.map((c) => c.open), gardenWater: this.gardenWater,
        gardenDone: this.gardenDone, accessories: this.accessories, equipped: this.equipped,
        secretTitle: this.secretTitle, giantFishSeen: this.giantFishSeen,
      }));
    } catch (e) { /* storage may be unavailable */ }
  }

  /* ---------------- input ---------------- */
  bindEvents() {
    const c = this.canvas;
    const blocked = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Space', 'Tab',
    ]);

    window.addEventListener('keydown', (e) => {
      if (blocked.has(e.code) || blocked.has(e.key)) e.preventDefault();
      if (e.repeat) return;
      audio.unlock();
      this.keys.add(e.code);

      const code = e.code;
      if (this.state === 'start') {
        if (code === 'Enter' || code === 'Space') this.startGame();
        else if (code === 'KeyM') this.toggleMute();
        else if (code === 'KeyF') this.toggleFullscreen();
        return;
      }
      if (this.state === 'pause') {
        if (code === 'Escape' || code === 'KeyP' || code === 'Enter') this.state = 'play';
        else if (code === 'KeyR') this.restart();
        else if (code === 'KeyM') this.toggleMute();
        else if (code === 'KeyF') this.toggleFullscreen();
        return;
      }
      if (this.state === 'ending') {
        if (this.ending.letterOpen && (code === 'PageDown' || code === 'ArrowDown')) { this.ending.letterScroll += 4; return; }
        if (this.ending.letterOpen && (code === 'PageUp' || code === 'ArrowUp')) { this.ending.letterScroll = Math.max(0, this.ending.letterScroll - 4); return; }
        if (code === 'Enter' || code === 'Space') {
          if (this.ending.phase === 'message') this.ending.letterOpen = !this.ending.letterOpen;
          else this.skipEnding();
        }
        if (code === 'KeyR' && this.ending.phase === 'message') this.restart();
        if (code === 'Escape' && this.ending.letterOpen) this.ending.letterOpen = false;
        return;
      }
      // Playing (dialogue handled first).
      if (this.dialogue.active) {
        if (code === 'Space' || code === 'Enter' || code === 'KeyE') this.dialogue.advance();
        else if (code === 'Escape') this.dialogue.close();
        return;
      }
      if (code === 'KeyC') { this.customizeOpen = !this.customizeOpen; return; }
      if (this.customizeOpen) {
        const n = Number(code.replace('Digit', '')) - 1;
        if (n >= 0 && n < ACCESSORIES.length) {
          const id = ACCESSORIES[n];
          if (this.accessories.includes(id)) { this.equipped = this.equipped === id ? null : id; this.save(); audio.sfx('ui'); }
          else this.toast = { text: 'FIND THIS ACCESSORY IN A TREASURE!', timer: 2.2 };
        }
        return;
      }
      if (this.fishing && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        this.fishing = null; this.player.locked = false; this.player.fishing = false;
      }
      if (code === 'Escape' || code === 'KeyP') { this.state = 'pause'; return; }
      if (code === 'KeyF') { this.toggleFullscreen(); return; }
      if (code === 'Tab') { this.showMap = !this.showMap; audio.sfx('ui'); return; }
      if (code === 'KeyM') { this.toggleMute(); return; }
      if (code === 'KeyE' || code === 'Space') this.interact(code === 'KeyE');
    });

    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touch.up = this.touch.down = this.touch.left = this.touch.right = false;
    });

    const toLogical = (ev) => {
      const r = c.getBoundingClientRect();
      return {
        x: (ev.clientX - r.left) / r.width * this.W,
        y: (ev.clientY - r.top) / r.height * this.H,
      };
    };

    c.addEventListener('pointermove', (ev) => {
      const p = toLogical(ev);
      this.mouse.x = p.x; this.mouse.y = p.y;
    });
    c.addEventListener('pointerleave', () => { this.mouse.x = -999; this.mouse.y = -999; });
    c.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      audio.unlock();
      if (ev.pointerType === 'touch') this.touchMode = true;
      const p = toLogical(ev);
      this.mouse.x = p.x; this.mouse.y = p.y;
      this.handlePointerDown(p);
    });
    const release = (ev) => {
      this.touch.up = this.touch.down = this.touch.left = this.touch.right = false;
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handlePointerDown(p) {
    const R = (rect) => p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
    if (this.state === 'start') {
      if (R(this.buttons.start)) this.startGame();
      return;
    }
    if (this.state === 'pause') {
      if (R(this.buttons.resume)) { audio.sfx('ui'); this.state = 'play'; }
      else if (R(this.buttons.restart)) this.restart();
      else if (R(this.buttons.pauseMute)) this.toggleMute();
      return;
    }
    if (this.state === 'ending') {
      if (this.ending.phase === 'message' && this.ending.letterOpen) {
        if (R(this.ending.replayRect)) this.restart(); else this.ending.letterOpen = false;
      } else if (this.ending.phase === 'message' && R(this.ending.replayRect)) this.restart();
      else if (this.ending.phase === 'message' && R(this.ending.letterRect)) this.ending.letterOpen = true;
      else if (this.ending.phase !== 'message') this.skipEnding();
      return;
    }
    // Playing.
    if (R(this.buttons.mute)) { this.toggleMute(); return; }
    if (R(this.buttons.pause)) { this.state = 'pause'; return; }
    if (R(this.buttons.fullscreen)) { this.toggleFullscreen(); return; }
    if (R(this.buttons.customize)) { this.customizeOpen = !this.customizeOpen; return; }
    if (this.customizeOpen) {
      for (let i = 0; i < ACCESSORIES.length; i++) {
        const r = { x: 74 + (i % 4) * 58, y: 82 + Math.floor(i / 4) * 30, w: 52, h: 24 };
        if (R(r)) {
          const id = ACCESSORIES[i];
          if (this.accessories.includes(id)) this.equipped = this.equipped === id ? null : id;
          this.save(); return;
        }
      }
      return;
    }
    if (this.dialogue.active) { this.dialogue.advance(); return; }
    if (this.touchMode) {
      if (R(this.dpad.up)) this.touch.up = true;
      else if (R(this.dpad.down)) this.touch.down = true;
      else if (R(this.dpad.left)) this.touch.left = true;
      else if (R(this.dpad.right)) this.touch.right = true;
      else if (R(this.dpad.act)) this.interact(false);
    }
  }

  toggleMute() {
    const muted = audio.toggleMute();
    if (!muted) audio.unlock();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const request = this.canvas.requestFullscreen?.();
      if (request?.catch) request.catch(() => {});
    } else document.exitFullscreen?.();
    audio.sfx('ui');
  }

  /* ---------------- flow ---------------- */
  startGame() {
    audio.unlock();
    audio.sfx('ui');
    audio.startMusic('forest');
    this.state = 'play';
    this.canvas.classList.add('is-playing');
  }

  restart() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    this.collectibles.reset();
    this.lanterns.reset();
    this.streetLit = false;
    this.world.streetLit = false;
    this.bearGift = false;
    this.player.reset();
    this.coins = 0; this.cookies = 0; this.fish = 0; this.flowers = 0;
    this.chests.forEach((c) => { c.open = false; });
    this.gardenWater = 0; this.gardenDone = false;
    this.accessories = ['birthday']; this.equipped = 'birthday';
    this.customizeOpen = false; this.fishing = null; this.player.fishing = false;
    this.thief = { x: 580, y: 466, active: false, timer: 18 };
    this.secretRoom = false; this.secretTitle = false; this.giantFishSeen = false;
    this.floaters.length = 0; this.shake = 0;
    this.world.doorOpen = false;
    this.announced = false;
    this.discoveries.clear();
    this.toast = null;
    this.effects.clear();
    this.dialogue.active = false;
    this.ending.reset();
    this.state = 'play';
    this.cam.x = Math.max(0, Math.min(this.world.pixelW - this.W, this.player.x - this.W / 2));
    this.cam.y = Math.max(0, Math.min(this.world.pixelH - this.H, this.player.y - this.H / 2));
    audio.startMusic('forest');
    audio.sfx('ui');
  }

  skipEnding() {
    this.ending.phaseIndex = 5; // jump straight to the message phase
    this.ending.t = 0;
    this.ending.done = true;
    this.ending.raccoonX = 148;
    this.effects.spawnCelebration(this.W, this.H);
    audio.startMusic('party');
  }

  startEnding() {
    this.state = 'ending';
    this.dialogue.active = false;
    this.player.locked = true;
    this.ending.begin(audio);
  }

  sayFloat(text, x = this.player.x, y = this.player.y - 22, color = '#fff0a8') {
    this.floaters.push({ text, x, y, color, t: 1.6 });
    if (this.floaters.length > 8) this.floaters.shift();
  }

  openChest(chest, index) {
    chest.open = true;
    this.shake = 0.18;
    this.effects.spawnCollect(chest.x - this.cam.x, chest.y - this.cam.y, '#f5c95b');
    audio.sfx('gift');
    const rewards = [
      () => { this.coins += 12 + Math.floor(Math.random() * 13); return `A pouch of coins! ${this.coins} coins`; },
      () => { this.flowers++; this.sayFloat('A TINY FLOWER!', chest.x, chest.y - 14, '#ff9dc4'); return 'A flower for your garden!'; },
      () => { this.cookies += 2; return 'Two cookies! Very snackable.'; },
      () => {
        const locked = ACCESSORIES.filter((a) => !this.accessories.includes(a) && a !== 'golden' && a !== 'flower');
        if (!locked.length) { this.coins += 15; return 'A shiny coin bonus! +15 coins'; }
        const id = locked[Math.floor(Math.random() * locked.length)];
        this.accessories.push(id); this.equipped = id;
        return `${id.toUpperCase()} ACCESSORY UNLOCKED!`;
      },
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)]();
    const pages = [`Treasure chest ${index + 1} opened!`, reward];
    if (index === 2) { pages.push('A secret birthday note: "This little world was made just for you."'); this.secretTitle = true; }
    if (this.coins >= 50 && !this.accessories.includes('golden')) {
      this.accessories.push('golden'); pages.push("Achievement! Lazy's Best Friend - golden raccoon hat unlocked!");
    }
    this.toast = { text: 'TREASURE FOUND!', timer: 2.4 };
    this.dialogue.start(pages, 'Treasure');
    this.save();
  }

  doFishing() {
    if (!this.fishing) {
      this.fishing = { timer: 1.5 + Math.random() * 3.2, bite: false, window: 0 };
      this.player.locked = true;
      this.player.fishing = true;
      this.player.dir = 'up';
      this.sayFloat('SPLASH...', this.player.x, this.player.y - 28, '#9bdcff');
      audio.sfx('splash');
      return;
    }
    if (!this.fishing.bite) { this.sayFloat('TOO SOON!', this.player.x, this.player.y - 25); return; }
    const roll = Math.random();
    const result = roll < 0.46 ? 'fish' : roll < 0.58 ? 'gold' : roll < 0.79 ? 'boot' : 'box';
    this.fishing = null; this.player.locked = false; this.player.fishing = false;
    if (result === 'fish') { this.fish++; this.coins += 3; this.sayFloat('FISH! +3 COINS'); }
    else if (result === 'gold') { this.fish++; this.coins += 18; this.sayFloat('GOLDEN FISH! +18'); }
    else if (result === 'boot') this.sayFloat('AN OLD BOOT?!');
    else { this.cookies++; this.sayFloat('MYSTERY BOX! +COOKIE'); }
    this.effects.spawnCollect(this.player.x - this.cam.x, this.player.y - this.cam.y, result === 'gold' ? '#f5c95b' : '#8fd0f0');
    audio.sfx(result === 'boot' ? 'deny' : 'collect');
    this.save();
  }

  waterGarden() {
    if (this.gardenDone) { this.dialogue.start(['The flowers are blooming beautifully!', 'They made a special flower just for Lazy.'], 'Flower Garden'); return; }
    this.gardenWater = Math.min(3, this.gardenWater + 1);
    this.effects.spawnCollect(this.player.x - this.cam.x, this.player.y - this.cam.y, '#8fd0f0');
    audio.sfx('collect');
    if (this.gardenWater >= 3) {
      this.gardenDone = true;
      if (!this.accessories.includes('flower')) this.accessories.push('flower');
      this.equipped = 'flower';
      this.toast = { text: 'GARDEN COMPLETE! SPECIAL FLOWER UNLOCKED', timer: 3 };
      this.dialogue.start(['The little garden is in full bloom!', 'A special flower for Lazy. Wear it proudly!'], 'Garden Helper');
      audio.sfx('unlock');
    } else this.sayFloat(['SPROUT!', 'BLOOMING!'][this.gardenWater - 1], this.player.x, this.player.y - 26, '#ff9dc4');
    this.save();
  }

  interact(collectFirst) {
    if (this.state !== 'play' || this.dialogue.active) return;
    const p = this.player;
    const door = this.world.doorWorld();
    const dDoor = Math.hypot(p.x - door.x, p.y - door.y);
    const bunny = this.world.bunnyWorld();
    const dBunny = Math.hypot(p.x - bunny.x, p.y - bunny.y);

    if (this.secretRoom) { this.secretRoom = false; p.x = 408; p.y = 120; return; }
    if (this.customizeOpen) { this.customizeOpen = false; return; }
    if (this.fishing) { this.doFishing(); return; }
    if (this.near(p.x, p.y, 704, 448, 38)) { this.doFishing(); return; }
    if (this.near(p.x, p.y, 104, 360, 34)) { this.waterGarden(); return; }
    const chestIndex = this.chests.findIndex((c) => !c.open && this.near(p.x, p.y, c.x, c.y, 30));
    if (chestIndex >= 0) { this.openChest(this.chests[chestIndex], chestIndex); return; }
    if (this.thief.active && this.near(p.x, p.y, this.thief.x, this.thief.y, 18)) {
      this.thief.active = false; this.cookies++; this.coins += 5;
      this.sayFloat('COOKIE RECOVERED! +5', p.x, p.y - 24);
      this.toast = { text: 'COOKIE THIEF CAUGHT! +5 COINS', timer: 2.5 };
      audio.sfx('collect'); this.save(); return;
    }
    if (this.near(p.x, p.y, 408, 88, 38)) {
      this.secretRoom = true; this.secretTitle = true; this.toast = { text: "SECRET FOUND: LAZY'S BEST FRIEND", timer: 3 };
      this.save(); audio.sfx('unlock'); return;
    }
    if (this.near(p.x, p.y, 752, 416, 48) && !this.giantFishSeen) {
      this.giantFishSeen = true; this.secretTitle = true;
      this.dialogue.start(['A GIANT FISH leaps from the pond!', 'It is wearing a tiny party hat. The fish knows.'], 'Pond Legend');
      this.effects.spawnFirework(this.W / 2, 66); this.save(); return;
    }

    const doCollect = () => {
      const got = this.collectibles.tryCollect(p.x, p.y, 32);
      if (got) {
        audio.sfx('collect');
        p.playInteract();
        this.effects.spawnCollect(p.x - this.cam.x, p.y - this.cam.y, got.color);
        this.save();
        this.checkUnlock();
        return true;
      }
      return false;
    };

    // The house door takes priority when the player is standing at it.
    if (dDoor < 30) {
      p.playInteract();
      if (this.collectibles.all) { this.startEnding(); return; }
      audio.sfx('deny');
      this.dialogue.start(['The birthday house is locked.', 'Find all five special items first!'], 'Birthday House');
      return;
    }
    if (dBunny < 34) {
      audio.sfx('interact');
      p.playInteract();
      this.dialogue.start(this.bunnyDialogue(), 'Forest Bunny');
      return;
    }
    const stall = this.nearestStall();
    if (stall) { this.talkToStall(stall); return; }
    if (this.collectLantern()) return;
    const sign = this.nearestSign();
    if (sign) {
      audio.sfx('interact');
      p.playInteract();
      const lines = SIGN_DIALOGUES[`${sign.tx},${sign.ty}`] || SIGN_LINES;
      this.dialogue.start(lines, 'Wooden Sign');
      return;
    }
    if (doCollect()) return;
    audio.sfx('interact');
    p.playInteract();
  }

  checkUnlock() {
    if (this.collectibles.all && !this.world.doorOpen) {
      this.world.doorOpen = true;
      audio.sfx('unlock');
      this.dialogue.start([
        'All five treasures found!',
        'The birthday house is open now.',
        'Go inside, little raccoon!',
      ], 'Quest Complete');
      this.save();
    }
  }

  /* ---------------- update ---------------- */
  update(dt) {
    this.time += dt;
    audio.update();
    this.effects.update(dt);

    if (this.hoverPoint()) this.updateHover();

    if (this.state === 'play') {
      const active = !this.dialogue.active;
      const input = {
        up: active && (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.touch.up),
        down: active && (this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.touch.down),
        left: active && (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.touch.left),
        right: active && (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.touch.right),
      };
      this.player.update(dt, input, this.world);
      if (this.fishing) {
        this.fishing.timer -= dt;
        if (!this.fishing.bite && this.fishing.timer <= 0) {
          this.fishing.bite = true; this.fishing.window = 1.6;
          this.toast = { text: 'A BITE! REEL IT IN!', timer: 1.6 }; audio.sfx('bite');
        } else if (this.fishing.bite) {
          this.fishing.window -= dt;
          if (this.fishing.window <= 0) { this.fishing = null; this.player.locked = false; this.player.fishing = false; this.sayFloat('THE FISH GOT AWAY!'); }
        }
      }
      if (!this.thief.active) {
        this.thief.timer -= dt;
        if (this.thief.timer <= 0 && this.cookies > 0) {
          this.cookies--; this.thief.active = true; this.thief.x = 580; this.thief.y = 466;
          this.toast = { text: 'A SNEAKY RACCOON STOLE A COOKIE!', timer: 2.8 }; audio.sfx('deny');
          this.save();
        } else if (this.thief.timer <= 0) this.thief.timer = 14;
      } else {
        const dx = this.player.x - this.thief.x, dy = this.player.y - this.thief.y, d = Math.hypot(dx, dy) || 1;
        this.thief.x += dx / d * 34 * dt; this.thief.y += dy / d * 34 * dt;
        if (d < 18) { this.thief.active = false; this.cookies++; this.coins += 5; this.sayFloat('COOKIE! +5 COINS'); this.toast = { text: 'COOKIE THIEF CAUGHT! +5 COINS', timer: 2.5 }; audio.sfx('collect'); this.save(); }
      }
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (this.coins >= 50 && !this.accessories.includes('golden')) {
        this.accessories.push('golden'); this.toast = { text: '50 COINS! GOLDEN RACCOON HAT UNLOCKED!', timer: 3 };
        audio.sfx('unlock'); this.save();
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) { const f = this.floaters[i]; f.t -= dt; f.y -= 13 * dt; if (f.t <= 0) this.floaters.splice(i, 1); }
      this.dialogue.update(dt);

      // Camera follow with smoothing and world clamping.
      const tx = Math.max(0, Math.min(this.world.pixelW - this.W, this.player.x - this.W / 2));
      const ty = Math.max(0, Math.min(this.world.pixelH - this.H, this.player.y - this.H / 2));
      const k = Math.min(1, dt * 6);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;

      this.checkDiscoveries();
      if (this.toast) {
        this.toast.timer -= dt;
        if (this.toast.timer <= 0) this.toast = null;
      }

      // Auto-enter the house once everything is collected.
      if (this.collectibles.all && this.world.isDoorTile(this.player.x, this.player.y)) {
        this.startEnding();
      }

      this.saveTimer += dt;
      if (this.saveTimer > 4) { this.saveTimer = 0; this.save(); }
    } else if (this.state === 'ending') {
      this.ending.update(dt, audio, this.effects);
    }
  }

  hoverPoint() {
    return this.mouse.x > -500;
  }

  updateHover() {
    const R = (rect) => this.mouse.x >= rect.x && this.mouse.x <= rect.x + rect.w
      && this.mouse.y >= rect.y && this.mouse.y <= rect.y + rect.h;
    let h = null;
    if (this.state === 'start') h = R(this.buttons.start) ? 'start' : null;
    else if (this.state === 'pause') {
      h = R(this.buttons.resume) ? 'resume' : R(this.buttons.restart) ? 'restart'
        : R(this.buttons.pauseMute) ? 'pauseMute' : null;
    } else if (this.state === 'ending' && this.ending.phase === 'message') {
      h = R(this.ending.replayRect) ? 'replay' : null;
    } else if (this.state === 'play') {
      h = R(this.buttons.mute) ? 'mute' : R(this.buttons.pause) ? 'pause' : R(this.buttons.customize) ? 'customize'
        : R(this.buttons.fullscreen) ? 'fullscreen' : null;
    }
    this.hover = h;
    this.canvas.style.cursor = h ? 'pointer' : (this.state === 'play' ? 'crosshair' : 'default');
  }

  /* ---------------- rendering ---------------- */
  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#140d24';
    ctx.fillRect(0, 0, this.W, this.H);

    switch (this.state) {
      case 'start': this.renderStart(ctx); break;
      case 'pause':
        this.renderWorld(ctx);
        this.renderPause(ctx);
        break;
      case 'ending':
        this.ending.draw(ctx, this.time, this.art.raccoon, this.art, this.hover === 'replay');
        this.effects.render(ctx);
        break;
      default:
        this.renderWorld(ctx);
        break;
    }
  }

  renderWorld(ctx) {
    const cam = this.cam;
    if (this.shake > 0) { ctx.save(); ctx.translate(Math.round((Math.random() - 0.5) * 3), Math.round((Math.random() - 0.5) * 3)); }
    const drawables = this.world.render(ctx, cam, this.time);
    drawables.push({ y: this.player.bottomY, draw: () => this.player.draw(ctx, cam, this.art.raccoon, this.equipped, this.time) });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    this.collectibles.draw(ctx, cam, this.time);
    this.lanterns.draw(ctx, cam, this.time);
    this.drawActivities(ctx, cam);

    // Reward for relighting the street: friendly fireflies follow the raccoon.
    if (this.streetLit) {
      const ax = this.player.x - cam.x;
      const ay = this.player.y - cam.y;
      for (let i = 0; i < 3; i++) {
        const a = this.time * 1.7 + i * 2.1;
        const fx = Math.round(ax + Math.cos(a) * 12);
        const fy = Math.round(ay - 15 + Math.sin(a * 1.3) * 6);
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 3 + i) * 0.2;
        ellipse(ctx, fx, fy, 4, 4, '#ffb074');
        ctx.fillStyle = '#fff3c0';
        ctx.fillRect(fx, fy, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    this.effects.render(ctx);

    // Soft daytime warmth and a gentle vignette.
    ctx.fillStyle = 'rgba(255,236,196,0.035)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = 'rgba(10,5,20,0.16)';
    ctx.fillRect(0, 0, this.W, 4);
    ctx.fillRect(0, this.H - 4, this.W, 4);
    ctx.fillRect(0, 0, 4, this.H);
    ctx.fillRect(this.W - 4, 0, 4, this.H);

    if (this.shake > 0) ctx.restore();
    this.quest.renderHUD(ctx, this.player, this.touchMode);
    this.renderLanternHUD(ctx);
    if (this.showMap) this.renderMinimap(ctx);
    this.renderPrompt(ctx, cam);
    this.renderToast(ctx);

    // Mute / pause buttons.
    const m = this.buttons.mute;
    const p = this.buttons.pause;
    this.smallButton(ctx, m, audio.muted ? 'X' : 'M', this.hover === 'mute');
    this.smallButton(ctx, p, '||', this.hover === 'pause');
    this.smallButton(ctx, this.buttons.customize, 'C', this.hover === 'customize');
    this.smallButton(ctx, this.buttons.fullscreen, this.touchMode ? 'F' : 'FS', this.hover === 'fullscreen');

    panel(ctx, 4, 39, 126, 13, { fill: '#1c1130', shadow: false });
    drawTiny(ctx, `G ${this.coins}  CK ${this.cookies}  F ${this.fish}`, 8, 43, { color: UI.gold });
    if (this.secretTitle) drawText(ctx, "LAZY'S BEST FRIEND", this.W / 2, 116, { align: 'center', color: UI.pink, shadow: UI.ink });
    for (const f of this.floaters) drawText(ctx, f.text, f.x - cam.x, f.y - cam.y, { align: 'center', color: f.color, shadow: UI.ink });

    if (this.touchMode) this.renderTouchControls(ctx);
    if (this.customizeOpen) this.renderWardrobe(ctx);
    if (this.secretRoom) this.renderSecretRoom(ctx);
    this.dialogue.render(ctx, this.time);
  }

  drawActivities(ctx, cam) {
    const sx = (x) => Math.round(x - cam.x), sy = (y) => Math.round(y - cam.y);
    // Three small pixel chests, anchored to clearings around the established map.
    for (const c of this.chests) {
      const x = sx(c.x), y = sy(c.y);
      ctx.fillStyle = '#4a2c28'; ctx.fillRect(x - 7, y - 5, 14, 9);
      ctx.fillStyle = c.open ? '#8b684b' : '#b87542'; ctx.fillRect(x - 6, y - 5, 12, 6);
      ctx.fillStyle = '#f5c95b'; ctx.fillRect(x - 1, y - 3, 2, 3);
      if (c.open) { ctx.fillStyle = '#ffe9a6'; ctx.fillRect(x - 5, y - 10, 10, 2); }
    }
    // Garden rows and water sparkle; progress is visible without obscuring flowers.
    for (let i = 0; i < 3; i++) {
      const x = sx(88 + i * 15), y = sy(360);
      ctx.fillStyle = this.gardenWater > i ? ['#74bb62', '#ff91b7', '#f5c95b'][i] : '#76553a';
      ctx.fillRect(x - 2, y - (this.gardenWater > i ? 6 + i * 2 : 2), 5, this.gardenWater > i ? 7 + i * 2 : 4);
    }
    // Fishing bobber near the pond's south bank.
    const bx = sx(704), by = sy(448);
    ctx.fillStyle = '#bde7ff'; ctx.fillRect(bx - 3, by + Math.sin(this.time * 3) * 1, 6, 3);
    ctx.fillStyle = '#ff8eaa'; ctx.fillRect(bx - 1, by - 2 + Math.sin(this.time * 3) * 1, 2, 3);
    if (this.fishing && this.fishing.bite) { ctx.fillStyle = '#fff0a8'; ctx.fillRect(bx + 5, by - 9, 3, 3); }
    if (this.thief.active) {
      const x = sx(this.thief.x), y = sy(this.thief.y);
      ctx.fillStyle = '#403044'; ctx.fillRect(x - 12, y - 5, 6, 3);
      ctx.fillStyle = '#d2b0c6'; ctx.fillRect(x - 11, y - 5, 2, 2);
      ctx.fillStyle = '#33243c'; ctx.fillRect(x - 6, y - 10, 12, 10);
      ctx.fillStyle = '#a987b5'; ctx.fillRect(x - 5, y - 9, 10, 7);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 7, 2, 2); ctx.fillRect(x + 2, y - 7, 2, 2);
      ctx.fillStyle = '#e9b37b'; ctx.fillRect(x + 7, y - 6, 4, 3);
    }
    if (!this.giantFishSeen) {
      const x = sx(752), y = sy(416 + Math.sin(this.time * 2) * 3);
      ctx.fillStyle = 'rgba(255,230,160,0.65)'; ctx.fillRect(x - 5, y, 10, 2);
      if (Math.sin(this.time * 1.2) > 0.94) { ctx.fillStyle = '#f5c95b'; ctx.fillRect(x - 3, y - 5, 6, 4); }
    }
  }

  renderWardrobe(ctx) {
    panel(ctx, 52, 66, 280, 92, { fill: '#352149' });
    drawText(ctx, 'RACCOON WARDROBE  (C TO CLOSE)', this.W / 2, 72, { align: 'center', color: UI.gold });
    ACCESSORIES.forEach((id, i) => {
      const r = { x: 74 + (i % 4) * 58, y: 82 + Math.floor(i / 4) * 30, w: 52, h: 24 };
      button(ctx, r, `${i + 1} ${id.slice(0, 7).toUpperCase()}`, { hovered: false, scale: 1 });
      if (!this.accessories.includes(id)) drawText(ctx, 'LOCKED', r.x + r.w / 2, r.y + 8, { align: 'center', color: '#a999aa' });
      else if (this.equipped === id) drawText(ctx, '*', r.x + r.w - 7, r.y + 2, { color: UI.gold });
    });
  }

  renderSecretRoom(ctx) {
    ctx.fillStyle = '#171025'; ctx.fillRect(42, 34, 300, 150);
    panel(ctx, 54, 42, 276, 132, { fill: '#382451' });
    drawText(ctx, 'THE SECRET TREE ROOM', this.W / 2, 54, { align: 'center', color: UI.gold });
    drawWrapped(ctx, 'A tiny cozy nook full of stars, drawings and birthday wishes. You found the quiet heart of this little world.', this.W / 2, 76, 238, { align: 'center', color: UI.cream, lineHeight: 12 });
    drawText(ctx, '"THIS LITTLE WORLD WAS MADE JUST FOR YOU."', this.W / 2, 132, { align: 'center', color: UI.pink });
    drawText(ctx, 'E / SPACE TO STEP OUT', this.W / 2, 157, { align: 'center', color: '#c8b2da' });
  }

  isInStreet() {
    const p = this.player;
    return p.x > STREET.x1 * 16 && p.x < (STREET.x2 + 1) * 16
      && p.y > STREET.y1 * 16 && p.y < (STREET.y2 + 1) * 16;
  }

  renderLanternHUD(ctx) {
    if (this.lanterns.count === 0 && !this.streetLit && !this.isInStreet()) return;
    panel(ctx, 4, 54, 126, 14, { fill: '#2b1a42' });
    drawTiny(ctx, this.streetLit ? 'LANTERN ST LIT' : `LANTERN ST ${this.lanterns.count}/3`,
      8, 58, { color: this.streetLit ? UI.green : UI.gold });
    for (let i = 0; i < 3; i++) {
      const x = 86 + i * 13;
      const got = this.lanterns.count > i;
      ctx.fillStyle = got ? '#8d3f4b' : '#1a1128';
      ctx.fillRect(x, 57, 10, 8);
      ctx.fillStyle = got ? '#ff8f7a' : '#4d3a5c';
      ctx.fillRect(x + 3, 58, 4, 5);
    }
  }

  renderMinimap(ctx) {
    const x = this.W - 78, y = 4, w = 74, h = 62;
    panel(ctx, x, y, w, h, { fill: '#2a1b40' });
    ctx.drawImage(this.minimapBase, x + 3, y + 3);

    const dot = (tx, ty, size, color) =>
      px(ctx, x + 3 + tx * 1.13 - (size - 1) / 2, y + 3 + ty * 1.13 - (size - 1) / 2, size, size, color);

    for (const item of this.collectibles.items) {
      if (!this.collectibles.collected.has(item.id)) dot(item.tx, item.ty, 3, item.color);
    }
    for (const l of this.lanterns.items) {
      if (!this.lanterns.found.has(l.id)) dot(l.tx, l.ty, 2, this.streetLit ? UI.green : '#ff8f7a');
    }
    for (const stall of STALLS) dot(stall.tx, stall.ty, 2, '#ffd9a0');
    dot(27, 7, 4, this.world.doorOpen ? '#fff3b0' : UI.gold);
    dot(14, 22, 2, UI.pink);
    if (Math.floor(this.time * 3) % 2 === 0) dot(this.player.x / 16, this.player.y / 16, 3, '#ffffff');
    drawTiny(ctx, 'MAP', x + 5, y + h - 9, { color: UI.cream });
    drawTiny(ctx, 'TAB', x + w - 18, y + h - 9, { color: '#c8b2da' });
  }

  renderPrompt(ctx, cam) {
    if (this.dialogue.active) return;
    const prompt = this.getPrompt();
    if (!prompt) return;
    const cx = Math.round(this.player.x - cam.x);
    const cy = Math.round(this.player.y - cam.y - 26);
    const w = tinyWidth(prompt) + 10;
    let x = cx - w / 2;
    x = Math.max(3, Math.min(this.W - w - 3, x));
    ctx.fillStyle = 'rgba(8,4,16,0.92)';
    ctx.fillRect(x - 2, cy - 2, w + 4, 11);
    ctx.fillStyle = UI.border;
    ctx.fillRect(x - 1, cy - 1, w + 2, 9);
    drawTiny(ctx, prompt, x + w / 2, cy, { align: 'center', color: UI.cream });
  }

  renderToast(ctx) {
    if (!this.toast) return;
    const t = this.toast;
    ctx.globalAlpha = Math.min(1, t.timer / 0.5);
    const w = Math.min(this.W - 18, tinyWidth(t.text) + 12);
    const x = this.W / 2 - w / 2;
    panel(ctx, x, 92, w, 15, { fill: '#28163c', border: UI.borderLight });
    drawTiny(ctx, t.text.slice(0, 38), this.W / 2, 97, { align: 'center', color: UI.gold });
    ctx.globalAlpha = 1;
  }

  smallButton(ctx, r, txt, hover) {
    ctx.fillStyle = 'rgba(12,6,22,0.8)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = hover ? UI.borderLight : UI.border;
    ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    drawText(ctx, txt, r.x + r.w / 2, r.y + Math.max(3, (r.h - 8) / 2), {
      scale: r.w < 30 ? 1 : 1.2, align: 'center', color: hover ? '#ffffff' : UI.cream,
    });
  }

  renderTouchControls(ctx) {
    const D = this.dpad;
    ctx.globalAlpha = 0.94;
    for (const key of ['up', 'down', 'left', 'right']) {
      const r = D[key];
      ctx.fillStyle = '#1b102c';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = UI.border;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      const glyph = key === 'up' ? '^' : key === 'down' ? 'v' : key === 'left' ? '<' : '>';
      drawText(ctx, glyph, r.x + (r.w - 10) / 2, r.y + (r.h - 14) / 2, { scale: 2, color: UI.cream, shadow: UI.ink });
    }
    const a = D.act;
    ctx.fillStyle = '#7d4fae';
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = UI.cream;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, 'ACT', a.x + a.w / 2, a.y + a.h / 2 - 4, {
      scale: 1.5, align: 'center', color: '#3d2359',
    });
    ctx.globalAlpha = 1;
  }

  renderStart(ctx) {
    // Night sky with drifting fireflies.
    for (let y = 0; y < this.H; y += 24) {
      const t = y / this.H;
      ctx.fillStyle = `rgb(${26 + t * 18},${16 + t * 12},${48 + t * 20})`;
      ctx.fillRect(0, y, this.W, 25);
    }
    ellipse(ctx, this.W / 2, 96, 120, 64, 'rgba(150,100,200,0.12)');
    for (let i = 0; i < 26; i++) {
      const sx = (i * 71 + this.time * 6) % this.W;
      const sy = 20 + ((i * 37) % 160) + Math.sin(this.time + i) * 3;
      if (Math.sin(this.time * 2 + i * 1.3) > 0) {
        ctx.fillStyle = i % 3 === 0 ? '#f5c95b' : '#c7a4ee';
        ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
      }
    }
    // Little hill.
    ellipse(ctx, this.W / 2, 230, 260, 44, '#1a2b2f');
    ellipse(ctx, this.W / 2, 224, 240, 38, '#234034');

    drawText(ctx, 'LAZY &', this.W / 2, 26, { scale: 3, align: 'center', color: UI.gold, shadow: '#5a2c1c' });
    drawText(ctx, 'THE LITTLE', this.W / 2, 52, { scale: 2, align: 'center', color: UI.cream, shadow: UI.ink });
    drawText(ctx, 'RACCOON', this.W / 2, 70, { scale: 2, align: 'center', color: UI.pink, shadow: UI.ink });

    // Hero raccoon with a gentle bob.
    const sprite = this.art.raccoon.down.idle[Math.abs(Math.floor(this.time * 2)) % 2];
    const bob = Math.floor(Math.sin(this.time * 2) * 2);
    ctx.drawImage(sprite, this.W / 2 - sprite.width / 2, 96 + bob);
    // Sparkle next to it.
    if (Math.sin(this.time * 3) > 0) {
      px(ctx, this.W / 2 + 30, 108, 1, 7, '#fff3b0');
      px(ctx, this.W / 2 + 27, 111, 7, 1, '#fff3b0');
    }

    drawWrapped(ctx, 'A cozy birthday adventure for Lazy  \u00b7  23 November 2010',
      this.W / 2, 126, this.W - 40, { scale: 1.2, align: 'center', color: UI.cream, lineHeight: 15 });

    button(ctx, this.buttons.start, 'BEGIN ADVENTURE', { hovered: this.hover === 'start', scale: 1 });

    textCenter(ctx, 'MOVE: ARROWS/WASD   ACT: E/SPACE   MAP: TAB', this.W / 2, 184,
      { scale: 1.2, color: UI.cream });
    textCenter(ctx, 'F FULLSCREEN  \u00b7  M MUTE  \u00b7  FOR LAZY', this.W / 2, 200,
      { scale: 1.2, color: UI.blue });
  }

  renderPause(ctx) {
    ctx.fillStyle = 'rgba(8,4,16,0.66)';
    ctx.fillRect(0, 0, this.W, this.H);
    panel(ctx, this.W / 2 - 82, 78, 164, 120, { fill: '#352149' });
    drawText(ctx, 'PAUSED', this.W / 2, 90, { scale: 2, align: 'center', color: UI.gold, shadow: UI.ink });
    button(ctx, this.buttons.resume, 'RESUME', { hovered: this.hover === 'resume' });
    button(ctx, this.buttons.restart, 'RESTART', { hovered: this.hover === 'restart' });
    button(ctx, this.buttons.pauseMute, audio.muted ? 'UNMUTE' : 'MUTE', { hovered: this.hover === 'pauseMute' });
  }
}
