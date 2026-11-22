import { Game } from './game.js?v=14';
import { audio } from './audio.js?v=14';

const canvas = document.getElementById('game');
const loading = document.getElementById('loading');

function resize() {
  const W = canvas.width;
  const H = canvas.height;
  let scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  // Prefer crisp integer scaling on larger screens; allow fractional on tiny ones.
  if (scale >= 1) scale = Math.floor(scale);
  else scale = Math.max(0.35, scale);
  canvas.style.width = Math.round(W * scale) + 'px';
  canvas.style.height = Math.round(H * scale) + 'px';
}

window.addEventListener('resize', resize);
document.addEventListener('fullscreenchange', resize);
resize();

const game = new Game(canvas);

// Audio can only start after a real user gesture - unlock on first interaction.
const unlockOnce = () => {
  audio.unlock();
  window.removeEventListener('pointerdown', unlockOnce);
  window.removeEventListener('keydown', unlockOnce);
};
window.addEventListener('pointerdown', unlockOnce);
window.addEventListener('keydown', unlockOnce);

if (loading) loading.classList.add('hidden');

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt < 0) dt = 0;        // rAF timestamps can predate performance.now()
  if (dt > 0.05) dt = 0.05;  // avoid huge jumps after tab switches
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for debugging in the console.
window.__game = game;
