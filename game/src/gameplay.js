import * as THREE from 'three';
import { getDistrictAt } from './world.js';
import {
  createBurningWreck,
  createCharacter,
  createPatrolBoat,
  createPoliceHelicopter,
  createVehicleMesh,
  createWindowShooter,
} from './entities.js';

export const WEAPONS = [
  { id: 0, key: '1', name: 'BRAWL', ammo: '∞', maxAmmo: '∞', damage: 24, cooldown: 0.35, range: 3.0 },
  { id: 1, key: '2', name: 'CORAL 9MM', ammo: 16, maxAmmo: 96, damage: 28, cooldown: 0.24, range: 45 },
  { id: 2, key: '3', name: 'VIPER SMG', ammo: 36, maxAmmo: 180, damage: 19, cooldown: 0.11, range: 38 },
  { id: 3, key: '4', name: 'TIDAL 12G', ammo: 8, maxAmmo: 32, damage: 56, cooldown: 0.65, range: 22 },
  { id: 4, key: '5', name: 'SYNDICATE AR', ammo: 30, maxAmmo: 120, damage: 35, cooldown: 0.14, range: 60 },
];

export const CREW_ABILITIES = [
  { key: 'Z', id: 'blackout', name: 'SIGNAL BLACKOUT', crew: 'Maya Lin · Hacker', accent: '#22d3ee', maxCd: 24, cd: 0 },
  { key: 'X', id: 'nitro', name: 'NITRO SURGE', crew: 'Rico Vega · Driver', accent: '#fb7185', maxCd: 18, cd: 0 },
  { key: 'C', id: 'flare', name: 'FLARE SCREEN', crew: 'Dante Cruz · Tactician', accent: '#c084fc', maxCd: 22, cd: 0 },
];

export const MISSIONS = [
  {
    num: 2,
    title: 'SUNSET HEIST',
    stages: [
      { title: 'BOOST THE CORSAIR V12', obj: 'Steal the getaway coupe on Marina Boulevard', next: 'NEXT: REACH PELICAN HARBOR', target: { x: 2, z: 95 } },
      { title: 'SHAKE CBPD PATROL', obj: 'Escape pursuit into Mangrove Bazaar', next: 'NEXT: MEET VALERIA AT THE BAZAAR', target: { x: -40, z: 60 } },
    ],
  },
  {
    num: 5,
    title: 'BRIDGE RUNNER',
    stages: [
      { title: 'INTERCEPT THE COURIER', obj: 'Track the syndicate convoy past Azura Downtown', next: 'NEXT: BREACH THE BAY BLOCKADE', target: { x: 2, z: -60 } },
      { title: 'BREACH THE BAY BLOCKADE', obj: 'Outrun CBPD units along Marina Boulevard toward the Suspension Bridge', next: 'NEXT: STASH THE VAULT DRIVE AT ISLA DORADA', target: { x: 45, z: -150 } },
      { title: 'CROSS CORALINA BRIDGE', obj: 'Race across the Bay Suspension Bridge under air fire', next: 'NEXT: DOCK AT ISLA DORADA', target: { x: 120, z: -175 } },
      { title: 'DOCK AT ISLA DORADA', obj: 'Deliver the encrypted drive to the private yacht', next: 'NEXT: CONTRACT COMPLETE', target: { x: 155, z: -120 } },
    ],
  },
  {
    num: 6,
    title: 'BAZAAR TAKEDOWN',
    stages: [
      { title: 'ENTER MANGROVE BAZAAR', obj: 'Link up with Maya inside the neon night market', next: 'NEXT: SECURE MANGROVE BAZAAR', target: { x: -42, z: 60 } },
      { title: 'SECURE MANGROVE BAZAAR', obj: 'Clear CBPD tactical squad from the wet market plaza', next: 'NEXT: EXFIL VIA PELICAN HARBOR', target: { x: -46, z: 64 } },
      { title: 'REACH THE EXFIL SKIFF', obj: 'Sprint east to Pelican Harbor pier', next: 'NEXT: CONTRACT COMPLETE', target: { x: 14, z: 82 } },
    ],
  },
];

const SAVE_PREFIX = 'coralina_bay_slot_';

export function getDefaultSaves() {
  return [
    {
      slot: 1,
      occupied: true,
      act: 'ACT III — BRIDGE RUNNER',
      district: 'Marina Boulevard',
      cash: 31800,
      rank: 6,
      rp: 6420,
      completion: 74.8,
      time: '17:42',
      accent: '#fb7185',
    },
    {
      slot: 2,
      occupied: true,
      act: 'ACT II — BAZAAR TAKEDOWN',
      district: 'Mangrove Bazaar',
      cash: 19250,
      rank: 4,
      rp: 3180,
      completion: 48.2,
      time: '23:18',
      accent: '#22d3ee',
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

    this.mode = 'start';
    this.shotMode = null;
    this.pauseTab = 'STATS';
    this.time = 0;

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

    this.saves = this._loadSaves();

    this.vehicles = [];
    this.cops = [];
    this.heli = null;
    this.boat = null;
    this.burningWreck = null;
    this.windowShooter = null;
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
      act: `ACT III — ${mission.title}`,
      district: dist.name,
      cash: Math.round(this.cash),
      rank: this.rank,
      rp: Math.round(this.rp),
      completion: 74.8,
      time: this.clockText,
      accent: slotNum === 1 ? '#fb7185' : slotNum === 2 ? '#22d3ee' : '#34d399',
    };
    this.saves[idx] = entry;
    try {
      localStorage.setItem(SAVE_PREFIX + slotNum, JSON.stringify(entry));
    } catch {
      // Ignore quota errors
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
    // Hero sports car (CORSAIR V12 — metallic coral-red supercar)
    const heroCar = createVehicleMesh('hero', 0xe11d48);
    heroCar.mesh.position.set(0.5, 0, -24);
    heroCar.mesh.rotation.y = Math.PI;
    this.scene.add(heroCar.mesh);
    this.heroVehicle = {
      ...heroCar,
      type: 'hero',
      name: 'CORSAIR V12',
      speed: 0,
      heading: Math.PI,
      steer: 0,
      damagePct: 21,
      maxSpeed: 46,
    };
    this.vehicles.push(this.heroVehicle);

    // 5 CBPD Interceptor Cruisers for intense multi-unit pursuit
    const copSpecs = [
      { x: 4.1, z: -22.5, h: Math.PI - 0.16, callsign: 'INTERCEPT-1', tactic: 'RAMMING' },
      { x: -4.2, z: -26.8, h: Math.PI + 0.08, callsign: 'TACTICAL-7', tactic: 'FIRING', hasShooter: true },
      { x: 5.4, z: -34.0, h: Math.PI - 0.14, callsign: 'INTERCEPT-4', tactic: 'PINCHING' },
      { x: -3.6, z: -42.5, h: Math.PI + 0.45, callsign: 'INTERCEPT-9', tactic: 'BLOCKADE' },
      { x: 6.2, z: -17.0, h: Math.PI - 0.08, callsign: 'INTERCEPT-6', tactic: 'IN PURSUIT' },
    ];
    copSpecs.forEach((cs) => {
      const cop = createVehicleMesh('police');
      cop.mesh.position.set(cs.x, 0, cs.z);
      cop.mesh.rotation.y = cs.h;
      let shooter = null;
      if (cs.hasShooter) {
        // Side -1 in car local space faces +X (toward hero car) when heading is Math.PI (-Z)
        shooter = createWindowShooter(-1);
        cop.mesh.add(shooter.group);
        this.windowShooter = { cruiser: cop.mesh, shooter };
      }
      this.scene.add(cop.mesh);
      this.vehicles.push({
        ...cop,
        type: 'police',
        callsign: cs.callsign,
        tactic: cs.tactic,
        name: 'CBPD INTERCEPTOR',
        speed: 28,
        heading: cs.h,
        damagePct: 10,
        maxSpeed: 42,
        shooter,
      });
    });

    // Burning & exploding wrecked cruiser behind the chase pack
    this.burningWreck = createBurningWreck();
    this.burningWreck.position.set(-4.6, 0, -16.8);
    this.burningWreck.rotation.y = Math.PI + 0.52;
    this.scene.add(this.burningWreck);

    // Civilian traffic cars
    const civSpecs = [
      { x: -6.5, z: -68, h: 0, col: 0x0ea5e9, name: 'AZURA COUPE' },
      { x: 6.2, z: -92, h: Math.PI, col: 0xfacc15, name: 'CORAL CABRIO' },
      { x: -6.2, z: 32, h: 0, col: 0xf8fafc, name: 'MARINA SEDAN' },
      { x: 6.2, z: 88, h: Math.PI, col: 0x14b8a6, name: 'HARBOR VAN' },
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

    // Overhead CBPD Helicopter (EAGLE-2)
    this.heli = createPoliceHelicopter();
    this.heli.mesh.position.set(10.2, 13.8, -39);
    this.heli.mesh.rotation.y = Math.PI + 0.35;
    this.scene.add(this.heli.mesh);

    // Coastal Patrol Boat (COAST-5)
    this.boat = createPatrolBoat();
    this.boat.position.set(48, -0.1, -46);
    this.boat.rotation.y = Math.PI - 0.15;
    this.scene.add(this.boat);

    // On-foot CBPD SWAT officers (Mangrove Bazaar night market)
    const copSpawns = [
      { x: -48, z: 54, callsign: 'SWAT-2', tactic: 'SWAT PUSH', hp: 100, downed: false },
      { x: -53, z: 66, callsign: 'SWAT-5', tactic: 'FLANKING', hp: 100, downed: false },
      { x: -43, z: 68, callsign: 'SWAT-8', tactic: 'DOWNED', hp: 0, downed: true },
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
    if (this.burningWreck) this.burningWreck.visible = false;
    if (this.windowShooter) this.windowShooter.shooter.group.visible = false;

    if (isNew) {
      this.cash = 5200;
      this.rank = 1;
      this.rankTitle = 'RUNNER';
      this.rp = 480;
      this.rpNext = 1200;
      this.missionIdx = 0;
      this.stageIdx = 0;
      this.wantedStars = 2;
      this.alertText = 'UNITS CLOSING IN';
      this.health = 100;
      this.armour = 100;
    }
    this.inVehicle = true;
    this.currentVehicle = this.heroVehicle;
    this.playerChar.mesh.visible = false;
    this.heroVehicle.mesh.position.set(2.4, 0, -20);
    this.heroVehicle.heading = Math.PI;
    this.heroVehicle.speed = 20;
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();
    this.sound.unlock();
    this.sound.playClick();
  }

  applyShot(shot) {
    this.shotMode = shot;
    this.vfx.clear();

    if (shot === 'cover') {
      this.mode = 'play';
      this.world.setMode('sunset');
      this.inVehicle = true;
      this.currentVehicle = this.heroVehicle;
      this.playerChar.mesh.visible = false;
      if (this.burningWreck) this.burningWreck.visible = true;
      if (this.windowShooter) this.windowShooter.shooter.group.visible = true;

      // Hero CORSAIR V12 drifting north along Marina Boulevard at 134 KM/H
      this.heroVehicle.mesh.position.set(0.4, 0, -24.5);
      this.heroVehicle.heading = Math.PI - 0.14;
      this.heroVehicle.mesh.rotation.y = this.heroVehicle.heading;
      this.heroVehicle.speed = 37.22; // 134 KM/H
      this.heroVehicle.damagePct = 21; // 79% INTACT

      // 5 CBPD Interceptors surrounding the hero car!
      const c1 = this.vehicles[1]; // INTERCEPT-1 ramming right flank
      c1.mesh.position.set(4.0, 0, -23.0);
      c1.heading = Math.PI - 0.22;
      c1.mesh.rotation.y = c1.heading;
      c1.tactic = 'RAMMING';

      const c2 = this.vehicles[2]; // TACTICAL-7 left flank with officer firing from window!
      c2.mesh.position.set(-4.3, 0, -27.2);
      c2.heading = Math.PI + 0.06;
      c2.mesh.rotation.y = c2.heading;
      c2.tactic = 'FIRING';

      const c3 = this.vehicles[3]; // INTERCEPT-4 pinching ahead-right
      c3.mesh.position.set(5.4, 0, -34.5);
      c3.heading = Math.PI - 0.16;
      c3.mesh.rotation.y = c3.heading;
      c3.tactic = 'PINCHING';

      const c4 = this.vehicles[4]; // INTERCEPT-9 angled blockade ahead-left
      c4.mesh.position.set(-3.4, 0, -43.5);
      c4.heading = Math.PI + 0.48;
      c4.mesh.rotation.y = c4.heading;
      c4.tactic = 'BLOCKADE';

      const c5 = this.vehicles[5]; // INTERCEPT-6 closing rear-right
      c5.mesh.position.set(6.4, 0, -17.5);
      c5.heading = Math.PI - 0.08;
      c5.mesh.rotation.y = c5.heading;
      c5.tactic = 'IN PURSUIT';

      // Burning & exploding wrecked cruiser behind-left of hero car (clearly framed, never blocking dialogue)
      if (this.burningWreck) {
        this.burningWreck.position.set(-6.2, 0, -21.2);
        this.burningWreck.rotation.y = Math.PI + 0.56;
      }

      // Helicopter EAGLE-2 hovering cleanly in open sky with unobstructed spotlight beam
      this.heli.mesh.position.set(9.8, 13.6, -38.0);
      this.heli.mesh.rotation.set(0.18, Math.PI + 0.42, -0.18);

      // Patrol boat COAST-5 offshore
      this.boat.position.set(46, -0.1, -48);
      this.boat.rotation.y = Math.PI - 0.1;

      // Bullet tracers firing from TACTICAL-7's window shooter toward hero car!
      c2.mesh.updateMatrixWorld(true);
      const shooterMuzzle = new THREE.Vector3(-3.1, 1.34, -27.4);
      this.vfx.spawnTracer(shooterMuzzle, new THREE.Vector3(-0.2, 1.02, -25.1), 99, 0xfff5cc);
      this.vfx.spawnTracer(shooterMuzzle.clone().add(new THREE.Vector3(0.15, -0.05, 0.2)), new THREE.Vector3(0.4, 0.85, -24.4), 99, 0xffd28a);

      // Tire drift smoke behind hero car + ramming sparks + explosion sparks
      for (let i = 0; i < 6; i++) {
        this.vfx.spawnSmoke(
          new THREE.Vector3(0.9 + i * 0.25, 0.42 + i * 0.14, -21.8 + i * 0.55),
          1.4 + i * 0.25,
          2.2,
          0xe2e8f0
        );
      }
      this.vfx.spawnSparks(new THREE.Vector3(2.2, 0.82, -23.4), 18);
      this.vfx.spawnSparks(new THREE.Vector3(-5.9, 1.45, -20.8), 14);

      // Original Coralina Bay HUD state
      this.missionIdx = 1;
      this.stageIdx = 1;
      this.clockText = '17:42';
      this.cash = 31800;
      this.wantedStars = 4;
      this.activeUnitCount = 6;
      this.alertText = 'CBPD AIR SUPPORT';
      this.health = 88;
      this.armour = 64;
      this.rank = 6;
      this.rankTitle = 'KINGPIN';
      this.rp = 6420;
      this.rpNext = 8000;
      this.activeWeapon = 2;
      this.crew[0].cd = 0;
      this.crew[1].cd = 11;
      this.crew[2].cd = 0;
      this.dialogue = {
        speaker: 'VALERIA REYES',
        role: 'broker',
        text: 'CBPD sealed the bridge approach! Weave past the cruisers on Marina Boulevard and punch through!',
        timer: 99,
      };
      this.dispatchLine = '"CBPD Dispatch: Coral V12 tearing north on Marina Blvd — box them before the Bay Bridge!"';

      // Dynamic low 3/4 rear-left chase camera looking NORTH toward Bay Suspension Bridge:
      // Left = Art-Deco shops/awnings/neon/peds | Center = 5+ cops + firing + burning wreck | Right = Beach/palms/ocean/yachts + clean heli spotlight
      this.camera.fov = 55;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(-5.4, 3.2, -10.5);
      this.camera.lookAt(3.6, 3.6, -54.0);
    } else if (shot === 'night') {
      this.mode = 'play';
      this.world.setMode('night');
      this.inVehicle = false;
      this.playerChar.mesh.visible = true;
      if (this.burningWreck) this.burningWreck.visible = false;
      if (this.windowShooter) this.windowShooter.shooter.group.visible = false;

      this.playerChar.mesh.position.set(-34.5, 0, 56.2);
      this.playerChar.mesh.rotation.y = -Math.PI / 2 - 0.18;
      this.playerChar.setPose('aim', 0);
      this.playerChar.triggerMuzzleFlash(99);

      this.heroVehicle.mesh.position.set(-20.5, 0, 56);
      this.heroVehicle.mesh.rotation.y = -Math.PI / 2;

      const c1 = this.vehicles[1];
      c1.mesh.position.set(-25.5, 0, 68.5);
      c1.mesh.rotation.y = -Math.PI / 2 - 0.45;
      c1.tactic = 'IN PURSUIT';

      this.cops[0].char.mesh.position.set(-47.5, 0, 53.5);
      this.cops[0].char.mesh.rotation.y = Math.PI / 2 - 0.12;
      this.cops[0].char.setPose('aim', 0);
      this.cops[0].char.triggerMuzzleFlash(99);
      this.cops[0].downed = false;
      this.cops[0].hp = 75;
      this.cops[0].tactic = 'SWAT PUSH';

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

      this.heli.mesh.position.set(-44, 19, 72);
      this.heli.mesh.rotation.set(0.18, Math.PI, 0.08);

      const pMuzzle = this.playerChar.getMuzzleWorldPos();
      this.vfx.spawnTracer(pMuzzle, new THREE.Vector3(-47.2, 1.35, 53.7), 99, 0xffffff);
      this.vfx.spawnTracer(new THREE.Vector3(-46.8, 1.32, 54.0), new THREE.Vector3(-36.2, 1.25, 55.8), 99, 0xffe4b5);
      this.vfx.spawnSparks(new THREE.Vector3(-47.1, 1.32, 53.6), 12);

      this.missionIdx = 2;
      this.stageIdx = 1;
      this.clockText = '23:18';
      this.cash = 38450;
      this.wantedStars = 3;
      this.activeUnitCount = 4;
      this.alertText = 'UNITS CLOSING IN';
      this.health = 91;
      this.armour = 72;
      this.rank = 6;
      this.rankTitle = 'KINGPIN';
      this.rp = 6890;
      this.rpNext = 8000;
      this.activeWeapon = 4;
      this.crew[0].cd = 7;
      this.crew[1].cd = 0;
      this.crew[2].cd = 0;
      this.dialogue = {
        speaker: 'MAYA LIN',
        role: 'netrunner',
        text: 'Grid scramble holds for 18 seconds — sweep the bazaar stalls and sprint to Pelican Harbor!',
        timer: 99,
      };
      this.dispatchLine = '"CBPD Dispatch: Shots fired in Mangrove Bazaar! Tactical foot units moving in!"';

      this.camera.fov = 55;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(-29.0, 2.55, 58.8);
      this.camera.lookAt(-45.5, 2.0, 56.2);
    } else if (shot === 'map') {
      this.applyShot('cover');
      this.shotMode = 'map';
      this.mode = 'pause';
      this.pauseTab = 'STATS';
    } else if (shot === 'start') {
      this.mode = 'start';
      this.world.setMode('sunset');
      this.playerChar.mesh.visible = false;
      if (this.burningWreck) this.burningWreck.visible = false;
      if (this.windowShooter) this.windowShooter.shooter.group.visible = false;

      // Live boulevard traffic & cruisers visible below on Marina Boulevard
      this.heroVehicle.mesh.position.set(1.5, 0, -28);
      this.heroVehicle.mesh.rotation.y = Math.PI;
      this.vehicles[1].mesh.position.set(4.5, 0, -18);
      this.vehicles[1].mesh.rotation.y = Math.PI;
      this.vehicles[2].mesh.position.set(-3.8, 0, -14);
      this.vehicles[2].mesh.rotation.y = Math.PI;
      this.heli.mesh.position.set(6, 26, -86);
      this.heli.mesh.rotation.set(0.12, Math.PI + 0.3, -0.1);

      // Sweeping golden-hour Coralina Bay skyline + Art-Deco strip + Bay Suspension Bridge + sunset clouds + ocean yachts
      this.camera.fov = 54;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(34, 16.5, 16);
      this.camera.lookAt(-12, 15.5, -108);
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
      list.push({ type: 'heli', callsign: 'EAGLE-2', tactic: 'SPOTLIGHT', dist, color: '#fbbf24' });
    }
    if (!this.inVehicle) {
      for (const c of this.cops) {
        if (c.downed) continue;
        const dist = Math.round(pPos.distanceTo(c.char.mesh.position));
        list.push({ type: 'foot', callsign: c.callsign, tactic: c.tactic, dist, color: '#fb7185' });
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
        color: v.tactic === 'FIRING' ? '#ef4444' : v.tactic === 'RAMMING' ? '#f43f5e' : '#38bdf8',
      });
    }
    return list.slice(0, 5);
  }

  toggleVehicle() {
    if (this.mode !== 'play') return;
    if (this.inVehicle && this.currentVehicle) {
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

    if (ab.id === 'blackout') {
      this.wantedStars = Math.max(0, this.wantedStars - 1);
      this.dialogue = {
        speaker: 'MAYA LIN',
        role: 'netrunner',
        text: 'Signal Blackout live — CBPD dispatch scrambled and heat dropped!',
        timer: 6,
      };
    } else if (ab.id === 'nitro') {
      if (this.inVehicle && this.currentVehicle) {
        this.currentVehicle.speed = Math.min(this.currentVehicle.maxSpeed + 12, this.currentVehicle.speed + 16);
        this.currentVehicle.damagePct = Math.max(0, this.currentVehicle.damagePct - 25);
        this.vfx.spawnSparks(this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 10);
      } else {
        this.health = Math.min(100, this.health + 20);
      }
      this.dialogue = {
        speaker: 'RICO VEGA',
        role: 'tuner',
        text: 'Nitro Surge online! Bury the pedal and leave CBPD in the sunset!',
        timer: 5,
      };
    } else if (ab.id === 'flare') {
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
        speaker: 'DANTE CRUZ',
        role: 'fixer',
        text: 'Flare screen popped and fresh titanium plates topped off.',
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
            this.cash += 450;
            this.rp += 140;
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

    if (this.heli) {
      this.heli.rotorGroup.rotation.y += dt * 26;
      this.heli.tailRotor.rotation.x += dt * 32;
    }
    for (const v of this.vehicles) {
      if (v.type === 'police' && v.redGlow && v.blueGlow) {
        const flash = Math.sin(this.time * 16) > 0;
        v.redGlow.material.opacity = flash ? 0.96 : 0.38;
        v.blueGlow.material.opacity = flash ? 0.38 : 0.96;
      }
    }

    if (this.shotMode) {
      return;
    }

    if (this.mode === 'start') {
      const angle = Math.sin(this.time * 0.12) * 0.24;
      this.camera.position.set(34 + Math.sin(angle) * 9, 16.5 + Math.cos(this.time * 0.18) * 1.1, 16 - Math.cos(angle) * 6);
      this.camera.lookAt(-12, 15.5, -108);
      return;
    }

    if (this.mode === 'pause') {
      return;
    }

    this.fireTimer = Math.max(0, this.fireTimer - dt);
    for (const ab of this.crew) {
      if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt);
    }
    if (this.playerChar.flashTimer > 0) {
      this.playerChar.flashTimer -= dt;
      if (this.playerChar.flashTimer <= 0) this.playerChar.muzzleFlash.material.opacity = 0;
    }

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

      const camBack = 9.4;
      const targetCam = new THREE.Vector3(
        v.mesh.position.x - Math.sin(v.heading) * camBack,
        3.6,
        v.mesh.position.z - Math.cos(v.heading) * camBack
      );
      this.camera.position.lerp(targetCam, 1 - Math.exp(-6.5 * dt));
      this.camera.lookAt(v.mesh.position.x, 1.4, v.mesh.position.z);
    } else {
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
        const targetSpd = dist > 10 ? 27 : 16;
        v.speed += (targetSpd - v.speed) * dt * 2.5;
        v.mesh.position.x += Math.sin(v.heading) * v.speed * dt;
        v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
        v.mesh.rotation.y = v.heading;
        v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });
        v.tactic = dist < 14 ? 'RAMMING' : 'PINCHING';
      } else if (v.type === 'civilian') {
        v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
        if (v.mesh.position.z < -200) v.mesh.position.z = 200;
        if (v.mesh.position.z > 200) v.mesh.position.z = -200;
      }
    }

    if (this.heli && this.wantedStars >= 3) {
      const targetX = pPos.x + Math.cos(this.time * 0.45) * 18;
      const targetZ = pPos.z + Math.sin(this.time * 0.45) * 18;
      this.heli.mesh.position.x += (targetX - this.heli.mesh.position.x) * dt * 1.4;
      this.heli.mesh.position.z += (targetZ - this.heli.mesh.position.z) * dt * 1.4;
      this.heli.mesh.lookAt(pPos.x, 12, pPos.z);
    }

    const stage = this.getCurrentStage();
    if (stage && stage.target) {
      const d = Math.hypot(pPos.x - stage.target.x, pPos.z - stage.target.z);
      if (d < 12) {
        const m = this.getCurrentMission();
        if (this.stageIdx < m.stages.length - 1) {
          this.stageIdx += 1;
          this.cash += 1400;
          this.rp += 380;
          this.sound.playAbility();
        } else {
          this.missionIdx = (this.missionIdx + 1) % MISSIONS.length;
          this.stageIdx = 0;
          this.cash += 3800;
          this.rp += 850;
          this.career.missionsCleared += 1;
          this.sound.playAbility();
        }
      }
    }

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
