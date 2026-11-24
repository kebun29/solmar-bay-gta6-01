// Coralina Bay: Sunset Syndicate — Weapons, Over-the-Shoulder Combat & Crew Abilities
import * as THREE from 'three';

export function selectWeapon(game, idx) {
  if (idx >= 0 && idx < game.weapons.length) {
    game.activeWeapon = idx;
    game.sound.playClick();
  }
}

export function triggerCrewAbility(g, idx) {
  const ab = g.crew[idx]; if (!ab || ab.cd > 0) return;
  const lv = ab.level || 1; ab.cd = Math.max(8, ab.maxCd - (lv - 1) * 3); g.career.crewAssists += 1; g.sound.playAbility();
  if (ab.id === 'blackout') {
    g.wantedStars = Math.max(0, g.wantedStars - (lv >= 2 ? 2 : 1)); g.alertText = g.wantedStars ? 'SIGNAL JAMMED' : 'GRID SCRAMBLED';
    g.dialogue = { speaker: 'MAYA LIN', role: 'netrunner', text: 'Dispatch scrambled! CBPD lost your tracker!', timer: 7 };
  } else if (ab.id === 'nitro') {
    g.nitroTimer = 4.5 + lv * 1.2; if (g.currentVehicle) g.currentVehicle.damagePct = Math.max(0, g.currentVehicle.damagePct - 25 * lv);
    g.dialogue = { speaker: 'RICO VEGA', role: 'tuner', text: 'Twin-stage nitrous online — floor it!', timer: 7 };
  } else if (ab.id === 'flare') {
    g.armour = Math.min(100, g.armour + 30 + lv * 12); const p = g.getPlayerPos();
    for (let i = 0; i < 6; i++) g.vfx.spawnSmoke(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0.8, (Math.random() - 0.5) * 4)), 2.2, 2.4, 0xcbd5e1);
    g.dialogue = { speaker: 'DANTE CRUZ', role: 'fixer', text: 'Flare screen popped & titanium plates slotted!', timer: 7 };
  }
}

export function fireWeapon(game) {
  if (game.fireTimer > 0 || game.mode !== 'play' || game.activeShop) return;
  const w = game.weapons[game.activeWeapon];
  if (!w || (typeof w.ammo === 'number' && w.ammo <= 0)) return;
  game.fireTimer = w.cooldown;
  if (typeof w.ammo === 'number') w.ammo -= 1;

  const yaw = game.cameraCtrl.yaw;
  if (!game.inVehicle) {
    game.playerChar.mesh.rotation.y = yaw;
    game.playerChar.setPose('aim', game.time);
    game.playerChar.triggerMuzzleFlash(0.09);
  }
  const origin = game.inVehicle
    ? game.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 1.25, 0))
    : game.playerChar.getMuzzleWorldPos();
  const cp = Math.cos(game.cameraCtrl.pitch * 0.45);
  const aimDir = new THREE.Vector3(Math.sin(yaw) * cp, -Math.sin(game.cameraCtrl.pitch * 0.45), Math.cos(yaw) * cp).normalize();

  game.vfx.spawnTracer(origin, origin.clone().addScaledVector(aimDir, w.range), 0.13, w.id === 4 ? 0xffe4b5 : 0xffffff);
  if (w.id > 0) game.vfx.spawnCasings(origin, w.id === 3 ? 2 : 1, false);
  game.sound.playShot(w.id);

  game.lastGunshotPos = origin.clone();
  game.lastGunshotTime = game.time;
  game.wantedStars = Math.max(game.wantedStars, 2);

  for (const c of game.cops) {
    if (c.downed) continue;
    const toCop = c.char.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
    const proj = toCop.dot(aimDir);
    if (proj > 0 && proj < w.range && toCop.clone().addScaledVector(aimDir, -proj).length() < 1.35) {
      c.hp -= w.damage;
      game.vfx.spawnSparks(c.char.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 8);
      if (c.hp <= 0) {
        c.downed = true; c.char.setPose('downed', 0);
        game.cash += 650; game.rp += 180; game.career.takedowns += 1;
      }
      break;
    }
  }
}
