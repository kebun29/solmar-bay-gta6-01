import * as THREE from 'three';
import { World } from './world.js';
import { VFXManager } from './entities.js';
import { SoundEngine } from './audio.js';
import { Gameplay } from './gameplay.js';
import { UIController } from './ui.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.2, 600);

const world = new World(scene, renderer);
const vfx = new VFXManager(scene);
const sound = new SoundEngine();
const gameplay = new Gameplay(scene, world, vfx, sound, camera, renderer);
const ui = new UIController(gameplay, sound);

// Parse ?shot= query
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'cover' || shot === 'night' || shot === 'map' || shot === 'start') {
  gameplay.applyShot(shot);
} else {
  // Normal boot: live Start Screen over animated sunset skyline
  gameplay.applyShot('start');
  gameplay.shotMode = null;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard & Mouse controls
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  sound.unlock();

  if (k === 'escape' || k === 'm') {
    if (gameplay.activeShop) {
      gameplay.closeShop();
      return;
    }
    if (gameplay.mode === 'play') {
      gameplay.mode = 'pause';
      sound.playClick();
    } else if (gameplay.mode === 'pause') {
      gameplay.mode = 'play';
      sound.playClick();
    }
    return;
  }

  if (gameplay.mode === 'pause') {
    if (k === 'q') ui.cyclePauseTab(-1);
    if (k === 'e') ui.cyclePauseTab(1);
    return;
  }

  if (gameplay.mode !== 'play') return;

  if (k === 'e') {
    gameplay.interactNearby();
    return;
  }
  if (gameplay.activeShop) return;

  if (k === 'w' || k === 'arrowup') gameplay.input.w = true;
  if (k === 's' || k === 'arrowdown') gameplay.input.s = true;
  if (k === 'a' || k === 'arrowleft') gameplay.input.a = true;
  if (k === 'd' || k === 'arrowright') gameplay.input.d = true;
  if (k === 'shift') gameplay.input.shift = true;
  if (k === 'control') gameplay.input.ctrl = true;
  if (k === ' ') gameplay.input.space = true;

  if (k === 'f') gameplay.toggleVehicle();
  if (k === 'r') sound.cycleStation();
  if (k >= '1' && k <= '5') gameplay.selectWeapon(Number(k) - 1);
  if (k === 'z') gameplay.triggerCrewAbility(0);
  if (k === 'x') gameplay.triggerCrewAbility(1);
  if (k === 'c') gameplay.triggerCrewAbility(2);
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') gameplay.input.w = false;
  if (k === 's' || k === 'arrowdown') gameplay.input.s = false;
  if (k === 'a' || k === 'arrowleft') gameplay.input.a = false;
  if (k === 'd' || k === 'arrowright') gameplay.input.d = false;
  if (k === 'shift') gameplay.input.shift = false;
  if (k === 'control') gameplay.input.ctrl = false;
  if (k === ' ') gameplay.input.space = false;
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    sound.unlock();
    gameplay.input.mouseDown = true;
    gameplay.fireWeapon();
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) gameplay.input.mouseDown = false;
});

// Main loop
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  gameplay.update(dt);
  world.update(gameplay.time);
  if (!gameplay.shotMode) {
    vfx.update(dt);
  }
  ui.update();
  renderer.render(scene, camera);

  window.__CORALINA_READY = true;
  requestAnimationFrame(tick);
}

ui.update();
renderer.render(scene, camera);
window.__CORALINA_READY = true;
requestAnimationFrame(tick);
