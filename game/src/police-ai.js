// Coralina Bay: Sunset Syndicate — CBPD 1-5 Star Wanted AI, Dispatch Units, Helicopter & SWAT
import * as THREE from 'three';

export function getActivePoliceUnits(game) {
  const pPos = game.getPlayerPos();
  const list = [];

  if (game.wantedStars >= 4 || game.shotMode === 'cover' || game.shotMode === 'night') {
    const hd = game.heli ? Math.round(game.heli.mesh.position.distanceTo(pPos)) : 24;
    list.push({ callsign: 'EAGLE-2', tactic: 'SPOTLIGHT', icon: 'heli', color: '#fbbf24', dist: hd });
  }

  if (game.shotMode === 'night' || !game.inVehicle) {
    game.cops.forEach((c) => {
      if (c.downed) return;
      const d = Math.round(c.char.mesh.position.distanceTo(pPos));
      list.push({
        callsign: c.callsign,
        tactic: c.tactic,
        icon: 'swat',
        color: c.tactic === 'FLANKING' ? '#f97316' : '#fb7185',
        dist: d,
      });
    });
  }

  game.vehicles.forEach((v) => {
    if (v.type !== 'police') return;
    const d = Math.round(v.mesh.position.distanceTo(pPos));
    const color =
      v.tactic === 'RAMMING' || v.tactic === 'FIRING'
        ? '#f43f5e'
        : v.tactic === 'PINCHING'
        ? '#f97316'
        : v.tactic === 'BLOCKADE'
        ? '#fbbf24'
        : '#38bdf8';
    list.push({ callsign: v.callsign, tactic: v.tactic || 'IN PURSUIT', icon: 'car', color, dist: d });
  });

  return list.slice(0, 5);
}

export function updatePoliceAndTrafficAI(game, dt, pPos, pDirZ) {
  // Update police lightbar strobe & helicopter rotors
  if (game.heli) {
    game.heli.rotorGroup.rotation.y += dt * 26;
    game.heli.tailRotor.rotation.x += dt * 32;
  }
  for (const v of game.vehicles) {
    if (v.type === 'police' && v.redGlow && v.blueGlow) {
      const flash = Math.sin(game.time * 16) > 0;
      v.redGlow.material.opacity = flash ? 0.96 : 0.34;
      v.blueGlow.material.opacity = flash ? 0.34 : 0.96;
    }
  }

  // Vehicle traffic & police pursuit AI
  for (const v of game.vehicles) {
    if (v === game.currentVehicle && game.inVehicle) continue;
    if (v.isStatic) continue;

    if (v.type === 'civilian') {
      // Civilian boulevard traffic with proximity braking & recycling
      let targetSpd = v.cruiseSpeed || 12;
      const distPlayer = Math.hypot(v.mesh.position.x - pPos.x, v.mesh.position.z - pPos.z);
      if (distPlayer < 12) targetSpd = 0;
      v.speed += (targetSpd - v.speed) * Math.min(1, dt * 3.5);
      v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
      if (v.mesh.position.z < -210) v.mesh.position.z = 210;
      if (v.mesh.position.z > 210) v.mesh.position.z = -210;
      v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.0; });
      continue;
    }

    if (v.type === 'police') {
      if (game.wantedStars <= 0) {
        v.speed *= Math.pow(0.4, dt);
        continue;
      }
      const dx = pPos.x - v.mesh.position.x;
      const dz = pPos.z - v.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 140) {
        v.mesh.position.set(Math.max(-8, Math.min(8, pPos.x + (Math.random() - 0.5) * 10)), 0, pPos.z - pDirZ * 48);
        continue;
      }

      const desiredHeading = Math.atan2(dx, dz);
      let diff = desiredHeading - v.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      v.heading += diff * Math.min(1, dt * 3.4);

      const maxCopSpd = 18 + game.wantedStars * 4.2;
      v.speed += (maxCopSpd - v.speed) * Math.min(1, dt * 2.2);
      const nx = v.mesh.position.x + Math.sin(v.heading) * v.speed * dt;
      const nz = v.mesh.position.z + Math.cos(v.heading) * v.speed * dt;
      if (!game.collidesBuilding(nx, nz, 1.8)) {
        v.mesh.position.x = Math.max(-130, Math.min(28, nx));
        v.mesh.position.z = Math.max(-220, Math.min(220, nz));
      }
      v.mesh.rotation.y = v.heading;
      v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });
      v.tactic = dist < 11 ? 'RAMMING' : dist < 24 ? 'PINCHING' : 'IN PURSUIT';
    }
  }

  // Vehicle-to-vehicle collision & sparks
  for (let i = 0; i < game.vehicles.length; i++) {
    for (let j = i + 1; j < game.vehicles.length; j++) {
      const a = game.vehicles[i];
      const b = game.vehicles[j];
      if (!a.mesh.visible || !b.mesh.visible) continue;
      const dx = b.mesh.position.x - a.mesh.position.x;
      const dz = b.mesh.position.z - a.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      const minD = 3.2;
      if (dist > 0.01 && dist < minD) {
        const push = (minD - dist) * 0.52;
        const nx = dx / dist;
        const nz = dz / dist;
        a.mesh.position.x -= nx * push;
        a.mesh.position.z -= nz * push;
        b.mesh.position.x += nx * push;
        b.mesh.position.z += nz * push;

        if (a === game.currentVehicle || b === game.currentVehicle) {
          const mid = new THREE.Vector3(
            (a.mesh.position.x + b.mesh.position.x) * 0.5,
            0.78,
            (a.mesh.position.z + b.mesh.position.z) * 0.5
          );
          game.vfx.spawnSparks(mid, 8);
          a.damagePct = Math.min(95, (a.damagePct || 0) + 2);
          b.damagePct = Math.min(95, (b.damagePct || 0) + 2);
          if (game.impactSfxCd <= 0) {
            game.sound.playImpact(true);
            game.impactSfxCd = 0.2;
          }
        }
      }
    }
  }

  // Star 4+: Helicopter EAGLE-2 spotlight overwatch
  if (game.heli) {
    game.heli.mesh.visible = game.wantedStars >= 4;
    if (game.wantedStars >= 4) {
      const targetX = pPos.x + Math.cos(game.time * 0.45) * 18;
      const targetZ = pPos.z + Math.sin(game.time * 0.45) * 18;
      game.heli.mesh.position.x += (targetX - game.heli.mesh.position.x) * dt * 1.4;
      game.heli.mesh.position.z += (targetZ - game.heli.mesh.position.z) * dt * 1.4;
      game.heli.mesh.lookAt(pPos.x, 12, pPos.z);
    }
  }

  // Star 5 or on-foot wanted: CBPD SWAT foot squad
  if (game.wantedStars >= 5 || (!game.inVehicle && game.wantedStars >= 2)) {
    for (const c of game.cops) {
      if (c.downed) continue;
      const dx = pPos.x - c.char.mesh.position.x;
      const dz = pPos.z - c.char.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (game.wantedStars >= 5 && dist > 65) {
        c.char.mesh.position.set(pPos.x + (Math.random() - 0.5) * 20, 0, pPos.z - 22);
      }
      if (dist < 48) {
        c.char.mesh.rotation.y = Math.atan2(dx, dz);
        if (dist > 14) {
          const step = 4.6 * dt;
          c.char.mesh.position.x += (dx / dist) * step;
          c.char.mesh.position.z += (dz / dist) * step;
          c.char.setPose('run', game.time);
        } else {
          c.char.setPose('aim', game.time);
          c.fireCd -= dt;
          if (c.fireCd <= 0) {
            c.fireCd = 1.15 + Math.random() * 0.6;
            c.char.triggerMuzzleFlash(0.08);
            const muzzle = c.char.getMuzzleWorldPos();
            game.vfx.spawnTracer(muzzle, pPos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0.12, 0xffe4b5);
            game.vfx.spawnCasings(muzzle, 1, false);
            if (game.armour > 0) game.armour = Math.max(0, game.armour - 4);
            else game.health = Math.max(10, game.health - 5);
          }
        }
      }
    }
  }

  // Update alert badge text dynamically
  if (game.wantedStars >= 5) game.alertText = 'SWAT STRIKE ACTIVE';
  else if (game.wantedStars === 4) game.alertText = 'CBPD AIR SUPPORT';
  else if (game.wantedStars >= 2) game.alertText = 'UNITS CLOSING IN';
  else if (game.wantedStars === 1) game.alertText = 'CBPD PATROL ALERT';
  else game.alertText = 'AREA CLEAR';
}
