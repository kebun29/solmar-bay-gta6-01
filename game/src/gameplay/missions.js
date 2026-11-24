// Coralina Bay: Sunset Syndicate — Story Missions & 4 Live 3D Showcase Shots
import * as THREE from 'three';
import { MISSIONS } from '../core/config.js';
import { checkRankUp } from './garage-economy.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function getCurrentMission(g) { return MISSIONS[g.missionIdx] || MISSIONS[0]; }
export function getCurrentStage(g) { const m = getCurrentMission(g); return m.stages[g.stageIdx] || m.stages[0]; }

export function updateMissionProgress(g, pPos) {
  const st = getCurrentStage(g); if (!st?.target) return;
  if (Math.hypot(pPos.x - st.target.x, pPos.z - st.target.z) < 12) {
    const m = getCurrentMission(g);
    if (g.stageIdx < m.stages.length - 1) { g.stageIdx += 1; g.cash += 1400; g.rp += 380; }
    else { g.missionIdx = (g.missionIdx + 1) % MISSIONS.length; g.stageIdx = 0; g.cash += 3800; g.rp += 850; g.career.missionsCleared += 1; }
    checkRankUp(g); g.sound.playAbility();
  }
}

export function replayMission(g, idx) {
  g.missionIdx = Math.max(0, Math.min(MISSIONS.length - 1, idx)); g.stageIdx = 0; g.mode = 'play'; g.shotMode = g.activeShop = null;
  if (idx === 2) {
    g.world.setMode('night'); g.inVehicle = false; g.playerChar.mesh.visible = true;
    g.playerChar.mesh.position.set(-34.5, 0, 56.2); g.playerChar.mesh.rotation.y = -Math.PI / 2;
    g.cameraCtrl.onExitVehicle(-Math.PI / 2); g.wantedStars = 3; g.clockText = '23:18';
  } else {
    g.world.setMode('sunset'); g.inVehicle = true; g.currentVehicle = g.heroVehicle; g.playerChar.mesh.visible = false;
    g.heroVehicle.mesh.position.set(1.5, 0, 12); g.heroVehicle.heading = g.heroVehicle.mesh.rotation.y = Math.PI; g.heroVehicle.speed = 18;
    g.cameraCtrl.onEnterVehicle(Math.PI); g.wantedStars = idx === 1 ? 4 : 2; g.clockText = '17:42';
  }
  g.sound.playClick();
}

export function applyShowcaseShot(g, shot) {
  g.shotMode = shot; g.vfx.clear(); g.activeShop = null; g.cameraCtrl.exitLock();
  if (g.parkedScooter) g.parkedScooter.mesh.visible = false;
  const setCam = (fov, px, py, pz, lx, ly, lz) => { g.camera.fov = fov; g.camera.updateProjectionMatrix(); g.camera.position.set(px, py, pz); g.camera.lookAt(lx, ly, lz); };

  if (shot === 'cover') {
    g.mode = 'play'; g.world.setMode('sunset'); g.inVehicle = true; g.currentVehicle = g.heroVehicle; g.playerChar.mesh.visible = false;
    if (g.burningWreck) g.burningWreck.visible = true;
    if (g.windowShooter) g.windowShooter.shooter.group.visible = true;
    g.heroVehicle.mesh.position.set(0.3, 0, -23.5); g.heroVehicle.heading = g.heroVehicle.mesh.rotation.y = Math.PI - 0.24;
    g.heroVehicle.speed = 38.6; g.heroVehicle.damagePct = 18;
    if (g.heroVehicle.nitroGroup) g.heroVehicle.nitroGroup.visible = true;
    [[4.2, -22.2, Math.PI - 0.2, 'BOXING'], [-4.2, -27.2, Math.PI + 0.08, 'FIRING'], [5.5, -34.8, Math.PI - 0.16, 'PINCHING'], [-3.5, -43.5, Math.PI + 0.48, 'BLOCKADE'], [6.4, -17.2, Math.PI - 0.08, 'PURSUIT']].forEach(([x, z, ry, tac], i) => {
      const c = g.vehicles[i + 1]; c.mesh.position.set(x, 0, z); c.heading = c.mesh.rotation.y = ry; c.tactic = tac;
    });
    if (g.burningWreck) { g.burningWreck.position.set(-6.4, 0, -20.8); g.burningWreck.rotation.y = Math.PI + 0.56; }
    g.heli.mesh.visible = true; g.heli.mesh.position.set(9.4, 13.4, -38.5); g.heli.mesh.rotation.set(0.18, Math.PI + 0.42, -0.18);
    g.boat.position.set(46, -0.1, -48); g.boat.rotation.y = Math.PI - 0.1;
    g.vfx.spawnTracer(V(-3, 1.34, -27.4), V(-0.2, 1.02, -24.2), 99, 0xfff5cc);
    g.vfx.spawnTracer(V(-2.9, 1.28, -27.1), V(0.4, 0.85, -23.5), 99, 0xffd28a);
    for (let i = 0; i < 6; i++) g.vfx.spawnSmoke(V(0.95 + i * 0.26, 0.38 + i * 0.12, -20.8 + i * 0.55), 1.35 + i * 0.24, 99, 0xe2e8f0);
    g.vfx.spawnSparks(V(2.2, 0.8, -22.8), 16);
    Object.assign(g, { missionIdx: 1, stageIdx: 1, clockText: '17:42', cash: 31800, wantedStars: 4, activeUnitCount: 6, alertText: 'CBPD AIR SUPPORT', health: 88, armour: 64, rank: 6, rankTitle: 'KINGPIN', rp: 6420, rpNext: 8000, activeWeapon: 2, dialogue: { speaker: 'VALERIA REYES', role: 'broker', text: 'Punch through Marina Blvd!', timer: 0 } });
    setCam(53, -5.0, 2.75, -12.2, 3.2, 3.0, -52.0);
  } else if (shot === 'night') {
    g.mode = 'play'; g.world.setMode('night'); g.inVehicle = false; g.playerChar.mesh.visible = true;
    if (g.heroVehicle.nitroGroup) g.heroVehicle.nitroGroup.visible = false;
    if (g.burningWreck) g.burningWreck.visible = false;
    if (g.windowShooter) g.windowShooter.shooter.group.visible = false;
    g.playerChar.mesh.position.set(-34.5, 0, 56.2); g.playerChar.mesh.rotation.y = -Math.PI / 2 - 0.18; g.playerChar.setPose('aim', 0); g.playerChar.triggerMuzzleFlash(99);
    g.heroVehicle.mesh.position.set(-20.5, 0, 56); g.heroVehicle.mesh.rotation.y = -Math.PI / 2;
    g.vehicles[1].mesh.position.set(-25.5, 0, 68.5); g.vehicles[1].mesh.rotation.y = -Math.PI / 2 - 0.45; g.vehicles[1].tactic = 'PURSUIT';
    [[-47.5, 53.5, Math.PI / 2 - 0.12, 'aim', false, 75, 'SWAT PUSH'], [-51, 63.2, Math.PI / 2 + 0.35, 'crouch', false, 100, 'FLANKING'], [-42.5, 60.5, 0.7, 'downed', true, 0, 'DOWN']].forEach(([x, z, ry, pose, dn, hp, tac], i) => {
      const c = g.cops[i]; c.char.mesh.position.set(x, 0, z); c.char.mesh.rotation.y = ry; c.char.setPose(pose, 0); if (i === 0) c.char.triggerMuzzleFlash(99); c.downed = dn; c.hp = hp; c.tactic = tac;
    });
    g.heli.mesh.visible = true; g.heli.mesh.position.set(-44, 19, 72); g.heli.mesh.rotation.set(0.18, Math.PI, 0.08);
    const pm = g.playerChar.getMuzzleWorldPos();
    g.vfx.spawnTracer(pm, V(-47.2, 1.35, 53.7), 99, 0xffffff); g.vfx.spawnTracer(V(-46.8, 1.32, 54), V(-36.2, 1.25, 55.8), 99, 0xffe4b5);
    g.vfx.spawnSparks(V(-47.1, 1.32, 53.6), 16); g.vfx.spawnSparks(V(-36.4, 1.2, 54.6), 10); g.vfx.spawnCasings(pm.clone().add(V(0.45, -0.05, 0.2)), 6, true);
    Object.assign(g, { missionIdx: 2, stageIdx: 1, clockText: '23:18', cash: 38450, wantedStars: 3, activeUnitCount: 4, alertText: 'UNITS CLOSING IN', health: 91, armour: 72, rank: 6, rankTitle: 'KINGPIN', rp: 6890, rpNext: 8000, activeWeapon: 4, dialogue: { speaker: 'MAYA LIN', role: 'netrunner', text: 'Grid scramble holds 18s — sweep the bazaar!', timer: 99 } });
    setCam(55, -29.0, 2.55, 58.8, -45.5, 2.0, 56.2);
  } else if (shot === 'midday') {
    g.mode = 'play'; g.world.setMode('midday'); g.inVehicle = false; g.playerChar.mesh.visible = true;
    if (g.heroVehicle.nitroGroup) g.heroVehicle.nitroGroup.visible = false;
    if (g.burningWreck) g.burningWreck.visible = false;
    if (g.windowShooter) g.windowShooter.shooter.group.visible = false;
    if (g.heli) g.heli.mesh.visible = false;
    g.playerChar.mesh.position.set(-9.2, 0, 12.2); g.playerChar.mesh.rotation.y = 0.65; g.playerChar.setPose('idle', 0);
    g.heroVehicle.mesh.position.set(-6.4, 0, 10.6); g.heroVehicle.heading = g.heroVehicle.mesh.rotation.y = Math.PI - 0.35;
    g.heroVehicle.speed = 0; g.heroVehicle.damagePct = 14; g.nearbyVehicle = g.heroVehicle;
    if (g.vehicles[6]) { g.vehicles[6].mesh.position.set(3.8, 0, 4); g.vehicles[6].heading = g.vehicles[6].mesh.rotation.y = Math.PI; }
    if (g.vehicles[7]) { g.vehicles[7].mesh.position.set(7.8, 0, 22); g.vehicles[7].heading = g.vehicles[7].mesh.rotation.y = 0; }
    for (let i = 1; i <= 5; i++) if (g.vehicles[i]) g.vehicles[i].mesh.position.set(-80, 0, -160 - i * 10);
    g.activeShop = 'garage'; g.nearbyLocation = { id: 'garage', name: 'MARINA GARAGE' };
    Object.assign(g, { missionIdx: 0, stageIdx: 0, clockText: '13:15', cash: 34200, wantedStars: 0, activeUnitCount: 0, alertText: 'AREA CLEAR', health: 100, armour: 85, rank: 6, rankTitle: 'KINGPIN', rp: 6650, rpNext: 8000, activeWeapon: 1, dialogue: { speaker: 'RICO VEGA', role: 'tuner', text: '', timer: 0 } });
    setCam(54, -14.6, 4.3, 22.4, 13.5, 1.6, -6.5);
  } else if (shot === 'start') {
    g.mode = 'start'; g.world.setMode('sunset'); g.playerChar.mesh.visible = false;
    if (g.heroVehicle.nitroGroup) g.heroVehicle.nitroGroup.visible = true;
    if (g.burningWreck) g.burningWreck.visible = false;
    if (g.windowShooter) g.windowShooter.shooter.group.visible = false;
    g.heroVehicle.mesh.position.set(1.5, 0, -28); g.heroVehicle.mesh.rotation.y = Math.PI;
    g.vehicles[1].mesh.position.set(4.6, 0, -18); g.vehicles[1].mesh.rotation.y = Math.PI;
    g.vehicles[2].mesh.position.set(-3.8, 0, -14); g.vehicles[2].mesh.rotation.y = Math.PI;
    g.heli.mesh.visible = true; g.heli.mesh.position.set(6, 26, -86); g.heli.mesh.rotation.set(0.12, Math.PI + 0.3, -0.1);
    setCam(54, 34, 16.5, 16, -12, 15.5, -108);
  }
}
