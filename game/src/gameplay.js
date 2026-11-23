import * as THREE from 'three';
import { getDistrictAt } from './world.js';
import {
  createCharacter,
  createPatrolBoat,
  createPoliceHelicopter,
  createVehicleMesh,
} from './entities.js';

export const WEAPONS = [
  { id: 0, key: '1', name: 'FISTS', ammo: '∞', maxAmmo: '∞', damage: 24, cooldown: 0.35, range: 3.0 },
  { id: 1, key: '2', name: '9MM VIPER', ammo: 15, maxAmmo: 90, damage: 28, cooldown: 0.24, range: 45 },
  { id: 2, key: '3', name: 'KESTREL SMG', ammo: 32, maxAmmo: 160, damage: 18, cooldown: 0.11, range: 38 },
  { id: 3, key: '4', name: 'BREAKER 12G', ammo: 8, maxAmmo: 32, damage: 55, cooldown: 0.65, range: 22 },
  { id: 4, key: '5', name: 'APEX CARBINE', ammo: 30, maxAmmo: 120, damage: 34, cooldown: 0.14, range: 60 },
];

export const CREW_ABILITIES = [
  { key: 'Z', id: 'ghost', name: 'GHOST SIGNAL', crew: 'Nadia · Netrunner', accent: '#38bdf8', maxCd: 24, cd: 0 },
  { key: 'X', id: 'turbo', name: 'TURBO OVERDRIVE', crew: 'Tomas · Tuner', accent: '#f97316', maxCd: 18, cd: 0 },
  { key: 'C', id: 'smoke', name: 'SMOKE VEIL', crew: 'Ines · Fixer', accent: '#a855f7', maxCd: 22, cd: 0 },
];

export const MISSIONS = [
  {
    num: 1,
    title: 'HARBOR RUN',
    stages: [
      { title: 'BOOST THE VELOCE GT-S', obj: 'Steal the getaway coupe along Paloma Strip', next: 'NEXT: REACH CALYPSO DOCKS', target: { x: 2, z: 95 } },
      { title: 'LOSE THE PATROL', obj: 'Escape SBPD pursuit into Lantern Quay', next: 'NEXT: MEET SORA AT THE QUAY', target: { x: -40, z: 60 } },
    ],
  },
  {
    num: 3,
    title: 'COASTAL BREAKOUT',
    stages: [
      { title: 'INTERCEPT THE COURIER', obj: 'Track the syndicate sedan on Paloma Strip', next: 'NEXT: SECURE THE LEDGER', target: { x: 2, z: -60 } },
      { title: 'SECURE THE LEDGER', obj: 'Grab the encrypted ledger from the plaza', next: 'NEXT: OUTRUN THE BLOCKADE', target: { x: -12, z: -30 } },
      { title: 'OUTRUN THE BLOCKADE', obj: 'Break past Paloma Strip to Lantern Quay', next: 'NEXT: DROP THE LEDGER AT PIER 4', target: { x: -38, z: 58 } },
      { title: 'DELIVER TO PIER 4', obj: 'Deliver the ledger to Calypso Docks', next: 'NEXT: MISSION COMPLETE', target: { x: 10, z: 125 } },
    ],
  },
  {
    num: 4,
    title: 'LANTERN AMBUSH',
    stages: [
      { title: 'ENTER LANTERN QUAY', obj: 'Meet Nadia inside the Night Market', next: 'NEXT: CLEAR THE NIGHT MARKET', target: { x: -42, z: 60 } },
      { title: 'CLEAR THE NIGHT MARKET', obj: 'Neutralize SBPD strike team around Lantern Quay', next: 'NEXT: ESCAPE THROUGH CALYPSO DOCKS', target: { x: -46, z: 64 } },
      { title: 'REACH THE EXTRACTION BOAT', obj: 'Sprint east to Calypso Docks pier', next: 'NEXT: MISSION COMPLETE', target: { x: 14, z: 82 } },
    ],
  },
];

const SAVE_PREFIX = 'solmar_bay_slot_';

export function getDefaultSaves() {
  return [
    {
      slot: 1,
      occupied: true,
      act: 'ACT II — COASTAL BREAKOUT',
      district: 'Paloma Strip',
      cash: 18450,
      rank: 5,
      rp: 3900,
      completion: 66.1,
      time: '16:00',
      accent: '#f97316',
    },
    {
      slot: 2,
      occupied: true,
      act: 'ACT I — HARBOR RUN',
      district: 'Lantern Quay',
      cash: 6200,
      rank: 2,
      rp: 1450,
      completion: 24.5,
      time: '21:15',
      accent: '#38bdf8',
    },
    {
      slot: 3,
      occupied: false,
      act: 'EMPTY',
      district: 'No save data',
      cash: 0,
      rank: 1,
      rp: 0,
      completion: 0,
      time: '--:--',
      accent: '#475569',
    },
  ];
}

export class Gameplay {
  constructor(scene, world, vfx, sound, camera) {
    this.scene = scene;
    this.world = world;
    this.vfx = vfx;
    this.sound = sound;
    this.camera = camera;

    this.mode = 'start'; // 'start' | 'play' | 'pause'
    this.shotMode = null;
    this.pauseTab = 'STATS';
    this.time = 0;

    // Player & state
    this.inVehicle = true;
    this.health = 92;
    this.armour = 76;
    this.cash = 18450;
    this.rank = 5;
    this.rankTitle = 'FIXER';
    this.rp = 3900;
    this.rpNext = 5200;
    this.clockText = '16:00';
    this.wantedStars = 4;
    this.alertText = 'AIR UNIT DEPLOYED';
    this.dispatchLine = '"All units, coral GT-S pushing north on Paloma Strip — box them in!"';
    this.dialogue = {
      speaker: 'SORA VANCE',
      role: 'broker',
      text: 'Chopper is overhead! Cut west into Lantern Quay before they seal the boulevard.',
      timer: 14,
    };

    this.weapons = WEAPONS.map((w) => ({ ...w }));
    this.activeWeapon = 2; // SMG
    this.fireTimer = 0;
    this.crew = CREW_ABILITIES.map((c) => ({ ...c }));

    this.missionIdx = 1; // Mission 3
    this.stageIdx = 2;   // Stage 3/4
    this.waypoint = { x: -38, z: 58, label: 'LANTERN QUAY DROP' };

    this.career = {
      missionsCleared: 8,
      pursuitsEscaped: 14,
      topSpeedKmh: 168,
      takedowns: 47,
      vehiclesBoosted: 23,
      districtsFriendly: 3,
      crewAssists: 19,
      playTime: '06h 42m',
    };

    this.saves = this._loadSaves();

    // Entities
    this.vehicles = [];
    this.cops = [];
    this.peds = [];
    this.heli = null;
    this.boat = null;
    this.playerChar = createCharacter('player');
    this.scene.add(this.playerChar.mesh);

    this.input = {
      w: false, a: false, s: false, d: false,
      shift: false, space: false, ctrl: false, mouseDown: false,
      mouseX: 0, mouseY: 0,
    };

    this._spawnInitialWorldEntities();
  }

  _loadSaves() {
    const defaults = getDefaultSaves();
    try {
      return defaults.map((def) => {
        const raw = localStorage.getItem(SAVE_PREFIX + def.slot);
        if (!raw) return def;
        return { ...def, ...JSON.parse(raw) };
      });
    } catch {
      return defaults;
    }
  }

  saveToSlot(slotNum) {
    const idx = this.saves.findIndex((s) => s.slot === slotNum);
    if (idx === -1) return;
    const dist = this.getCurrentDistrict();
    const mission = this.getCurrentMission();
    const entry = {
      slot: slotNum,
      occupied: true,
      act: `ACT II — ${mission.title}`,
      district: dist.name,
      cash: Math.round(this.cash),
      rank: this.rank,
      rp: Math.round(this.rp),
      completion: 66.1,
      time: this.clockText,
      accent: slotNum === 1 ? '#f97316' : slotNum === 2 ? '#38bdf8' : '#10b981',
    };
    this.saves[idx] = entry;
    try {
      localStorage.setItem(SAVE_PREFIX + slotNum, JSON.stringify(entry));
    } catch {
      // Ignore storage quota errors
    }
    this.sound.playClick();
  }

  loadFromSlot(slotNum) {
    const slot = this.saves.find((s) => s.slot === slotNum && s.occupied);
    if (!slot) return false;
    this.cash = slot.cash;
    this.rank = slot.rank;
    this.rp = slot.rp;
    this.clockText = slot.time;
    this.startNewOrContinue(false);
    return true;
  }

  _spawnInitialWorldEntities() {
    // Hero sports car (Veloce GT-S)
    const heroCar = createVehicleMesh('hero', 0xe64533);
    heroCar.mesh.position.set(3.2, 0, -18);
    heroCar.mesh.rotation.y = Math.PI; // heading north (-Z)
    this.scene.add(heroCar.mesh);
    this.heroVehicle = {
      ...heroCar,
      type: 'hero',
      name: 'VELOCE GT-S',
      speed: 0,
      heading: Math.PI,
      steer: 0,
      damagePct: 38,
      maxSpeed: 42,
    };
    this.vehicles.push(this.heroVehicle);

    // 2 SBPD Interceptor cruisers
    const cop1 = createVehicleMesh('police');
    cop1.mesh.position.set(1.2, 0, -7);
    cop1.mesh.rotation.y = Math.PI + 0.08;
    this.scene.add(cop1.mesh);
    this.vehicles.push({
      ...cop1,
      type: 'police',
      callsign: 'CRUISER-12',
      tactic: 'RAMMING',
      name: 'SBPD INTERCEPTOR',
      speed: 24,
      heading: Math.PI,
      damagePct: 12,
      maxSpeed: 39,
    });

    const cop2 = createVehicleMesh('police');
    cop2.mesh.position.set(-4.6, 0, -4);
    cop2.mesh.rotation.y = Math.PI - 0.12;
    this.scene.add(cop2.mesh);
    this.vehicles.push({
      ...cop2,
      type: 'police',
      callsign: 'CRUISER-07',
      tactic: 'FLANKING',
      name: 'SBPD INTERCEPTOR',
      speed: 26,
      heading: Math.PI,
      damagePct: 8,
      maxSpeed: 39,
    });

    // Civilian traffic cars
    const civSpecs = [
      { x: -6.5, z: -55, h: 0, col: 0x0ea5e9, name: 'BREEZE COUPE' },
      { x: 6.2, z: -78, h: Math.PI, col: 0xfacc15, name: 'PALOMA CABRIO' },
      { x: -6.2, z: 32, h: 0, col: 0xf8fafc, name: 'SOLMAR SEDAN' },
      { x: 6.2, z: 88, h: Math.PI, col: 0x10b981, name: 'HARBOR VAN' },
    ];
    for (const cs of civSpecs) {
      const v = createVehicleMesh('civilian', cs.col);
      v.mesh.position.set(cs.x, 0, cs.z);
      v.mesh.rotation.y = cs.h;
      this.scene.add(v.mesh);
      this.vehicles.push({
        ...v,
        type: 'civilian',
        name: cs.name,
        speed: 11,
        heading: cs.h,
        damagePct: 0,
        maxSpeed: 24,
      });
    }

    // Overhead Police Helicopter (FALCON-1)
    this.heli = createPoliceHelicopter();
    this.heli.mesh.position.set(10, 21, -30);
    this.heli.mesh.rotation.y = Math.PI + 0.35;
    this.scene.add(this.heli.mesh);

    // Coastal Patrol Boat (HARBOR-3)
    this.boat = createPatrolBoat();
    this.boat.position.set(54, -0.1, -38);
    this.boat.rotation.y = Math.PI - 0.15;
    this.scene.add(this.boat);

    // On-foot SBPD officers (for night market & live combat)
    const copSpawns = [
      { x: -48, z: 54, callsign: 'UNIT-4', tactic: 'FOOT CHASE', hp: 100, downed: false },
      { x: -53, z: 66, callsign: 'UNIT-9', tactic: 'FLANKING', hp: 100, downed: false },
      { x: -43, z: 68, callsign: 'UNIT-6', tactic: 'DOWNED', hp: 0, downed: true },
    ];
    for (const cs of copSpawns) {
      const c = createCharacter('cop');
      c.mesh.position.set(cs.x, 0, cs.z);
      this.scene.add(c.mesh);
      this.cops.push({
        char: c,
        callsign: cs.callsign,
        tactic: cs.tactic,
        hp: cs.hp,
        downed: cs.downed,
        fireCd: 1.2 + Math.random(),
      });
    }

    this.currentVehicle = this.heroVehicle;
    this.playerChar.mesh.visible = false;
  }

  startNewOrContinue(isNew = false) {
    this.shotMode = null;
    this.mode = 'play';
    this.world.setMode('sunset');
    if (isNew) {
      this.cash = 4500;
      this.rank = 1;
      this.rankTitle = 'RUNNER';
      this.rp = 420;
      this.rpNext = 1200;
      this.missionIdx = 0;
      this.stageIdx = 0;
      this.wantedStars = 2;
      this.alertText = 'UNITS RESPONDING';
      this.health = 100;
      this.armour = 100;
    }
    this.inVehicle = true;
    this.currentVehicle = this.heroVehicle;
    this.playerChar.mesh.visible = false;
    this.heroVehicle.mesh.position.set(3.2, 0, -18);
    this.heroVehicle.heading = Math.PI;
    this.heroVehicle.speed = 18;
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();
    this.sound.unlock();
    this.sound.playClick();
  }

  // Configure deterministic showcase shots
  applyShot(shot) {
    this.shotMode = shot;
    this.vfx.clear();

    if (shot === 'cover') {
      this.mode = 'play';
      this.world.setMode('sunset');
      this.inVehicle = true;
      this.currentVehicle = this.heroVehicle;
      this.playerChar.mesh.visible = false;

      // Hero Veloce GT-S speeding north along Paloma Strip in slight power-slide
      this.heroVehicle.mesh.position.set(2.4, 0, -24);
      this.heroVehicle.heading = Math.PI - 0.14;
      this.heroVehicle.mesh.rotation.y = this.heroVehicle.heading;
      this.heroVehicle.speed = 30.8; // ~111 KM/H
      this.heroVehicle.damagePct = 38; // 62% DENTED

      // Pursuing cruisers: CRUISER-12 ramming rear-right, CRUISER-07 flanking left
      const c1 = this.vehicles[1];
      c1.mesh.position.set(5.4, 0, -18.8);
      c1.heading = Math.PI - 0.24;
      c1.mesh.rotation.y = c1.heading;
      c1.tactic = 'RAMMING';

      const c2 = this.vehicles[2];
      c2.mesh.position.set(-4.2, 0, -16.5);
      c2.heading = Math.PI + 0.08;
      c2.mesh.rotation.y = c2.heading;
      c2.tactic = 'FLANKING';

      // Helicopter banking right over the boulevard in clear view with spotlight cone
      this.heli.mesh.position.set(14.5, 11.2, -3.5);
      this.heli.mesh.rotation.set(0.14, Math.PI + 0.55, -0.22);

      // Patrol boat offshore in the turquoise water
      this.boat.position.set(44, -0.1, -18);
      this.boat.rotation.y = Math.PI - 0.1;

      // Tire smoke puffs behind hero car + bright ramming sparks at contact point
      for (let i = 0; i < 8; i++) {
        this.vfx.spawnSmoke(
          new THREE.Vector3(2.8 + i * 0.32, 0.45 + i * 0.16, -21.2 + i * 0.65),
          1.7 + i * 0.28,
          2.2,
          0xf1f5f9
        );
      }
      this.vfx.spawnSparks(new THREE.Vector3(3.9, 0.88, -21.4), 20);

      // HUD state
      this.missionIdx = 1;
      this.stageIdx = 2;
      this.clockText = '16:00';
      this.cash = 18450;
      this.wantedStars = 4;
      this.alertText = 'AIR UNIT DEPLOYED';
      this.health = 92;
      this.armour = 76;
      this.rank = 5;
      this.rankTitle = 'FIXER';
      this.rp = 3900;
      this.rpNext = 5200;
      this.activeWeapon = 2;
      this.crew[0].cd = 0;
      this.crew[1].cd = 14;
      this.crew[2].cd = 0;
      this.dialogue = {
        speaker: 'SORA VANCE',
        role: 'broker',
        text: 'Falcon-1 is locked on you! Cut west into Lantern Quay before they seal the strip.',
        timer: 99,
      };
      this.dispatchLine = '"All units, coral GT-S pushing north on Paloma Strip — box them in!"';

      // Cinematic 52° FOV low-angle front-side chase camera
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(-5.8, 2.75, -33.6);
      this.camera.lookAt(3.4, 2.2, -19.0);
    } else if (shot === 'night') {
      this.mode = 'play';
      this.world.setMode('night');
      this.inVehicle = false;
      this.playerChar.mesh.visible = true;

      // Player in Lantern Quay Night Market in bent-elbow two-handed aiming stance
      this.playerChar.mesh.position.set(-34.5, 0, 56.2);
      this.playerChar.mesh.rotation.y = -Math.PI / 2 - 0.18;
      this.playerChar.setPose('aim', 0);
      this.playerChar.triggerMuzzleFlash(99);

      // Parked getaway car near market arch
      this.heroVehicle.mesh.position.set(-20.5, 0, 56);
      this.heroVehicle.mesh.rotation.y = -Math.PI / 2;

      // Police cruiser pulled up at the market entrance with glowing lightbar
      const c1 = this.vehicles[1];
      c1.mesh.position.set(-25.5, 0, 68.5);
      c1.mesh.rotation.y = -Math.PI / 2 - 0.45;
      c1.tactic = 'IN PURSUIT';

      // Articulated SBPD foot officers: 2 aiming in bent-elbow stances, 1 naturally downed
      this.cops[0].char.mesh.position.set(-47.5, 0, 53.5);
      this.cops[0].char.mesh.rotation.y = Math.PI / 2 - 0.12;
      this.cops[0].char.setPose('aim', 0);
      this.cops[0].char.triggerMuzzleFlash(99);
      this.cops[0].downed = false;
      this.cops[0].hp = 75;
      this.cops[0].tactic = 'FOOT CHASE';

      this.cops[1].char.mesh.position.set(-51.0, 0, 63.2);
      this.cops[1].char.mesh.rotation.y = Math.PI / 2 + 0.35;
      this.cops[1].char.setPose('crouch', 0);
      this.cops[1].downed = false;
      this.cops[1].hp = 100;
      this.cops[1].tactic = 'FLANKING';

      this.cops[2].char.mesh.position.set(-42.5, 0, 60.5);
      this.cops[2].char.mesh.rotation.y = 0.7;
      this.cops[2].char.setPose('downed', 0);
      this.cops[2].downed = true;
      this.cops[2].hp = 0;

      // Helicopter hovering above market with searchlight
      this.heli.mesh.position.set(-44, 19, 72);
      this.heli.mesh.rotation.set(0.18, Math.PI, 0.08);

      // Crisp white 3D bullet tracers & hit sparks across the lantern-lit plaza
      const pMuzzle = this.playerChar.getMuzzleWorldPos();
      this.vfx.spawnTracer(pMuzzle, new THREE.Vector3(-47.2, 1.35, 53.7), 99, 0xffffff);
      this.vfx.spawnTracer(new THREE.Vector3(-46.8, 1.32, 54.0), new THREE.Vector3(-36.2, 1.25, 55.8), 99, 0xffe4b5);
      this.vfx.spawnSparks(new THREE.Vector3(-47.1, 1.32, 53.6), 10);

      // HUD state
      this.missionIdx = 2;
      this.stageIdx = 1;
      this.clockText = '22:40';
      this.cash = 24900;
      this.wantedStars = 3;
      this.alertText = 'UNITS RESPONDING';
      this.health = 84;
      this.armour = 58;
      this.activeWeapon = 4; // Apex Carbine
      this.crew[0].cd = 8;
      this.crew[1].cd = 0;
      this.crew[2].cd = 0;
      this.dialogue = {
        speaker: 'NADIA KUROSAWA',
        role: 'netrunner',
        text: 'Jammer is live for 20 seconds — clear the market stalls and move east to the docks!',
        timer: 99,
      };
      this.dispatchLine = '"Shots fired inside Lantern Quay Night Market! Foot units closing in!"';

      // Over-the-shoulder action camera framing player, lanterns, stalls, tracers & officers
      this.camera.fov = 54;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(-29.2, 2.55, 58.6);
      this.camera.lookAt(-44.8, 1.9, 56.8);
    } else if (shot === 'map') {
      this.applyShot('cover');
      this.shotMode = 'map';
      this.mode = 'pause';
      this.pauseTab = 'STATS';
    } else if (shot === 'start') {
      this.mode = 'start';
      this.world.setMode('sunset');
      this.playerChar.mesh.visible = false;
      this.heroVehicle.mesh.position.set(3.0, 0, -28);
      this.heroVehicle.mesh.rotation.y = Math.PI;
      this.heli.mesh.position.set(-18, 34, -85);
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(28, 14.5, 22);
      this.camera.lookAt(-38, 18, -68);
    }
  }

  getCurrentMission() {
    return MISSIONS[this.missionIdx] || MISSIONS[0];
  }

  getCurrentStage() {
    const m = this.getCurrentMission();
    return m.stages[this.stageIdx] || m.stages[0];
  }

  getCurrentDistrict() {
    const pos = this.getPlayerPos();
    return getDistrictAt(pos.x, pos.z);
  }

  getPlayerPos() {
    if (this.inVehicle && this.currentVehicle) {
      return this.currentVehicle.mesh.position;
    }
    return this.playerChar.mesh.position;
  }

  getPlayerHeading() {
    if (this.inVehicle && this.currentVehicle) {
      return this.currentVehicle.heading;
    }
    return this.playerChar.mesh.rotation.y;
  }

  getActivePoliceUnits() {
    const pPos = this.getPlayerPos();
    const list = [];

    if (this.wantedStars >= 3 && this.heli) {
      const dist = Math.round(pPos.distanceTo(this.heli.mesh.position));
      list.push({ type: 'heli', callsign: 'FALCON-1', tactic: 'MARKSMAN', dist, color: '#f97316' });
    }
    if (this.wantedStars >= 4 && this.boat && this.inVehicle) {
      const dist = Math.round(pPos.distanceTo(this.boat.position));
      list.push({ type: 'boat', callsign: 'HARBOR-3', tactic: 'SHORE WATCH', dist, color: '#38bdf8' });
    }
    if (!this.inVehicle) {
      for (const c of this.cops) {
        if (c.downed) continue;
        const dist = Math.round(pPos.distanceTo(c.char.mesh.position));
        list.push({ type: 'foot', callsign: c.callsign, tactic: c.tactic, dist, color: '#ef4444' });
      }
    }
    for (const v of this.vehicles) {
      if (v.type !== 'police') continue;
      const dist = Math.round(pPos.distanceTo(v.mesh.position));
      list.push({
        type: 'cruiser',
        callsign: v.callsign,
        tactic: v.tactic || 'IN PURSUIT',
        dist,
        color: v.tactic === 'RAMMING' ? '#f59e0b' : '#3b82f6',
      });
    }
    return list.slice(0, 4);
  }

  toggleVehicle() {
    if (this.mode !== 'play') return;
    if (this.inVehicle && this.currentVehicle) {
      // Exit vehicle
      const v = this.currentVehicle;
      this.inVehicle = false;
      this.playerChar.mesh.visible = true;
      const sideX = Math.cos(v.heading) * 2.1;
      const sideZ = -Math.sin(v.heading) * 2.1;
      this.playerChar.mesh.position.set(v.mesh.position.x - sideX, 0, v.mesh.position.z - sideZ);
      this.playerChar.mesh.rotation.y = v.heading;
      this.playerChar.setPose('idle', this.time);
      this.sound.playClick();
    } else {
      // Enter nearest vehicle (carjack!)
      const p = this.playerChar.mesh.position;
      let best = null;
      let bestDist = 5.5;
      for (const v of this.vehicles) {
        const d = p.distanceTo(v.mesh.position);
        if (d < bestDist) {
          bestDist = d;
          best = v;
        }
      }
      if (best) {
        this.currentVehicle = best;
        this.inVehicle = true;
        this.playerChar.mesh.visible = false;
        this.career.vehiclesBoosted += 1;
        this.sound.playClick();
      }
    }
  }

  selectWeapon(idx) {
    if (idx < 0 || idx >= this.weapons.length) return;
    this.activeWeapon = idx;
    this.sound.playClick();
  }

  triggerCrewAbility(idx) {
    if (this.mode !== 'play') return;
    const ab = this.crew[idx];
    if (!ab || ab.cd > 0) return;
    ab.cd = ab.maxCd;
    this.career.crewAssists += 1;
    this.sound.playAbility();

    if (ab.id === 'ghost') {
      this.wantedStars = Math.max(0, this.wantedStars - 1);
      this.dialogue = {
        speaker: 'NADIA KUROSAWA',
        role: 'netrunner',
        text: 'Ghost Signal active — SBPD dispatch scrambled and heat dropped!',
        timer: 6,
      };
    } else if (ab.id === 'turbo') {
      if (this.inVehicle && this.currentVehicle) {
        this.currentVehicle.speed = Math.min(this.currentVehicle.maxSpeed + 12, this.currentVehicle.speed + 16);
        this.currentVehicle.damagePct = Math.max(0, this.currentVehicle.damagePct - 25);
        this.vfx.spawnSparks(this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 10);
      } else {
        this.health = Math.min(100, this.health + 20);
      }
      this.dialogue = {
        speaker: 'TOMAS ROURKE',
        role: 'tuner',
        text: 'Overdrive engaged! Push the throttle and leave them in the dust!',
        timer: 5,
      };
    } else if (ab.id === 'smoke') {
      this.armour = Math.min(100, this.armour + 35);
      const p = this.getPlayerPos();
      for (let i = 0; i < 8; i++) {
        this.vfx.spawnSmoke(
          new THREE.Vector3(p.x + (Math.random() - 0.5) * 4, 0.8, p.z + (Math.random() - 0.5) * 4),
          2.6,
          3.2,
          0xcbd5e1
        );
      }
      this.dialogue = {
        speaker: 'INES DELGADO',
        role: 'fixer',
        text: 'Smoke veil deployed and fresh ceramic plates topped up.',
        timer: 5,
      };
    }
  }

  fireWeapon() {
    if (this.mode !== 'play' || this.inVehicle || this.fireTimer > 0) return;
    const w = this.weapons[this.activeWeapon];
    if (w.ammo !== '∞' && w.ammo <= 0) return;
    if (w.ammo !== '∞') w.ammo -= 1;
    this.fireTimer = w.cooldown;

    this.playerChar.setPose(this.input.ctrl ? 'crouch' : 'aim', this.time);
    this.playerChar.triggerMuzzleFlash(0.08);
    this.sound.playShot(w.id);

    const origin = this.playerChar.getMuzzleWorldPos();
    const h = this.playerChar.mesh.rotation.y;
    const dir = new THREE.Vector3(Math.sin(h), 0, Math.cos(h)).normalize();
    const end = origin.clone().addScaledVector(dir, w.range);

    // Hit check against cops
    let hitPoint = end;
    for (const c of this.cops) {
      if (c.downed) continue;
      const toCop = new THREE.Vector3().subVectors(c.char.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), origin);
      const proj = toCop.dot(dir);
      if (proj > 0 && proj < w.range) {
        const perp = toCop.clone().addScaledVector(dir, -proj).length();
        if (perp < 1.1) {
          hitPoint = origin.clone().addScaledVector(dir, proj);
          c.hp -= w.damage;
          this.vfx.spawnSparks(hitPoint, 6);
          this.sound.playImpact(false);
          if (c.hp <= 0) {
            c.downed = true;
            c.char.setPose('downed', this.time);
            this.cash += 350;
            this.rp += 120;
            this.career.takedowns += 1;
            this.wantedStars = Math.min(5, this.wantedStars + 1);
          }
          break;
        }
      }
    }

    if (w.id > 0) {
      this.vfx.spawnTracer(origin, hitPoint, 0.12, 0xffffff);
    }
  }

  update(dt) {
    this.time += dt;

    // Spin helicopter rotor & flash police lightbars even in showcase mode
    if (this.heli) {
      this.heli.rotorGroup.rotation.y += dt * 26;
      this.heli.tailRotor.rotation.x += dt * 32;
    }
    for (const v of this.vehicles) {
      if (v.type === 'police' && v.redGlow && v.blueGlow) {
        const flash = Math.sin(this.time * 16) > 0;
        v.redGlow.material.opacity = flash ? 0.96 : 0.3;
        v.blueGlow.material.opacity = flash ? 0.3 : 0.96;
      }
    }

    // If deterministic static shot mode is active, keep framing rock-solid
    if (this.shotMode) {
      return;
    }

    if (this.mode === 'start') {
      // Gentle cinematic skyline orbit on start screen
      const angle = Math.sin(this.time * 0.12) * 0.28;
      this.camera.position.set(28 + Math.sin(angle) * 10, 14.5 + Math.cos(this.time * 0.18) * 1.2, 22 - Math.cos(angle) * 8);
      this.camera.lookAt(-38, 18, -68);
      return;
    }

    if (this.mode === 'pause') {
      return;
    }

    // Cooldowns
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    for (const ab of this.crew) {
      if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt);
    }
    if (this.playerChar.flashTimer > 0) {
      this.playerChar.flashTimer -= dt;
      if (this.playerChar.flashTimer <= 0) this.playerChar.muzzleFlash.material.opacity = 0;
    }

    // Player controls
    if (this.inVehicle && this.currentVehicle) {
      const v = this.currentVehicle;
      const accel = this.input.w ? 28 : this.input.s ? -22 : 0;
      v.speed += accel * dt;
      if (accel === 0) v.speed *= Math.pow(0.28, dt);
      if (this.input.space) {
        v.speed *= Math.pow(0.18, dt);
        if (Math.abs(v.speed) > 8 && Math.random() < 0.45) {
          this.vfx.spawnSmoke(v.mesh.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 1.0, 0.7);
        }
      }
      v.speed = Math.max(-14, Math.min(v.maxSpeed, v.speed));

      const steerDir = (this.input.a ? 1 : 0) - (this.input.d ? 1 : 0);
      if (Math.abs(v.speed) > 0.6) {
        v.heading += steerDir * 2.1 * dt * Math.sign(v.speed);
      }

      const nx = v.mesh.position.x + Math.sin(v.heading) * v.speed * dt;
      const nz = v.mesh.position.z + Math.cos(v.heading) * v.speed * dt;
      if (!this._collidesBuilding(nx, nz, 1.8)) {
        v.mesh.position.x = Math.max(-135, Math.min(32, nx));
        v.mesh.position.z = Math.max(-230, Math.min(230, nz));
      } else {
        v.speed *= -0.35;
        v.damagePct = Math.min(95, v.damagePct + 4);
        this.vfx.spawnSparks(v.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 6);
        this.sound.playImpact(true);
      }
      v.mesh.rotation.y = v.heading;
      v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });

      const kmh = Math.round(Math.abs(v.speed) * 3.6);
      if (kmh > this.career.topSpeedKmh) this.career.topSpeedKmh = kmh;

      // Smooth chase camera
      const camBack = 9.2;
      const targetCam = new THREE.Vector3(
        v.mesh.position.x - Math.sin(v.heading) * camBack,
        3.6,
        v.mesh.position.z - Math.cos(v.heading) * camBack
      );
      this.camera.position.lerp(targetCam, 1 - Math.exp(-6.5 * dt));
      this.camera.lookAt(v.mesh.position.x, 1.4, v.mesh.position.z);
    } else {
      // On-foot movement
      const speed = this.input.shift ? 8.8 : 5.4;
      let mx = (this.input.d ? 1 : 0) - (this.input.a ? 1 : 0);
      let mz = (this.input.s ? 1 : 0) - (this.input.w ? 1 : 0);
      const moving = mx !== 0 || mz !== 0;
      if (moving) {
        const len = Math.hypot(mx, mz);
        mx /= len;
        mz /= len;
        const nx = this.playerChar.mesh.position.x + mx * speed * dt;
        const nz = this.playerChar.mesh.position.z + mz * speed * dt;
        if (!this._collidesBuilding(nx, nz, 0.6)) {
          this.playerChar.mesh.position.x = nx;
          this.playerChar.mesh.position.z = nz;
        }
        this.playerChar.mesh.rotation.y = Math.atan2(mx, mz);
        this.playerChar.setPose(this.input.ctrl ? 'crouch' : 'run', this.time);
      } else {
        this.playerChar.setPose(this.input.ctrl ? 'crouch' : this.input.mouseDown ? 'aim' : 'idle', this.time);
      }

      if (this.input.mouseDown || this.input.space) {
        this.fireWeapon();
      }

      const p = this.playerChar.mesh.position;
      const targetCam = new THREE.Vector3(p.x + 5.5, 4.2, p.z + 6.5);
      this.camera.position.lerp(targetCam, 1 - Math.exp(-6.5 * dt));
      this.camera.lookAt(p.x, 1.35, p.z);
    }

    // Update police AI & traffic
    const pPos = this.getPlayerPos();
    for (const v of this.vehicles) {
      if (v === this.currentVehicle) continue;
      if (v.type === 'police' && this.wantedStars > 0) {
        const dx = pPos.x - v.mesh.position.x;
        const dz = pPos.z - v.mesh.position.z;
        const dist = Math.hypot(dx, dz);
        const desiredH = Math.atan2(dx, dz);
        let diff = desiredH - v.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
        const targetSpd = dist > 9 ? 26 : 16;
        v.speed += (targetSpd - v.speed) * dt * 2.5;
        v.mesh.position.x += Math.sin(v.heading) * v.speed * dt;
        v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
        v.mesh.rotation.y = v.heading;
        v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });
        v.tactic = dist < 14 ? 'RAMMING' : 'FLANKING';
      } else if (v.type === 'civilian') {
        v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
        if (v.mesh.position.z < -200) v.mesh.position.z = 200;
        if (v.mesh.position.z > 200) v.mesh.position.z = -200;
      }
    }

    // Helicopter orbits player when wanted >= 3
    if (this.heli && this.wantedStars >= 3) {
      const targetX = pPos.x + Math.cos(this.time * 0.45) * 18;
      const targetZ = pPos.z + Math.sin(this.time * 0.45) * 18;
      this.heli.mesh.position.x += (targetX - this.heli.mesh.position.x) * dt * 1.4;
      this.heli.mesh.position.z += (targetZ - this.heli.mesh.position.z) * dt * 1.4;
      this.heli.mesh.lookAt(pPos.x, 12, pPos.z);
    }

    // Mission stage objective check
    const stage = this.getCurrentStage();
    if (stage && stage.target) {
      const d = Math.hypot(pPos.x - stage.target.x, pPos.z - stage.target.z);
      if (d < 12) {
        const m = this.getCurrentMission();
        if (this.stageIdx < m.stages.length - 1) {
          this.stageIdx += 1;
          this.cash += 1200;
          this.rp += 350;
          this.sound.playAbility();
        } else {
          this.missionIdx = (this.missionIdx + 1) % MISSIONS.length;
          this.stageIdx = 0;
          this.cash += 3500;
          this.rp += 800;
          this.career.missionsCleared += 1;
          this.sound.playAbility();
        }
      }
    }

    // Sound update
    const kmh = this.inVehicle && this.currentVehicle ? Math.abs(this.currentVehicle.speed) * 3.6 : 0;
    this.sound.update(dt, {
      inVehicle: this.inVehicle,
      speedKmh: kmh,
      wantedStars: this.wantedStars,
      active: this.mode === 'play',
    });
  }

  _collidesBuilding(x, z, r) {
    for (const c of this.world.colliders) {
      if (Math.abs(x - c.x) < c.hw + r && Math.abs(z - c.z) < c.hd + r) return true;
    }
    return false;
  }
}
