// Coralina Bay: Sunset Syndicate — Bootstrap, GameEngine Coordinator & Main Loop
import * as THREE from 'three';
import { SoundEngine } from './core/audio.js';
import { CameraController } from './core/camera-controls.js';
import { CAMERA_DEFAULTS, CREW_ABILITIES, WEAPONS, WORLD_BOUNDS, getDistrictAt } from './core/config.js';
import { createCharacter, updatePedestrians } from './entities/pedestrians.js';
import { updatePoliceAndTrafficAI } from './entities/police-ai.js';
import { createBurningWreck, createPatrolBoat, createPoliceHelicopter, createScooterMesh, createVehicleMesh, createWindowShooter, togglePlayerVehicle, updatePlayerVehicle } from './entities/vehicles.js';
import { fireWeapon, selectWeapon, triggerCrewAbility } from './gameplay/combat.js';
import { closeShop, openNearbyShop, updateNearbyInteractables } from './gameplay/garage-economy.js';
import { applyShowcaseShot, getCurrentStage, updateMissionProgress } from './gameplay/missions.js';
import { HUDController } from './ui/hud.js';
import { MenusAndSaveController, loadSavesFromStorage } from './ui/menus-save.js';
import { CityWorld } from './world/city-world.js';
import { VFXManager } from './world/lighting-fx.js';

class GameEngine {
  constructor(scene, world, vfx, sound, camera, cameraCtrl) {
    Object.assign(this, {
      scene, world, vfx, sound, camera, cameraCtrl, mode: 'start', shotMode: null, pauseTab: 'STATS', time: 0,
      settings: { graphics: 'HIGH', cameraFov: CAMERA_DEFAULTS.fov, timeOfDay: 'sunset' },
      nitroTimer: 0, turboInstalled: false, nearbyLocation: null, nearbyVehicle: null, activeShop: null,
      lastGunshotPos: null, lastGunshotTime: -99, impactSfxCd: 0, inVehicle: true, health: 88, armour: 64,
      cash: 31800, rank: 6, rankTitle: 'KINGPIN', rp: 6420, rpNext: 8000, clockText: '17:42', wantedStars: 4,
      activeUnitCount: 6, alertText: 'CBPD AIR SUPPORT',
      dialogue: { speaker: 'VALERIA REYES', role: 'broker', text: 'CBPD sealed the bridge approach — punch through Marina Boulevard!', timer: 12 },
      weapons: WEAPONS.map((w) => ({ ...w })), activeWeapon: 2, fireTimer: 0, crew: CREW_ABILITIES.map((c) => ({ ...c })),
      missionIdx: 1, stageIdx: 1, waypoint: { x: 45, z: -150, label: 'ISLA DORADA BRIDGE' },
      career: { missionsCleared: 9, pursuitsEscaped: 21, topSpeedKmh: 214, takedowns: 63, vehiclesBoosted: 34, districtsFriendly: 4, crewAssists: 27, playTime: '09h 18m' },
      saves: loadSavesFromStorage(), vehicles: [], cops: [],
      input: { w: false, a: false, s: false, d: false, arrowLeft: false, arrowRight: false, shift: false, space: false, ctrl: false, mouseDown: false },
    });
    this.playerChar = createCharacter('player'); scene.add(this.playerChar.mesh);
    this._spawnWorldEntities();
  }

  _spawnWorldEntities() {
    const hero = createVehicleMesh('hero', 0xf43f5e); hero.mesh.position.set(1.5, 0, 12); this.scene.add(hero.mesh);
    this.heroVehicle = { ...hero, type: 'hero', name: 'CORSAIR V12', heading: Math.PI, speed: 0, maxSpeed: 50, damagePct: 0, radius: 1.8 };
    this.currentVehicle = this.heroVehicle; this.vehicles.push(this.heroVehicle);

    ['INTERCEPT-1', 'TACTICAL-7', 'INTERCEPT-4', 'INTERCEPT-9', 'INTERCEPT-6'].forEach((cs, i) => {
      const cop = createVehicleMesh('police'); cop.mesh.position.set(-4 + i * 2.2, 0, -35 - i * 14); this.scene.add(cop.mesh);
      const vObj = { ...cop, type: 'police', name: 'CBPD INTERCEPTOR', callsign: cs, tactic: 'BOXING', heading: Math.PI, speed: 0, maxSpeed: 42, damagePct: 0, radius: 1.8 };
      this.vehicles.push(vObj);
      if (i === 1) { const sh = createWindowShooter(1); sh.group.position.set(0.55, 1.18, 0.15); sh.group.visible = false; cop.mesh.add(sh.group); this.windowShooter = { vehicle: vObj, shooter: sh }; }
    });
    [['SOLARIS GT', 0x06b6d4], ['PALM COUPÉ', 0xf59e0b], ['BAY CRUISER', 0x10b981], ['TROPICA SEDAN', 0x8b5cf6]].forEach(([name, col], i) => {
      const civ = createVehicleMesh('civilian', col); civ.mesh.position.set(i % 2 === 0 ? 4.2 : -4.2, 0, -80 + i * 52); this.scene.add(civ.mesh);
      this.vehicles.push({ ...civ, type: 'civilian', name, heading: i % 2 === 0 ? Math.PI : 0, speed: 12, cruiseSpeed: 12 + i * 1.5, maxSpeed: 36, damagePct: 0, radius: 1.7 });
    });
    this.parkedScooter = createScooterMesh(0x22d3ee); this.parkedScooter.mesh.position.set(-12.5, 0, 26); this.scene.add(this.parkedScooter.mesh);
    this.burningWreck = createBurningWreck(); this.burningWreck.visible = false; this.scene.add(this.burningWreck);
    this.heli = createPoliceHelicopter(); this.heli.mesh.position.set(12, 18, -42); this.scene.add(this.heli.mesh);
    this.boat = createPatrolBoat(); this.boat.position.set(50, -0.1, -48); this.scene.add(this.boat);
    ['SWAT-2', 'SWAT-5', 'SWAT-8'].forEach((cs, i) => {
      const ch = createCharacter('cop'); ch.mesh.position.set(-48 - i * 4, 0, 54 + i * 5); this.scene.add(ch.mesh);
      this.cops.push({ char: ch, callsign: cs, tactic: i === 1 ? 'FLANKING' : 'SWAT PUSH', hp: 100, downed: false, fireCd: 1 });
    });
  }

  getCurrentDistrict() { const p = this.getPlayerPos(); return getDistrictAt(p.x, p.z); }
  getPlayerPos() { return this.inVehicle && this.currentVehicle ? this.currentVehicle.mesh.position : this.playerChar.mesh.position; }
  getPlayerHeading() { return this.inVehicle && this.currentVehicle ? this.currentVehicle.heading : this.playerChar.mesh.rotation.y; }
  collidesBuilding(x, z, r) { return this.world.colliders.some((c) => Math.abs(x - c.x) < c.hw + r && Math.abs(z - c.z) < c.hd + r); }

  startNewOrContinue(isNew = false) {
    this.shotMode = null; this.mode = 'play'; this.activeShop = null; this.vfx.clear();
    if (this.burningWreck) this.burningWreck.visible = false;
    if (this.windowShooter) this.windowShooter.shooter.group.visible = false;
    if (isNew) {
      Object.assign(this, { cash: 12500, rank: 1, rankTitle: 'RUNNER', rp: 0, rpNext: 1200, wantedStars: 0, missionIdx: 0, stageIdx: 0, clockText: '13:15', inVehicle: false });
      this.world.setMode('midday'); this.playerChar.mesh.visible = true;
      this.playerChar.mesh.position.set(-9.2, 0, 12.2); this.playerChar.mesh.rotation.y = Math.PI;
      this.heroVehicle.mesh.position.set(-5.8, 0, 10.6); this.heroVehicle.heading = this.heroVehicle.mesh.rotation.y = Math.PI; this.heroVehicle.speed = 0;
      this.cameraCtrl.onExitVehicle(Math.PI);
    } else {
      this.world.setMode('sunset'); this.clockText = '17:42'; this.inVehicle = true; this.currentVehicle = this.heroVehicle;
      this.playerChar.mesh.visible = false; this.heroVehicle.mesh.position.set(1.2, 0, 14);
      this.heroVehicle.heading = this.heroVehicle.mesh.rotation.y = Math.PI; this.heroVehicle.speed = 14;
      this.wantedStars = 2; this.cameraCtrl.onEnterVehicle(Math.PI);
    }
    this.sound.unlock(); this.sound.playClick();
  }

  update(dt) {
    this.time += dt;
    if (this.heli) { this.heli.rotorGroup.rotation.y += dt * 26; this.heli.tailRotor.rotation.x += dt * 32; }
    if (this.shotMode) return;
    if (this.mode === 'start') {
      const a = Math.sin(this.time * 0.12) * 0.22;
      this.camera.position.set(34 + Math.sin(a) * 8, 16.5 + Math.cos(this.time * 0.18), 16 - Math.cos(a) * 5);
      this.camera.lookAt(-12, 15.5, -108); return;
    }
    if (this.mode === 'pause' || this.activeShop) return;

    this.fireTimer = Math.max(0, this.fireTimer - dt); this.nitroTimer = Math.max(0, this.nitroTimer - dt); this.impactSfxCd = Math.max(0, this.impactSfxCd - dt);
    if (this.dialogue?.timer > 0) this.dialogue.timer = Math.max(0, this.dialogue.timer - dt);
    this.crew.forEach((ab) => { if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt); });
    if (this.playerChar.flashTimer > 0 && (this.playerChar.flashTimer -= dt) <= 0) this.playerChar.muzzleFlash.material.opacity = 0;

    const drvHero = this.inVehicle && this.currentVehicle === this.heroVehicle;
    const boost = drvHero && (this.nitroTimer > 0 || (this.input.shift && (this.input.w || Math.abs(this.heroVehicle.speed) > 4)));
    if (this.heroVehicle?.nitroGroup) this.heroVehicle.nitroGroup.visible = boost;

    if (this.inVehicle && this.currentVehicle) { updatePlayerVehicle(this, dt, boost); this.cameraCtrl.updateVehicleCamera(dt, this.currentVehicle, boost); }
    else { this._updateOnFootPlayer(dt); this.cameraCtrl.updateOnFootCamera(dt, this.playerChar.mesh, this.input.mouseDown); }
    if (this.input.mouseDown && !this.inVehicle) fireWeapon(this);

    const pPos = this.getPlayerPos(), pDirZ = Math.cos(this.getPlayerHeading()) >= 0 ? 1 : -1;
    updateNearbyInteractables(this); updatePoliceAndTrafficAI(this, dt, pPos, pDirZ);
    updatePedestrians(this, dt, pPos, pDirZ); updateMissionProgress(this, pPos);
    this.sound.update(dt, { inVehicle: this.inVehicle, speedKmh: this.inVehicle && this.currentVehicle ? Math.abs(this.currentVehicle.speed) * 3.6 : 0, wantedStars: this.wantedStars, active: true });
  }

  _updateOnFootPlayer(dt) {
    if (this.input.arrowLeft) { this.cameraCtrl.yaw += 2.2 * dt; this.cameraCtrl.idleTimer = 0; }
    if (this.input.arrowRight) { this.cameraCtrl.yaw -= 2.2 * dt; this.cameraCtrl.idleTimer = 0; }
    const spd = this.input.shift ? 8.8 : 5.4, fi = (this.input.w ? 1 : 0) - (this.input.s ? 1 : 0), ri = (this.input.d ? 1 : 0) - (this.input.a ? 1 : 0), yaw = this.cameraCtrl.yaw, p = this.playerChar.mesh;
    let mx = Math.sin(yaw) * fi - Math.cos(yaw) * ri, mz = Math.cos(yaw) * fi + Math.sin(yaw) * ri, mag = Math.hypot(mx, mz);
    if (mag > 0.01) {
      const nx = p.position.x + (mx / mag) * spd * dt, nz = p.position.z + (mz / mag) * spd * dt;
      if (!this.collidesBuilding(nx, nz, 0.65)) { p.position.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, nx)); p.position.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, nz)); }
      p.rotation.y = this.cameraCtrl.aiming || this.input.mouseDown ? yaw : Math.atan2(mx, mz);
      this.playerChar.setPose(this.cameraCtrl.aiming || this.input.mouseDown ? 'aim' : this.input.shift ? 'run' : 'walk', this.time);
    } else if (this.cameraCtrl.aiming || this.input.mouseDown) { p.rotation.y = yaw; this.playerChar.setPose('aim', this.time); }
    else this.playerChar.setPose(this.input.ctrl ? 'crouch' : 'idle', this.time);
  }
}

const canvas = document.getElementById('game-canvas'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(CAMERA_DEFAULTS.fov, window.innerWidth / window.innerHeight, 0.2, 650);
const world = new CityWorld(scene, renderer), vfx = new VFXManager(scene), sound = new SoundEngine(), cameraCtrl = new CameraController(camera, canvas, sound);
const game = new GameEngine(scene, world, vfx, sound, camera, cameraCtrl), hud = new HUDController(game, sound), menus = new MenusAndSaveController(game, sound);
window.__CORALINA_GAME = game;
cameraCtrl.bind({ canControl: () => game.mode === 'play' && !game.activeShop && !game.shotMode, onFire: (d) => { game.input.mouseDown = d; if (d && !game.inVehicle) fireWeapon(game); }, onPointerUnlockPause: () => { if (game.mode === 'play' && !game.activeShop && !game.shotMode) { game.mode = 'pause'; sound.playClick(); } } });
const shot = new URLSearchParams(window.location.search).get('shot');
if (['cover', 'night', 'midday', 'start'].includes(shot)) applyShowcaseShot(game, shot); else { applyShowcaseShot(game, 'start'); game.shotMode = null; }
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
const keyMap = { w: 'w', arrowup: 'w', s: 's', arrowdown: 's', a: 'a', d: 'd', arrowleft: 'arrowLeft', arrowright: 'arrowRight', shift: 'shift', control: 'ctrl', ' ': 'space' };
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(); sound.unlock();
  if (k === 'escape' || k === 'm') { if (game.activeShop) return closeShop(game); if (game.mode === 'play') { game.mode = 'pause'; cameraCtrl.exitLock(); sound.playClick(); } else if (game.mode === 'pause') { game.mode = 'play'; sound.playClick(); } return; }
  if (game.mode === 'pause') { if (k === 'q') menus.cyclePauseTab(-1); if (k === 'e') menus.cyclePauseTab(1); return; }
  if (game.mode !== 'play') return;
  if (k === 'e') return game.activeShop ? closeShop(game) : openNearbyShop(game);
  if (game.activeShop) return;
  if (keyMap[k]) game.input[keyMap[k]] = true;
  if (k === 'f') togglePlayerVehicle(game); if (k === 'r') sound.cycleStation();
  if (k >= '1' && k <= '5') selectWeapon(game, Number(k) - 1);
  if (k === 'z') triggerCrewAbility(game, 0); if (k === 'x') triggerCrewAbility(game, 1); if (k === 'c') triggerCrewAbility(game, 2);
});
window.addEventListener('keyup', (e) => { const f = keyMap[e.key.toLowerCase()]; if (f) game.input[f] = false; });
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  game.update(dt); world.update(game.time, game.shotMode ? null : getCurrentStage(game)?.target || null);
  if (!game.shotMode) vfx.update(dt);
  hud.update(); menus.update(); renderer.render(scene, camera); window.__CORALINA_READY = true; requestAnimationFrame(tick);
}
hud.update(); menus.update(); renderer.render(scene, camera); window.__CORALINA_READY = true; requestAnimationFrame(tick);
