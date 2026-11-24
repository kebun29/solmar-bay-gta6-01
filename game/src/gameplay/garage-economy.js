// Coralina Bay: Sunset Syndicate — Economy, Rank Progression & Marina Garage / Arms Dealer
import { INTERACTIVE_LOCATIONS } from '../core/config.js';

export function updateNearbyInteractables(game) {
  const pPos = game.getPlayerPos();
  game.nearbyLocation = INTERACTIVE_LOCATIONS.find((loc) => Math.hypot(pPos.x - loc.x, pPos.z - loc.z) <= loc.radius) || null;
  game.nearbyVehicle = null;
  if (!game.inVehicle) {
    let bestD = 7.2;
    for (const v of game.vehicles) {
      if (!v.mesh.visible) continue;
      const d = Math.hypot(v.mesh.position.x - pPos.x, v.mesh.position.z - pPos.z);
      if (d < bestD) { bestD = d; game.nearbyVehicle = v; }
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

export function buyGarageService(g, svc, hex = null) {
  const v = g.currentVehicle || g.heroVehicle; if (!v) return false;
  if (svc === 'repair' && g.cash >= 500) { g.cash -= 500; v.damagePct = 0; g.wantedStars = Math.max(0, g.wantedStars - 1); g.sound.playAbility(); return true; }
  if (svc === 'respray' && hex && g.cash >= 800) { g.cash -= 800; v.bodyMat?.color.set(hex); g.wantedStars = 0; g.alertText = 'RESPRAY CLEAR'; g.sound.playAbility(); return true; }
  if (svc === 'turbo' && !g.turboInstalled && g.cash >= 2500) { g.cash -= 2500; g.turboInstalled = true; v.maxSpeed = 62; g.sound.playAbility(); return true; }
  return false;
}
export function buyArmsService(g, svc) {
  if (svc === 'ammo' && g.cash >= 400) { g.cash -= 400; g.weapons.forEach((w) => { if (typeof w.maxAmmo === 'number') w.ammo = w.maxAmmo; }); g.sound.playAbility(); return true; }
  if (svc === 'armor' && g.cash >= 600) { g.cash -= 600; g.armour = 100; g.sound.playAbility(); return true; }
  if (svc === 'medkit' && g.cash >= 350) { g.cash -= 350; g.health = 100; g.sound.playAbility(); return true; }
  return false;
}

export function upgradeCrewMember(game, idx) {
  const ab = game.crew[idx];
  if (!ab || ab.level >= ab.maxLevel || game.cash < ab.upgradeCost) return false;
  game.cash -= ab.upgradeCost; ab.level += 1; ab.upgradeCost = Math.round(ab.upgradeCost * 1.45);
  game.sound.playAbility(); return true;
}

export function checkRankUp(game) {
  const titles = ['RUNNER', 'ENFORCER', 'CAPO', 'SYNDICATE', 'UNDERBOSS', 'KINGPIN', 'BAY LEGEND'];
  while (game.rp >= game.rpNext) {
    game.rp -= game.rpNext; game.rank += 1; game.rpNext = Math.round(game.rpNext * 1.25);
    game.rankTitle = titles[Math.min(titles.length - 1, game.rank - 1)];
  }
}
