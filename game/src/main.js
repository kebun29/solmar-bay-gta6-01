// Coralina Bay: Sunset Syndicate — Bootstrap, GameEngine Coordinator & Main Loop
import * as THREE from 'three';
import { SoundEngine } from './audio.js';
import { CameraController } from './camera-controls.js';
import { CityWorld } from './city-world.js';
import { fireWeapon, selectWeapon, triggerCrewAbility } from './combat.js';
import { CAMERA_DEFAULTS, CREW_ABILITIES, WEAPONS, WORLD_BOUNDS, getDistrictAt } from './config.js';
import { closeShop, openNearbyShop, updateNearbyInteractables } from './garage-economy.js';
import { HUDController } from './hud.js';
import { VFXManager } from './lighting-fx.js';
import { MenusAndSaveController, loadSavesFromStorage } from './menus-save.js';
import { applyShowcaseShot, getCurrentStage, updateMissionProgress } from './missions.js';
import { createCharacter, updatePedestrians } from './pedestrians.js';
import { updatePoliceAndTrafficAI } from './police-ai.js';
import {
  createBurningWreck,
  createPatrolBoat,
  createPoliceHelicopter,
  createScooterMesh,
  createVehicleMesh,
  createWindowShooter,
  togglePlayerVehicle,
  updatePlayerVehicle,
} from './vehicles.js';

class GameEngine {
  constructor(scene, world, vfx, sound, camera, cameraCtrl) {
    this.scene = scene;
    this.world = world;
    this.vfx = vfx;
    this.sound = sound;
    this.camera = camera;
    this.cameraCtrl = cameraCtrl;

    this.mode = 'start';
    this.shotMode = null;
    this.pauseTab = 'STATS';
    this.time = 0;

    this.settings = { graphics: 'HIGH', cameraFov: CAMERA_DEFAULTS.fov, timeOfDay: 'sunset' };
    this.nitroTimer = 0;
    this.turboInstalled = false;
    this.nearbyLocation = null;
    this.nearbyVehicle = null;
    this.activeShop = null;
    this.lastGunshotPos = null;
    this.lastGunshotTime = -99;
    this.impactSfxCd = 0;

    this.inVehicle = true;
    this.health = 88;
    this.armour = 64;
    this.cash = 31800;
    this.rank = 6;
    this.rankTitle = 'KINGPIN';
    this.rp = 6420;
    this.rpNext = 8000;
    this.clockText = '17:42';
    this.wantedStars = 4;
    this.activeUnitCount = 6;
    this.alertText = 'CBPD AIR SUPPORT';
    this.dispatchLine = '"CBPD Dispatch: Coral V12 tearing north on Marina Blvd — box them before the Bay Bridge!"';
    this.dialogue = {
      speaker: 'VALERIA REYES',
      role: 'broker',
      text: 'CBPD sealed the bridge approach! Weave past the cruisers on Marina Boulevard and punch through!',
      timer: 14,
    };

    this.weapons = WEAPONS.map((w) => ({ ...w }));
    this.activeWeapon = 2;
    this.fireTimer = 0;
    this.crew = CREW_ABILITIES.map((c) => ({ ...c }));

    this.missionIdx = 1;
    this.stageIdx = 1;
    this.waypoint = { x: 45, z: -150, label: 'ISLA DORADA BRIDGE' };

    this.career = {
      missionsCleared: 9,
      pursuitsEscaped: 21,
      topSpeedKmh: 214,
      takedowns: 63,
      vehiclesBoosted: 34,
      districtsFriendly: 4,
      crewAssists: 27,
      playTime: '09h 18m',
    };
    this.saves = loadSavesFromStorage();

    this.vehicles = [];
    this.cops = [];
    this.playerChar = createCharacter('player');
    this.scene.add(this.playerChar.mesh);

    this.input = {
      w: false, a: false, s: false, d: false,
      arrowLeft: false, arrowRight: false,
      shift: false, space: false, ctrl: false, mouseDown: false,
    };

    this._spawnWorldEntities();
  }

  _spawnWorldEntities() {
    // 0: Hero CORSAIR V12
    const hero = createVehicleMesh('hero', 0xf43f5e);
    hero.mesh.position.set(1.5, 0, 12);
    this.scene.add(hero.mesh);
    this.heroVehicle = { ...hero, type: 'hero', name: 'CORSAIR V12', heading: Math.PI, speed: 0, maxSpeed: 50, damagePct: 0, radius: 1.8 };
    this.currentVehicle = this.heroVehicle;
    this.vehicles.push(this.heroVehicle);

    // 1..5: CBPD Interceptors
    const callsigns = ['INTERCEPT-1', 'TACTICAL-7', 'INTERCEPT-4', 'INTERCEPT-9', 'INTERCEPT-6'];
    callsigns.forEach((cs, idx) => {
      const copCar = createVehicleMesh('police');
      copCar.mesh.position.set(-4 + idx * 2.2, 0, -35 - idx * 14);
      this.scene.add(copCar.mesh);
      const vObj = { ...copCar, type: 'police', name: 'CBPD INTERCEPTOR', callsign: cs, tactic: 'IN PURSUIT', heading: Math.PI, speed: 0, maxSpeed: 42, damagePct: 0, radius: 1.8 };
      this.vehicles.push(vObj);

      if (idx === 1) {
        const shooter = createWindowShooter(1);
        shooter.group.position.set(0.55, 1.18, 0.15);
        shooter.group.visible = false;
        copCar.mesh.add(shooter.group);
        this.windowShooter = { vehicle: vObj, shooter };
      }
    });

    // 6..9: Civilian traffic
    const civColors = [0x06b6d4, 0xf59e0b, 0x10b981, 0x8b5cf6];
    const civNames = ['SOLARIS GT', 'PALM COUPÉ', 'BAY CRUISER', 'TROPICA SEDAN'];
    civColors.forEach((col, i) => {
      const civ = createVehicleMesh('civilian', col);
      const laneX = i % 2 === 0 ? 4.2 : -4.2;
      civ.mesh.position.set(laneX, 0, -80 + i * 52);
      this.scene.add(civ.mesh);
      this.vehicles.push({
        ...civ,
        type: 'civilian',
        name: civNames[i],
        heading: i % 2 === 0 ? Math.PI : 0,
        speed: 12,
        cruiseSpeed: 12 + i * 1.5,
        maxSpeed: 36,
        damagePct: 0,
        radius: 1.7,
      });
    });

    // Parked coastal scooter
    this.parkedScooter = createScooterMesh(0x22d3ee);
    this.parkedScooter.mesh.position.set(-12.5, 0, 26);
    this.scene.add(this.parkedScooter.mesh);

    // Burning wreck prop (shown in cover chase)
    this.burningWreck = createBurningWreck();
    this.burningWreck.visible = false;
    this.scene.add(this.burningWreck);

    // Police helicopter EAGLE-2 & coastal patrol boat
    this.heli = createPoliceHelicopter();
    this.heli.mesh.position.set(12, 18, -42);
    this.scene.add(this.heli.mesh);

    this.boat = createPatrolBoat();
    this.boat.position.set(50, -0.1, -48);
    this.scene.add(this.boat);

    // 3 CBPD SWAT officers
    const swatNames = ['SWAT-2', 'SWAT-5', 'SWAT-8'];
    swatNames.forEach((cs, i) => {
      const ch = createCharacter('cop');
      ch.mesh.position.set(-48 - i * 4, 0, 54 + i * 5);
      this.scene.add(ch.mesh);
      this.cops.push({ char: ch, callsign: cs, tactic: i === 1 ? 'FLANKING' : 'SWAT PUSH', hp: 100, downed: false, fireCd: 1.0 });
    });
  }

  getCurrentDistrict() {
    const p = this.getPlayerPos();
    return getDistrictAt(p.x, p.z);
  }

  getPlayerPos() {
    return this.inVehicle && this.currentVehicle ? this.currentVehicle.mesh.position : this.playerChar.mesh.position;
  }

  getPlayerHeading() {
    return this.inVehicle && this.currentVehicle ? this.currentVehicle.heading : this.playerChar.mesh.rotation.y;
  }

  collidesBuilding(x, z, r) {
    for (const c of this.world.colliders) {
      if (Math.abs(x - c.x) < c.hw + r && Math.abs(z - c.z) < c.hd + r) return true;
    }
    return false;
  }

  startNewOrContinue(isNew = false) {
    this.shotMode = null;
    this.mode = 'play';
    this.activeShop = null;
    this.vfx.clear();
    if (this.burningWreck) this.burningWreck.visible = false;
    if (this.windowShooter) this.windowShooter.shooter.group.visible = false;

    if (isNew) {
      this.cash = 12500;
      this.rank = 1;
      this.rankTitle = 'RUNNER';
      this.rp = 0;
      this.rpNext = 1200;
      this.wantedStars = 0;
      this.missionIdx = 0;
      this.stageIdx = 0;
      this.world.setMode('midday');
      this.clockText = '13:15';
      this.inVehicle = false;
      this.playerChar.mesh.visible = true;
      this.playerChar.mesh.position.set(-9.2, 0, 12.2);
      this.playerChar.mesh.rotation.y = Math.PI;
      this.heroVehicle.mesh.position.set(-5.8, 0, 10.6);
      this.heroVehicle.heading = Math.PI;
      this.heroVehicle.mesh.rotation.y = Math.PI;
      this.heroVehicle.speed = 0;
      this.cameraCtrl.onExitVehicle(Math.PI);
    } else {
      this.world.setMode('sunset');
      this.clockText = '17:42';
      this.inVehicle = true;
      this.currentVehicle = this.heroVehicle;
      this.playerChar.mesh.visible = false;
      this.heroVehicle.mesh.position.set(1.2, 0, 14);
      this.heroVehicle.heading = Math.PI;
      this.heroVehicle.mesh.rotation.y = Math.PI;
      this.heroVehicle.speed = 14;
      this.wantedStars = 2;
      this.cameraCtrl.onEnterVehicle(Math.PI);
    }
    this.sound.unlock();
    this.sound.playClick();
  }

  update(dt) {
    this.time += dt;

    // Keep rotors & lightbars alive in showcase & start modes
    if (this.heli) {
      this.heli.rotorGroup.rotation.y += dt * 26;
      this.heli.tailRotor.rotation.x += dt * 32;
    }
    if (this.shotMode) return;

    if (this.mode === 'start') {
      const angle = Math.sin(this.time * 0.12) * 0.22;
      this.camera.position.set(34 + Math.sin(angle) * 8, 16.5 + Math.cos(this.time * 0.18) * 1.0, 16 - Math.cos(angle) * 5);
      this.camera.lookAt(-12, 15.5, -108);
      return;
    }

    if (this.mode === 'pause' || this.activeShop) return;

    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.nitroTimer = Math.max(0, this.nitroTimer - dt);
    this.impactSfxCd = Math.max(0, this.impactSfxCd - dt);
    if (this.dialogue && this.dialogue.timer > 0) this.dialogue.timer = Math.max(0, this.dialogue.timer - dt);

    for (const ab of this.crew) {
      if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt);
    }
    if (this.playerChar.flashTimer > 0) {
      this.playerChar.flashTimer -= dt;
      if (this.playerChar.flashTimer <= 0) this.playerChar.muzzleFlash.material.opacity = 0;
    }

    const drivingHero = this.inVehicle && this.currentVehicle === this.heroVehicle;
    const shiftNitro = drivingHero && this.input.shift && (this.input.w || Math.abs(this.heroVehicle.speed) > 4);
    const boosting = drivingHero && (this.nitroTimer > 0 || shiftNitro);
    if (this.heroVehicle?.nitroGroup) {
      this.heroVehicle.nitroGroup.visible = boosting;
    }

    if (this.inVehicle && this.currentVehicle) {
      updatePlayerVehicle(this, dt, boosting);
      this.cameraCtrl.updateVehicleCamera(dt, this.currentVehicle, boosting);
    } else {
      this._updateOnFootPlayer(dt);
      this.cameraCtrl.updateOnFootCamera(dt, this.playerChar.mesh, this.input.mouseDown);
    }

    if (this.input.mouseDown && !this.inVehicle) {
      fireWeapon(this);
    }

    const pPos = this.getPlayerPos();
    const pDirZ = Math.cos(this.getPlayerHeading()) >= 0 ? 1 : -1;

    updateNearbyInteractables(this);
    updatePoliceAndTrafficAI(this, dt, pPos, pDirZ);
    updatePedestrians(this, dt, pPos, pDirZ);
    updateMissionProgress(this, pPos);

    const kmh = this.inVehicle && this.currentVehicle ? Math.abs(this.currentVehicle.speed) * 3.6 : 0;
    this.sound.update(dt, { inVehicle: this.inVehicle, speedKmh: kmh, wantedStars: this.wantedStars, active: true });
  }

  _updateOnFootPlayer(dt) {
    if (this.input.arrowLeft) { this.cameraCtrl.yaw += 2.2 * dt; this.cameraCtrl.idleTimer = 0; }
    if (this.input.arrowRight) { this.cameraCtrl.yaw -= 2.2 * dt; this.cameraCtrl.idleTimer = 0; }

    const speed = this.input.shift ? 8.8 : 5.4;
    const fwdIn = (this.input.w ? 1 : 0) - (this.input.s ? 1 : 0);
    const rightIn = (this.input.d ? 1 : 0) - (this.input.a ? 1 : 0);
    const yaw = this.cameraCtrl.yaw;

    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const rightX = -Math.cos(yaw);
    const rightZ = Math.sin(yaw);

    let mx = fwdX * fwdIn + rightX * rightIn;
    let mz = fwdZ * fwdIn + rightZ * rightIn;
    const mag = Math.hypot(mx, mz);

    if (mag > 0.01) {
      mx /= mag;
      mz /= mag;
      const nx = this.playerChar.mesh.position.x + mx * speed * dt;
      const nz = this.playerChar.mesh.position.z + mz * speed * dt;
      if (!this.collidesBuilding(nx, nz, 0.65)) {
        this.playerChar.mesh.position.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, nx));
        this.playerChar.mesh.position.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, nz));
      }
      const targetAngle = this.cameraCtrl.aiming || this.input.mouseDown ? yaw : Math.atan2(mx, mz);
      this.playerChar.mesh.rotation.y = targetAngle;
      this.playerChar.setPose(this.cameraCtrl.aiming || this.input.mouseDown ? 'aim' : this.input.shift ? 'run' : 'walk', this.time);
    } else {
      if (this.cameraCtrl.aiming || this.input.mouseDown) {
        this.playerChar.mesh.rotation.y = yaw;
        this.playerChar.setPose('aim', this.time);
      } else {
        this.playerChar.setPose(this.input.ctrl ? 'crouch' : 'idle', this.time);
      }
    }
  }
}

// ================= BOOTSTRAP =================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CAMERA_DEFAULTS.fov, window.innerWidth / window.innerHeight, 0.2, 650);

const world = new CityWorld(scene, renderer);
const vfx = new VFXManager(scene);
const sound = new SoundEngine();
const cameraCtrl = new CameraController(camera, canvas, sound);
const game = new GameEngine(scene, world, vfx, sound, camera, cameraCtrl);
const hud = new HUDController(game, sound);
const menus = new MenusAndSaveController(game, sound);

// Expose clean debug hook for playability verification
window.__CORALINA_GAME = game;

cameraCtrl.bind({
  canControl: () => game.mode === 'play' && !game.activeShop && !game.shotMode,
  onFire: (down) => {
    game.input.mouseDown = down;
    if (down && !game.inVehicle) fireWeapon(game);
  },
  onPointerUnlockPause: () => {
    if (game.mode === 'play' && !game.activeShop && !game.shotMode) {
      game.mode = 'pause';
      sound.playClick();
    }
  },
});

// Parse ?shot= query
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'cover' || shot === 'night' || shot === 'midday' || shot === 'start') {
  applyShowcaseShot(game, shot);
} else {
  applyShowcaseShot(game, 'start');
  game.shotMode = null;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  sound.unlock();

  if (k === 'escape' || k === 'm') {
    if (game.activeShop) {
      closeShop(game);
      return;
    }
    if (game.mode === 'play') {
      game.mode = 'pause';
      cameraCtrl.exitLock();
      sound.playClick();
    } else if (game.mode === 'pause') {
      game.mode = 'play';
      sound.playClick();
    }
    return;
  }

  if (game.mode === 'pause') {
    if (k === 'q') menus.cyclePauseTab(-1);
    if (k === 'e') menus.cyclePauseTab(1);
    return;
  }

  if (game.mode !== 'play') return;

  if (k === 'e') {
    if (game.activeShop) closeShop(game);
    else openNearbyShop(game);
    return;
  }
  if (game.activeShop) return;

  if (k === 'w' || k === 'arrowup') game.input.w = true;
  if (k === 's' || k === 'arrowdown') game.input.s = true;
  if (k === 'a') game.input.a = true;
  if (k === 'd') game.input.d = true;
  if (k === 'arrowleft') game.input.arrowLeft = true;
  if (k === 'arrowright') game.input.arrowRight = true;
  if (k === 'shift') game.input.shift = true;
  if (k === 'control') game.input.ctrl = true;
  if (k === ' ') game.input.space = true;

  if (k === 'f') togglePlayerVehicle(game);
  if (k === 'r') sound.cycleStation();
  if (k >= '1' && k <= '5') selectWeapon(game, Number(k) - 1);
  if (k === 'z') triggerCrewAbility(game, 0);
  if (k === 'x') triggerCrewAbility(game, 1);
  if (k === 'c') triggerCrewAbility(game, 2);
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') game.input.w = false;
  if (k === 's' || k === 'arrowdown') game.input.s = false;
  if (k === 'a') game.input.a = false;
  if (k === 'd') game.input.d = false;
  if (k === 'arrowleft') game.input.arrowLeft = false;
  if (k === 'arrowright') game.input.arrowRight = false;
  if (k === 'shift') game.input.shift = false;
  if (k === 'control') game.input.ctrl = false;
  if (k === ' ') game.input.space = false;
});

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  game.update(dt);
  const stage = getCurrentStage(game);
  world.update(game.time, game.shotMode ? null : stage ? stage.target : null);
  if (!game.shotMode) vfx.update(dt);
  hud.update();
  menus.update();
  renderer.render(scene, camera);

  window.__CORALINA_READY = true;
  requestAnimationFrame(tick);
}

hud.update();
menus.update();
renderer.render(scene, camera);
window.__CORALINA_READY = true;
requestAnimationFrame(tick);
