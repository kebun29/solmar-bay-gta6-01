// Coralina Bay: Sunset Syndicate — Economy, Rank/RP Progression & Marina Garage / Arms Dealer
import { INTERACTIVE_LOCATIONS } from './config.js';

export function updateNearbyInteractables(game) {
  const pPos = game.getPlayerPos();

  game.nearbyLocation = null;
  for (const loc of INTERACTIVE_LOCATIONS) {
    if (Math.hypot(pPos.x - loc.x, pPos.z - loc.z) <= loc.radius) {
      game.nearbyLocation = loc;
      break;
    }
  }

  game.nearbyVehicle = null;
  if (!game.inVehicle) {
    let bestD = 7.2;
    for (const v of game.vehicles) {
      if (!v.mesh.visible) continue;
      const d = Math.hypot(v.mesh.position.x - pPos.x, v.mesh.position.z - pPos.z);
      if (d < bestD) {
        bestD = d;
        game.nearbyVehicle = v;
      }
    }
  }
}

export function openNearbyShop(game) {
  if (!game.nearbyLocation) return;
  game.activeShop = game.nearbyLocation.id;
  game.cameraCtrl.exitLock();
  game.sound.playClick();
}

export function closeShop(game) {
  game.activeShop = null;
  game.sound.playClick();
}

export function buyGarageService(game, service, paintHex = null) {
  const v = game.currentVehicle || game.heroVehicle;
  if (!v) return false;

  if (service === 'repair') {
    if (game.cash < 500) return false;
    game.cash -= 500;
    v.damagePct = 0;
    game.wantedStars = Math.max(0, game.wantedStars - 1);
    game.sound.playAbility();
    return true;
  }
  if (service === 'respray' && paintHex) {
    if (game.cash < 800) return false;
    game.cash -= 800;
    if (v.bodyMat) v.bodyMat.color.set(paintHex);
    game.wantedStars = 0;
    game.alertText = 'RESPRAY CLEAR';
    game.sound.playAbility();
    return true;
  }
  if (service === 'turbo') {
    if (game.turboInstalled || game.cash < 2500) return false;
    game.cash -= 2500;
    game.turboInstalled = true;
    v.maxSpeed = 62;
    game.sound.playAbility();
    return true;
  }
  return false;
}

export function buyArmsService(game, service) {
  if (service === 'ammo') {
    if (game.cash < 400) return false;
    game.cash -= 400;
    for (const w of game.weapons) {
      if (typeof w.maxAmmo === 'number') w.ammo = w.maxAmmo;
    }
    game.sound.playAbility();
    return true;
  }
  if (service === 'armor') {
    if (game.cash < 600) return false;
    game.cash -= 600;
    game.armour = 100;
    game.sound.playAbility();
    return true;
  }
  if (service === 'medkit') {
    if (game.cash < 350) return false;
    game.cash -= 350;
    game.health = 100;
    game.sound.playAbility();
    return true;
  }
  return false;
}

export function upgradeCrewMember(game, idx) {
  const ab = game.crew[idx];
  if (!ab || ab.level >= ab.maxLevel) return false;
  if (game.cash < ab.upgradeCost) return false;
  game.cash -= ab.upgradeCost;
  ab.level += 1;
  ab.upgradeCost = Math.round(ab.upgradeCost * 1.45);
  game.sound.playAbility();
  return true;
}

export function checkRankUp(game) {
  while (game.rp >= game.rpNext) {
    game.rp -= game.rpNext;
    game.rank += 1;
    game.rpNext = Math.round(game.rpNext * 1.25);
    const titles = ['RUNNER', 'ENFORCER', 'CAPO', 'SYNDICATE', 'UNDERBOSS', 'KINGPIN', 'BAY LEGEND'];
    game.rankTitle = titles[Math.min(titles.length - 1, game.rank - 1)];
  }
}
