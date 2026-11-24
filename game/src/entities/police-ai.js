// Coralina Bay: Sunset Syndicate — CBPD 1–5 Star Wanted AI, Traffic, Helicopter & SWAT
import * as THREE from 'three';

export function getActivePoliceUnits(g) {
  const p = g.getPlayerPos(), list = [];
  if (g.wantedStars >= 4 || g.shotMode === 'cover' || g.shotMode === 'night') {
    list.push({ callsign: 'EAGLE-2', tactic: 'SPOTLIGHT', icon: 'heli', color: '#fbbf24', dist: g.heli ? Math.round(g.heli.mesh.position.distanceTo(p)) : 24 });
  }
  if (g.shotMode === 'night' || !g.inVehicle) {
    g.cops.forEach((c) => { if (!c.downed) list.push({ callsign: c.callsign, tactic: c.tactic, icon: 'swat', color: c.tactic === 'FLANKING' ? '#f97316' : '#fb7185', dist: Math.round(c.char.mesh.position.distanceTo(p)) }); });
  }
  g.vehicles.forEach((v) => {
    if (v.type !== 'police') return;
    const col = v.tactic === 'RAMMING' || v.tactic === 'FIRING' ? '#f43f5e' : v.tactic === 'PINCHING' ? '#f97316' : v.tactic === 'BLOCKADE' ? '#fbbf24' : '#38bdf8';
    list.push({ callsign: v.callsign, tactic: v.tactic || 'BOXING', icon: 'car', color: col, dist: Math.round(v.mesh.position.distanceTo(p)) });
  });
  return list.slice(0, 5);
}

export function updatePoliceAndTrafficAI(g, dt, pPos, pDirZ) {
  if (g.heli) { g.heli.rotorGroup.rotation.y += dt * 26; g.heli.tailRotor.rotation.x += dt * 32; }
  const flash = Math.sin(g.time * 16) > 0;
  for (const v of g.vehicles) {
    if (v.type === 'police' && v.redGlow && v.blueGlow) { v.redGlow.material.opacity = flash ? 0.96 : 0.34; v.blueGlow.material.opacity = flash ? 0.34 : 0.96; }
    if ((v === g.currentVehicle && g.inVehicle) || v.isStatic) continue;
    if (v.type === 'civilian') {
      const d = Math.hypot(v.mesh.position.x - pPos.x, v.mesh.position.z - pPos.z);
      v.speed += ((d < 12 ? 0 : v.cruiseSpeed || 12) - v.speed) * Math.min(1, dt * 3.5);
      v.mesh.position.z += Math.cos(v.heading) * v.speed * dt;
      if (v.mesh.position.z < -210) v.mesh.position.z = 210; else if (v.mesh.position.z > 210) v.mesh.position.z = -210;
      v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2; });
    } else if (v.type === 'police') {
      if (g.wantedStars <= 0) { v.speed *= Math.pow(0.4, dt); continue; }
      const dx = pPos.x - v.mesh.position.x, dz = pPos.z - v.mesh.position.z, dist = Math.hypot(dx, dz);
      if (dist > 140) { v.mesh.position.set(Math.max(-8, Math.min(8, pPos.x + (Math.random() - 0.5) * 10)), 0, pPos.z - pDirZ * 48); continue; }
      let diff = Math.atan2(dx, dz) - v.heading; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      v.heading += diff * Math.min(1, dt * 3.4); v.speed += (18 + g.wantedStars * 4.2 - v.speed) * Math.min(1, dt * 2.2);
      const nx = v.mesh.position.x + Math.sin(v.heading) * v.speed * dt, nz = v.mesh.position.z + Math.cos(v.heading) * v.speed * dt;
      if (!g.collidesBuilding(nx, nz, 1.8)) { v.mesh.position.x = Math.max(-130, Math.min(28, nx)); v.mesh.position.z = Math.max(-220, Math.min(220, nz)); }
      v.mesh.rotation.y = v.heading; v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });
      v.tactic = dist < 11 ? 'RAMMING' : dist < 24 ? 'BOXING' : 'PURSUIT';
    }
  }
  for (let i = 0; i < g.vehicles.length; i++) for (let j = i + 1; j < g.vehicles.length; j++) {
    const a = g.vehicles[i], b = g.vehicles[j]; if (!a.mesh.visible || !b.mesh.visible) continue;
    const dx = b.mesh.position.x - a.mesh.position.x, dz = b.mesh.position.z - a.mesh.position.z, d = Math.hypot(dx, dz);
    if (d > 0.01 && d < 3.2) {
      const push = (3.2 - d) * 0.52, nx = dx / d, nz = dz / d;
      a.mesh.position.x -= nx * push; a.mesh.position.z -= nz * push; b.mesh.position.x += nx * push; b.mesh.position.z += nz * push;
      if (a === g.currentVehicle || b === g.currentVehicle) {
        g.vfx.spawnSparks(new THREE.Vector3((a.mesh.position.x + b.mesh.position.x) * 0.5, 0.78, (a.mesh.position.z + b.mesh.position.z) * 0.5), 8);
        a.damagePct = Math.min(95, (a.damagePct || 0) + 2); b.damagePct = Math.min(95, (b.damagePct || 0) + 2);
        if (g.impactSfxCd <= 0) { g.sound.playImpact(true); g.impactSfxCd = 0.2; }
      }
    }
  }
  if (g.heli) {
    g.heli.mesh.visible = g.wantedStars >= 4;
    if (g.wantedStars >= 4) {
      g.heli.mesh.position.x += (pPos.x + Math.cos(g.time * 0.45) * 18 - g.heli.mesh.position.x) * dt * 1.4;
      g.heli.mesh.position.z += (pPos.z + Math.sin(g.time * 0.45) * 18 - g.heli.mesh.position.z) * dt * 1.4;
      g.heli.mesh.lookAt(pPos.x, 12, pPos.z);
    }
  }
  if (g.wantedStars >= 5 || (!g.inVehicle && g.wantedStars >= 2)) {
    for (const c of g.cops) {
      if (c.downed) continue;
      const dx = pPos.x - c.char.mesh.position.x, dz = pPos.z - c.char.mesh.position.z, d = Math.hypot(dx, dz);
      if (g.wantedStars >= 5 && d > 65) c.char.mesh.position.set(pPos.x + (Math.random() - 0.5) * 20, 0, pPos.z - 22);
      if (d < 48) {
        c.char.mesh.rotation.y = Math.atan2(dx, dz);
        if (d > 14) { c.char.mesh.position.x += (dx / d) * 4.6 * dt; c.char.mesh.position.z += (dz / d) * 4.6 * dt; c.char.setPose('run', g.time); }
        else {
          c.char.setPose('aim', g.time);
          if ((c.fireCd -= dt) <= 0) {
            c.fireCd = 1.15 + Math.random() * 0.6; c.char.triggerMuzzleFlash(0.08);
            const m = c.char.getMuzzleWorldPos(); g.vfx.spawnTracer(m, pPos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0.12, 0xffe4b5); g.vfx.spawnCasings(m, 1, false);
            if (g.armour > 0) g.armour = Math.max(0, g.armour - 4); else g.health = Math.max(10, g.health - 5);
          }
        }
      }
    }
  }
  g.alertText = g.wantedStars >= 5 ? 'SWAT STRIKE' : g.wantedStars === 4 ? 'CBPD AIR SUPPORT' : g.wantedStars >= 2 ? 'UNITS CLOSING IN' : g.wantedStars === 1 ? 'CBPD PATROL' : 'AREA CLEAR';
}
