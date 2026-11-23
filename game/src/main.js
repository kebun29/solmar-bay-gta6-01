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
  if (k === 'a') gameplay.input.a = true;
  if (k === 'd') gameplay.input.d = true;
  if (k === 'arrowleft') gameplay.input.arrowLeft = true;
  if (k === 'arrowright') gameplay.input.arrowRight = true;
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
  if (k === 'a') gameplay.input.a = false;
  if (k === 'd') gameplay.input.d = false;
  if (k === 'arrowleft') gameplay.input.arrowLeft = false;
  if (k === 'arrowright') gameplay.input.arrowRight = false;
  if (k === 'shift') gameplay.input.shift = false;
  if (k === 'control') gameplay.input.ctrl = false;
  if (k === ' ') gameplay.input.space = false;
});

// Iframe-safe 360° Mouse Orbit (Click-and-Drag + Pointer Lock) & Wheel Zoom
let isDragging = false;
let dragMoved = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let downButton = -1;

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

canvas.addEventListener('mousedown', (e) => {
  if (gameplay.mode !== 'play' || gameplay.activeShop || gameplay.shotMode) return;
  sound.unlock();
  isDragging = true;
  dragMoved = 0;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  downButton = e.button;

  if (e.button === 0 && document.pointerLockElement === canvas) {
    gameplay.input.mouseDown = true;
    gameplay.fireWeapon();
  }
});

window.addEventListener('mousemove', (e) => {
  if (gameplay.mode !== 'play' || gameplay.activeShop || gameplay.shotMode) return;
  if (document.pointerLockElement === canvas) {
    gameplay.camYaw -= e.movementX * 0.0042;
    gameplay.camPitch = Math.max(-0.08, Math.min(1.05, gameplay.camPitch + e.movementY * 0.0036));
    gameplay.camIdleTimer = 0;
    return;
  }
  if (isDragging) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    dragMoved += Math.hypot(dx, dy);
    if (dragMoved > 2) {
      gameplay.camYaw -= dx * 0.0052;
      gameplay.camPitch = Math.max(-0.08, Math.min(1.05, gameplay.camPitch + dy * 0.0042));
      gameplay.camIdleTimer = 0;
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (
    isDragging &&
    downButton === 0 &&
    dragMoved <= 2 &&
    gameplay.mode === 'play' &&
    !gameplay.activeShop &&
    !gameplay.shotMode
  ) {
    if (document.pointerLockElement !== canvas) {
      try {
        if (typeof canvas.requestPointerLock === 'function') {
          const maybePromise = canvas.requestPointerLock();
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {});
          }
        }
      } catch {
        // Iframe-safe fallback: click-and-drag remains active
      }
    }
    if (!gameplay.inVehicle) {
      gameplay.fireWeapon();
    }
  }
  isDragging = false;
  downButton = -1;
  if (e.button === 0) gameplay.input.mouseDown = false;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    if (gameplay.mode !== 'play' || gameplay.activeShop || gameplay.shotMode) return;
    e.preventDefault();
    gameplay.camDist = Math.max(4.5, Math.min(14.5, gameplay.camDist + Math.sign(e.deltaY) * 0.75));
    gameplay.camIdleTimer = 0;
  },
  { passive: false }
);

// Main loop
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  gameplay.update(dt);
  const stage = gameplay.getCurrentStage();
  world.update(gameplay.time, gameplay.shotMode ? null : stage ? stage.target : null);
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
