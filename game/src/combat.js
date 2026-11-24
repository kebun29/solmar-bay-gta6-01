// Coralina Bay: Sunset Syndicate — Weapons, Over-the-Shoulder Combat & Crew Abilities
import * as THREE from 'three';

export function selectWeapon(game, idx) {
  if (idx >= 0 && idx < game.weapons.length) {
    game.activeWeapon = idx;
    game.sound.playClick();
  }
}

export function triggerCrewAbility(game, idx) {
  const ab = game.crew[idx];
  if (!ab || ab.cd > 0) return;

  const lv = ab.level || 1;
  ab.cd = Math.max(8, ab.maxCd - (lv - 1) * 3);
  game.career.crewAssists += 1;
  game.sound.playAbility();

  if (ab.id === 'blackout') {
    game.wantedStars = Math.max(0, game.wantedStars - (lv >= 2 ? 2 : 1));
    game.alertText = game.wantedStars === 0 ? 'GRID SCRAMBLED' : 'SIGNAL JAMMED';
    game.dialogue = {
      speaker: 'MAYA LIN',
      role: 'netrunner',
      text: 'Dispatch towers scrambled! CBPD lost your tracker — slip out while the grid resets!',
      timer: 7,
    };
  } else if (ab.id === 'nitro') {
    game.nitroTimer = 4.5 + lv * 1.2;
    if (game.currentVehicle) {
      game.currentVehicle.damagePct = Math.max(0, game.currentVehicle.damagePct - 25 * lv);
    }
    game.dialogue = {
      speaker: 'RICO VEGA',
      role: 'tuner',
      text: 'Twin-stage nitrous online and chassis patched — floor it down Marina Boulevard!',
      timer: 7,
    };
  } else if (ab.id === 'flare') {
    game.armour = Math.min(100, game.armour + 30 + lv * 12);
    const pos = game.getPlayerPos();
    for (let i = 0; i < 6; i++) {
      game.vfx.spawnSmoke(
        pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0.8, (Math.random() - 0.5) * 4)),
        2.2,
        2.4,
        0xcbd5e1
      );
    }
    game.dialogue = {
      speaker: 'DANTE CRUZ',
      role: 'fixer',
      text: 'Thermal flare screen popped and fresh titanium plates slotted — push forward!',
      timer: 7,
    };
  }
}

export function fireWeapon(game) {
  if (game.fireTimer > 0 || game.mode !== 'play' || game.activeShop) return;
  const w = game.weapons[game.activeWeapon];
  if (!w) return;
  if (typeof w.ammo === 'number' && w.ammo <= 0) return;

  game.fireTimer = w.cooldown;
  if (typeof w.ammo === 'number') w.ammo -= 1;

  // Face camera yaw cleanly when firing on foot
  const yaw = game.cameraCtrl.yaw;
  if (!game.inVehicle) {
    game.playerChar.mesh.rotation.y = yaw;
    game.playerChar.setPose('aim', game.time);
    game.playerChar.triggerMuzzleFlash(0.09);
  }

  const origin = game.inVehicle
    ? game.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 1.25, 0))
    : game.playerChar.getMuzzleWorldPos();

  const aimDir = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(game.cameraCtrl.pitch * 0.45),
    -Math.sin(game.cameraCtrl.pitch * 0.45),
    Math.cos(yaw) * Math.cos(game.cameraCtrl.pitch * 0.45)
  ).normalize();

  const end = origin.clone().addScaledVector(aimDir, w.range);
  game.vfx.spawnTracer(origin, end, 0.13, w.id === 4 ? 0xffe4b5 : 0xffffff);
  if (w.id > 0) game.vfx.spawnCasings(origin, w.id === 3 ? 2 : 1, false);
  game.sound.playShot(w.id);

  game.lastGunshotPos = origin.clone();
  game.lastGunshotTime = game.time;
  game.wantedStars = Math.max(game.wantedStars, 2);

  // Check hits against SWAT cops
  for (const c of game.cops) {
    if (c.downed) continue;
    const toCop = c.char.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
    const proj = toCop.dot(aimDir);
    if (proj > 0 && proj < w.range) {
      const perp = toCop.clone().addScaledVector(aimDir, -proj).length();
      if (perp < 1.35) {
        c.hp -= w.damage;
        game.vfx.spawnSparks(c.char.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 8);
        if (c.hp <= 0) {
          c.downed = true;
          c.char.setPose('downed', 0);
          game.cash += 650;
          game.rp += 180;
          game.career.takedowns += 1;
        }
        break;
      }
    }
  }
}
