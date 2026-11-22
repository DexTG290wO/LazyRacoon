// Procedural audio - Web Audio API only, no external files.
// Nothing is created until the player interacts (start button / keypress).

const NOTE = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);

// Gentle pentatonic-ish loops. Numbers are semitone offsets from A4.
const TRACKS = {
  forest: {
    tempo: 0.34,
    wave: 'triangle',
    volume: 0.055,
    melody: [
      -9, -7, -5, -2, -5, -7, -9, null,
      -7, -5, -2, 0, -2, -5, -7, null,
      -9, -5, -2, 0, 3, 0, -2, null,
      -5, -7, -9, -7, -5, -2, -5, null,
    ],
    bass: [-21, -21, -17, -17, -19, -19, -16, -16],
  },
  party: {
    tempo: 0.2,
    wave: 'square',
    volume: 0.038,
    melody: [
      0, 4, 7, 12, 11, 7, 4, 7,
      9, 12, 16, 12, 11, 9, 7, 4,
      5, 9, 12, 17, 16, 12, 9, 12,
      0, 4, 7, 12, 16, 12, 7, 4,
    ],
    bass: [-24, -24, -17, -17, -19, -19, -22, -22],
  },
};

class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.track = 'forest';
    this.nextNoteTime = 0;
    this.noteIndex = 0;
    this.playing = false;
    this.noiseBuffer = null;
    try {
      this.muted = localStorage.getItem('lr_muted') === '1';
    } catch (e) { /* storage may be blocked */ }
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.85;
    this.musicGain.connect(this.master);

    // Small reusable white-noise buffer for percussive effects.
    const len = Math.floor(this.ctx.sampleRate * 0.4);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.nextNoteTime = this.ctx.currentTime + 0.1;
  }

  setMuted(muted) {
    this.muted = muted;
    try { localStorage.setItem('lr_muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  startMusic(track = 'forest') {
    if (!this.ctx) return;
    if (this.track !== track) {
      this.track = track;
      this.noteIndex = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.playing = true;
  }

  stopMusic() {
    this.playing = false;
  }

  // Call once per frame to schedule music slightly ahead of time.
  update() {
    if (!this.ctx || !this.playing || this.muted) return;
    const cfg = TRACKS[this.track];
    const now = this.ctx.currentTime;
    while (this.nextNoteTime < now + 0.2) {
      const idx = this.noteIndex % cfg.melody.length;
      const n = cfg.melody[idx];
      if (n != null) {
        this.tone(NOTE(n), this.nextNoteTime, cfg.tempo * 0.85, cfg.wave, cfg.volume, this.musicGain);
        // A soft octave-down echo makes the music feel warm and full.
        this.tone(NOTE(n - 12), this.nextNoteTime, cfg.tempo * 0.9, 'sine', cfg.volume * 0.35, this.musicGain);
      }
      const b = cfg.bass[Math.floor(idx / 4) % cfg.bass.length];
      if (idx % 4 === 0 && b != null) {
        this.tone(NOTE(b), this.nextNoteTime, cfg.tempo * 3.2, 'sine', cfg.volume * 0.55, this.musicGain);
      }
      this.nextNoteTime += cfg.tempo;
      this.noteIndex++;
    }
  }

  tone(freq, when, dur, type = 'sine', vol = 0.08, dest = null, slideTo = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), when + dur);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(vol, when + Math.min(0.03, dur * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(dest || this.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  noise(when, dur, vol = 0.08, filterFreq = 1200, filterType = 'lowpass') {
    if (!this.ctx || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'step':
        this.noise(t, 0.045, 0.035, 700 + Math.random() * 400);
        break;
      case 'interact':
        this.tone(NOTE(2), t, 0.09, 'square', 0.06);
        this.tone(NOTE(9), t + 0.06, 0.1, 'square', 0.05);
        break;
      case 'collect':
        [0, 4, 7, 12].forEach((n, i) => this.tone(NOTE(n), t + i * 0.06, 0.16, 'triangle', 0.075));
        break;
      case 'unlock':
        [0, 7, 12, 16, 19].forEach((n, i) => this.tone(NOTE(n), t + i * 0.09, 0.3, 'triangle', 0.07));
        break;
      case 'gift':
        this.noise(t, 0.12, 0.09, 2600, 'highpass');
        this.tone(NOTE(0), t, 0.14, 'square', 0.07);
        this.tone(NOTE(7), t + 0.08, 0.2, 'square', 0.07);
        this.tone(NOTE(12), t + 0.16, 0.35, 'triangle', 0.08);
        break;
      case 'splash':
        this.tone(NOTE(7), t, 0.16, 'sine', 0.045, null, NOTE(-4));
        this.noise(t, 0.12, 0.025, 1600, 'lowpass');
        break;
      case 'bite':
        this.tone(NOTE(12), t, 0.1, 'square', 0.055);
        this.tone(NOTE(16), t + 0.08, 0.12, 'triangle', 0.06);
        break;
      case 'celebrate':
        [0, 4, 7, 12, 7, 12, 16, 19].forEach((n, i) =>
          this.tone(NOTE(n), t + i * 0.1, 0.4, 'square', 0.06));
        [0, 7, 12].forEach((n) => this.tone(NOTE(n - 12), t, 0.9, 'sine', 0.08));
        break;
      case 'deny':
        this.tone(NOTE(-5), t, 0.12, 'square', 0.05);
        this.tone(NOTE(-6), t + 0.1, 0.16, 'square', 0.05);
        break;
      case 'ui':
        this.tone(NOTE(7), t, 0.06, 'square', 0.05);
        break;
      case 'chime':
        [12, 16, 19].forEach((n, i) => this.tone(NOTE(n), t + i * 0.11, 0.5, 'sine', 0.05));
        break;
      default:
        break;
    }
  }
}

export const audio = new GameAudio();
