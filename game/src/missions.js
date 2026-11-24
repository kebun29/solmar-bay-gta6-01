// Coralina Bay: Sunset Syndicate — Story Mission Chain & 4 Deterministic Live 3D Showcase Shots
import * as THREE from 'three';
import { MISSIONS } from './config.js';
import { checkRankUp } from './garage-economy.js';

export function getCurrentMission(game) {
  return MISSIONS[game.missionIdx] || MISSIONS[0];
}

export function getCurrentStage(game) {
  const m = getCurrentMission(game);
  return m.stages[game.stageIdx] || m.stages[0];
}

export function updateMissionProgress(game, pPos) {
  const stage = getCurrentStage(game);
  if (!stage || !stage.target) return;

  const d = Math.hypot(pPos.x - stage.target.x, pPos.z - stage.target.z);
  if (d < 12) {
    const m = getCurrentMission(game);
    if (game.stageIdx < m.stages.length - 1) {
      game.stageIdx += 1;
      game.cash += 1400;
      game.rp += 380;
      checkRankUp(game);
      game.sound.playAbility();
    } else {
      game.missionIdx = (game.missionIdx + 1) % MISSIONS.length;
      game.stageIdx = 0;
      game.cash += 3800;
      game.rp += 850;
      game.career.missionsCleared += 1;
      checkRankUp(game);
      game.sound.playAbility();
    }
  }
}

export function replayMission(game, missionIdx) {
  game.missionIdx = Math.max(0, Math.min(MISSIONS.length - 1, missionIdx));
  game.stageIdx = 0;
  game.mode = 'play';
  game.shotMode = null;
  game.activeShop = null;

  if (missionIdx === 2) {
    game.world.setMode('night');
    game.inVehicle = false;
    game.playerChar.mesh.visible = true;
    game.playerChar.mesh.position.set(-34.5, 0, 56.2);
    game.playerChar.mesh.rotation.y = -Math.PI / 2;
    game.cameraCtrl.onExitVehicle(-Math.PI / 2);
    game.wantedStars = 3;
    game.clockText = '23:18';
  } else {
    game.world.setMode('sunset');
    game.inVehicle = true;
    game.currentVehicle = game.heroVehicle;
    game.playerChar.mesh.visible = false;
    game.heroVehicle.mesh.position.set(1.5, 0, 12);
    game.heroVehicle.heading = Math.PI;
    game.heroVehicle.mesh.rotation.y = Math.PI;
    game.heroVehicle.speed = 18;
    game.cameraCtrl.onEnterVehicle(Math.PI);
    game.wantedStars = missionIdx === 1 ? 4 : 2;
    game.clockText = '17:42';
  }
  game.sound.playClick();
}

// 4 Deterministic Live 3D Showcase Shots: cover (Sunset), night (Bazaar), midday (Marina Garage), start (Skyline)
export function applyShowcaseShot(game, shot) {
  game.shotMode = shot;
  game.vfx.clear();
  game.activeShop = null;
  game.cameraCtrl.exitLock();
  if (game.parkedScooter) game.parkedScooter.mesh.visible = false;

  if (shot === 'cover') {
    // Shot 1: Golden Sunset Chase + Bay Bridge + EAGLE-2 Spotlight + Volumetric Fire/Smoke + Sleek HUD
    game.mode = 'play';
    game.world.setMode('sunset');
    game.inVehicle = true;
    game.currentVehicle = game.heroVehicle;
    game.playerChar.mesh.visible = false;
    if (game.burningWreck) game.burningWreck.visible = true;
    if (game.windowShooter) game.windowShooter.shooter.group.visible = true;

    game.heroVehicle.mesh.position.set(0.4, 0, -24.5);
    game.heroVehicle.heading = Math.PI - 0.14;
    game.heroVehicle.mesh.rotation.y = game.heroVehicle.heading;
    game.heroVehicle.speed = 37.22; // 134 KM/H
    game.heroVehicle.damagePct = 21;
    if (game.heroVehicle.nitroGroup) game.heroVehicle.nitroGroup.visible = true;

    const c1 = game.vehicles[1];
    c1.mesh.position.set(4.1, 0, -23.0);
    c1.heading = Math.PI - 0.22;
    c1.mesh.rotation.y = c1.heading;
    c1.tactic = 'RAMMING';

    const c2 = game.vehicles[2];
    c2.mesh.position.set(-4.3, 0, -27.2);
    c2.heading = Math.PI + 0.06;
    c2.mesh.rotation.y = c2.heading;
    c2.tactic = 'FIRING';

    const c3 = game.vehicles[3];
    c3.mesh.position.set(5.4, 0, -34.5);
    c3.heading = Math.PI - 0.16;
    c3.mesh.rotation.y = c3.heading;
    c3.tactic = 'PINCHING';

    const c4 = game.vehicles[4];
    c4.mesh.position.set(-3.4, 0, -43.5);
    c4.heading = Math.PI + 0.48;
    c4.mesh.rotation.y = c4.heading;
    c4.tactic = 'BLOCKADE';

    const c5 = game.vehicles[5];
    c5.mesh.position.set(6.4, 0, -17.5);
    c5.heading = Math.PI - 0.08;
    c5.mesh.rotation.y = c5.heading;
    c5.tactic = 'IN PURSUIT';

    if (game.burningWreck) {
      game.burningWreck.position.set(-6.2, 0, -21.2);
      game.burningWreck.rotation.y = Math.PI + 0.56;
    }

    game.heli.mesh.visible = true;
    game.heli.mesh.position.set(9.8, 13.6, -38.0);
    game.heli.mesh.rotation.set(0.18, Math.PI + 0.42, -0.18);

    game.boat.position.set(46, -0.1, -48);
    game.boat.rotation.y = Math.PI - 0.1;

    const shooterMuzzle = new THREE.Vector3(-3.1, 1.34, -27.4);
    game.vfx.spawnTracer(shooterMuzzle, new THREE.Vector3(-0.2, 1.02, -25.1), 99, 0xfff5cc);
    game.vfx.spawnTracer(new THREE.Vector3(-2.95, 1.29, -27.2), new THREE.Vector3(0.4, 0.85, -24.4), 99, 0xffd28a);

    for (let i = 0; i < 6; i++) {
      game.vfx.spawnSmoke(
        new THREE.Vector3(0.9 + i * 0.25, 0.42 + i * 0.14, -21.8 + i * 0.55),
        1.45 + i * 0.25,
        99,
        0xe2e8f0
      );
    }
    game.vfx.spawnSparks(new THREE.Vector3(2.2, 0.82, -23.4), 16);

    game.missionIdx = 1;
    game.stageIdx = 1;
    game.clockText = '17:42';
    game.cash = 31800;
    game.wantedStars = 4;
    game.activeUnitCount = 6;
    game.alertText = 'CBPD AIR SUPPORT';
    game.health = 88;
    game.armour = 64;
    game.rank = 6;
    game.rankTitle = 'KINGPIN';
    game.rp = 6420;
    game.rpNext = 8000;
    game.activeWeapon = 2;
    game.crew[0].cd = 0;
    game.crew[1].cd = 11;
    game.crew[2].cd = 0;
    game.dialogue = {
      speaker: 'VALERIA REYES',
      role: 'broker',
      text: 'CBPD sealed the bridge approach! Weave past the cruisers on Marina Boulevard and punch through!',
      timer: 99,
    };
    game.dispatchLine = '"CBPD Dispatch: Coral V12 tearing north on Marina Blvd — box them before the Bay Bridge!"';

    game.camera.fov = 55;
    game.camera.updateProjectionMatrix();
    game.camera.position.set(-5.4, 3.2, -10.5);
    game.camera.lookAt(3.6, 3.6, -54.0);
  } else if (shot === 'night') {
    // Shot 2: Rain-Slicked Neon Night Shootout in Mangrove Bazaar with Upgraded Props & SWAT
    game.mode = 'play';
    game.world.setMode('night');
    game.inVehicle = false;
    game.playerChar.mesh.visible = true;
    if (game.heroVehicle.nitroGroup) game.heroVehicle.nitroGroup.visible = false;
    if (game.burningWreck) game.burningWreck.visible = false;
    if (game.windowShooter) game.windowShooter.shooter.group.visible = false;

    game.playerChar.mesh.position.set(-34.5, 0, 56.2);
    game.playerChar.mesh.rotation.y = -Math.PI / 2 - 0.18;
    game.playerChar.setPose('aim', 0);
    game.playerChar.triggerMuzzleFlash(99);

    game.heroVehicle.mesh.position.set(-20.5, 0, 56);
    game.heroVehicle.mesh.rotation.y = -Math.PI / 2;

    const c1 = game.vehicles[1];
    c1.mesh.position.set(-25.5, 0, 68.5);
    c1.mesh.rotation.y = -Math.PI / 2 - 0.45;
    c1.tactic = 'IN PURSUIT';

    game.cops[0].char.mesh.position.set(-47.5, 0, 53.5);
    game.cops[0].char.mesh.rotation.y = Math.PI / 2 - 0.12;
    game.cops[0].char.setPose('aim', 0);
    game.cops[0].char.triggerMuzzleFlash(99);
    game.cops[0].downed = false;
    game.cops[0].hp = 75;
    game.cops[0].tactic = 'SWAT PUSH';

    game.cops[1].char.mesh.position.set(-51.0, 0, 63.2);
    game.cops[1].char.mesh.rotation.y = Math.PI / 2 + 0.35;
    game.cops[1].char.setPose('crouch', 0);
    game.cops[1].downed = false;
    game.cops[1].hp = 100;
    game.cops[1].tactic = 'FLANKING';

    game.cops[2].char.mesh.position.set(-42.5, 0, 60.5);
    game.cops[2].char.mesh.rotation.y = 0.7;
    game.cops[2].char.setPose('downed', 0);
    game.cops[2].downed = true;
    game.cops[2].hp = 0;

    game.heli.mesh.visible = true;
    game.heli.mesh.position.set(-44, 19, 72);
    game.heli.mesh.rotation.set(0.18, Math.PI, 0.08);

    const pMuzzle = game.playerChar.getMuzzleWorldPos();
    game.vfx.spawnTracer(pMuzzle, new THREE.Vector3(-47.2, 1.35, 53.7), 99, 0xffffff);
    game.vfx.spawnTracer(new THREE.Vector3(-46.8, 1.32, 54.0), new THREE.Vector3(-36.2, 1.25, 55.8), 99, 0xffe4b5);
    game.vfx.spawnSparks(new THREE.Vector3(-47.1, 1.32, 53.6), 16);
    game.vfx.spawnSparks(new THREE.Vector3(-36.4, 1.2, 54.6), 10);
    game.vfx.spawnCasings(pMuzzle.clone().add(new THREE.Vector3(0.45, -0.05, 0.2)), 6, true);

    game.missionIdx = 2;
    game.stageIdx = 1;
    game.clockText = '23:18';
    game.cash = 38450;
    game.wantedStars = 3;
    game.activeUnitCount = 4;
    game.alertText = 'UNITS CLOSING IN';
    game.health = 91;
    game.armour = 72;
    game.rank = 6;
    game.rankTitle = 'KINGPIN';
    game.rp = 6890;
    game.rpNext = 8000;
    game.activeWeapon = 4;
    game.crew[0].cd = 7;
    game.crew[1].cd = 0;
    game.crew[2].cd = 0;
    game.dialogue = {
      speaker: 'MAYA LIN',
      role: 'netrunner',
      text: 'Grid scramble holds for 18 seconds — sweep the bazaar stalls and sprint to Pelican Harbor!',
      timer: 99,
    };
    game.dispatchLine = '"CBPD Dispatch: Shots fired in Mangrove Bazaar! Tactical foot units moving in!"';

    game.camera.fov = 55;
    game.camera.updateProjectionMatrix();
    game.camera.position.set(-29.0, 2.55, 58.8);
    game.camera.lookAt(-45.5, 2.0, 56.2);
  } else if (shot === 'midday') {
    // Shot 3: Bright Turquoise Tropical Midday at Marina Garage & Beachfront
    game.mode = 'play';
    game.world.setMode('midday');
    game.inVehicle = false;
    game.playerChar.mesh.visible = true;
    if (game.heroVehicle.nitroGroup) game.heroVehicle.nitroGroup.visible = false;
    if (game.burningWreck) game.burningWreck.visible = false;
    if (game.windowShooter) game.windowShooter.shooter.group.visible = false;
    if (game.heli) game.heli.mesh.visible = false;

    // Player standing on-foot right beside the sculpted exotic CORSAIR V12 & Marina Garage marker
    game.playerChar.mesh.position.set(-9.2, 0, 12.2);
    game.playerChar.mesh.rotation.y = 0.65;
    game.playerChar.setPose('idle', 0);

    // Exotic CORSAIR V12 parked in front of Marina Garage with glossy midday reflections
    game.heroVehicle.mesh.position.set(-6.4, 0, 10.6);
    game.heroVehicle.heading = Math.PI - 0.35;
    game.heroVehicle.mesh.rotation.y = game.heroVehicle.heading;
    game.heroVehicle.speed = 0;
    game.heroVehicle.damagePct = 14;
    game.nearbyVehicle = game.heroVehicle;

    // Lively midday boulevard traffic cruising past the beachfront
    const civ1 = game.vehicles[6];
    if (civ1) {
      civ1.mesh.position.set(3.8, 0, 4.0);
      civ1.heading = Math.PI;
      civ1.mesh.rotation.y = Math.PI;
    }
    const civ2 = game.vehicles[7];
    if (civ2) {
      civ2.mesh.position.set(7.8, 0, 22.0);
      civ2.heading = 0;
      civ2.mesh.rotation.y = 0;
    }
    // Move police cruisers away for calm midday garage scene
    for (let i = 1; i <= 5; i++) {
      if (game.vehicles[i]) game.vehicles[i].mesh.position.set(-80, 0, -160 - i * 10);
    }

    // Open compact side-docked Marina Garage panel while keeping the 3D beachfront crystal clear!
    game.activeShop = 'garage';
    game.nearbyLocation = { id: 'garage', name: 'MARINA GARAGE' };

    game.missionIdx = 0;
    game.stageIdx = 0;
    game.clockText = '13:15';
    game.cash = 34200;
    game.wantedStars = 0;
    game.activeUnitCount = 0;
    game.alertText = 'AREA CLEAR';
    game.health = 100;
    game.armour = 85;
    game.rank = 6;
    game.rankTitle = 'KINGPIN';
    game.rp = 6650;
    game.rpNext = 8000;
    game.activeWeapon = 1;
    game.dialogue = {
      speaker: 'RICO VEGA',
      role: 'tuner',
      text: 'Marina Garage bay is open — patch your chassis, respray the V12, or bolt on twin turbo!',
      timer: 99,
    };

    // Framed from sidewalk looking slightly northeast: Left = Marina Garage marker + Player + CORSAIR V12 | Center-Right = Boulevard traffic + Palms + Turquoise Ocean + Yachts!
    game.camera.fov = 54;
    game.camera.updateProjectionMatrix();
    game.camera.position.set(-14.6, 4.3, 22.4);
    game.camera.lookAt(13.5, 1.6, -6.5);
  } else if (shot === 'start') {
    // Shot 4: Start Screen over Upgraded Sunset Skyline Chase + 3 Save Slots
    game.mode = 'start';
    game.world.setMode('sunset');
    game.playerChar.mesh.visible = false;
    if (game.heroVehicle.nitroGroup) game.heroVehicle.nitroGroup.visible = true;
    if (game.burningWreck) game.burningWreck.visible = false;
    if (game.windowShooter) game.windowShooter.shooter.group.visible = false;

    game.heroVehicle.mesh.position.set(1.5, 0, -28);
    game.heroVehicle.mesh.rotation.y = Math.PI;
    game.vehicles[1].mesh.position.set(4.6, 0, -18);
    game.vehicles[1].mesh.rotation.y = Math.PI;
    game.vehicles[2].mesh.position.set(-3.8, 0, -14);
    game.vehicles[2].mesh.rotation.y = Math.PI;
    game.heli.mesh.visible = true;
    game.heli.mesh.position.set(6, 26, -86);
    game.heli.mesh.rotation.set(0.12, Math.PI + 0.3, -0.1);

    game.camera.fov = 54;
    game.camera.updateProjectionMatrix();
    game.camera.position.set(34, 16.5, 16);
    game.camera.lookAt(-12, 15.5, -108);
  }
}
