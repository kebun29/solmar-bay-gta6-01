// Coralina Bay: Sunset Syndicate — Articulated Characters & Reactive Pedestrian AI
import * as THREE from 'three';
import { createContactShadow, createGlowSprite } from '../world/textures.js';

const B = (...a) => new THREE.BoxGeometry(...a), C = (...a) => new THREE.CylinderGeometry(...a), S = (...a) => new THREE.SphereGeometry(...a), K = (...a) => new THREE.CapsuleGeometry(...a);
const std = (color, roughness = 0.7, metalness = 0.1, ex = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...ex });
const addM = (p, g, m, x = 0, y = 0, z = 0, sh = false) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); if (sh) o.castShadow = true; p.add(o); return o; };

export function createCharacter(role = 'player', pedIdx = 0) {
  const root = new THREE.Group(), isCop = role === 'cop', isPlayer = role === 'player', isPed = role === 'ped';
  const pp = [[0xfb7185, 0xffffff, 0x334155, 0xdca782, 0x1e1512], [0x14b8a6, 0xfef08a, 0x1e293b, 0xc68a63, 0x2a1c14], [0xf59e0b, 0xf8fafc, 0x475569, 0xe2b796, 0x4a2f1d], [0x8b5cf6, 0xfda4af, 0x1f2937, 0xb97c56, 0x111827], [0x38bdf8, 0xfef3c7, 0x374151, 0xd9a27c, 0x3b2416]][pedIdx % 5];
  const jm = std(isPlayer ? 0x1a1f2e : isCop ? 0x132043 : pp[0], 0.68, 0.08), sm = std(isPlayer ? 0xfb7185 : isCop ? 0x22d3ee : pp[1], 0.65, 0);
  const pm = std(isPlayer ? 0x1f2430 : isCop ? 0x0f172a : pp[2], 0.78, 0), skm = std(isPlayer ? 0xd8a47f : isCop ? 0xe0b592 : pp[3], 0.58, 0);
  const bm = std(0x11151c, 0.65, 0.15), gm = std(0x111827, 0.52, 0.28), gunm = std(0x111827, 0.25, 0.82);

  root.add(createContactShadow(1.15, 1.15, 0.58));
  const rig = new THREE.Group(); root.add(rig);
  const hips = new THREE.Group(); hips.position.y = 0.94; rig.add(hips);
  addM(hips, C(0.18, 0.165, 0.16, 12), pm, 0, 0.02).scale.set(1.18, 1, 0.72);
  addM(hips, C(0.22, 0.175, 0.5, 14), jm, 0, 0.3, 0, true).scale.set(1.1, 1, 0.66);

  if (isCop) {
    addM(hips, C(0.235, 0.205, 0.39, 12), gm, 0, 0.32, 0, true).scale.set(1.1, 1, 0.74);
    [-0.09, 0, 0.09].forEach((px) => addM(hips, B(0.065, 0.11, 0.05), std(0x1e293b, 0.65), px, 0.23, 0.17));
    addM(hips, B(0.14, 0.045, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0, 0.42, 0.175);
    addM(hips, C(0.195, 0.195, 0.065, 12), gm, 0, 0.09).scale.set(1.15, 1, 0.76);
  } else {
    addM(hips, C(0.13, 0.11, 0.46, 10), sm, 0, 0.3, 0.055).scale.set(0.95, 1, 0.72);
    if (isPlayer) addM(hips, new THREE.TorusGeometry(0.115, 0.032, 8, 14, Math.PI * 1.4), jm, 0, 0.54, -0.01).rotation.set(Math.PI / 2, 0, -Math.PI * 0.2);
  }
  addM(hips, C(0.058, 0.068, 0.11, 10), skm, 0, 0.59);
  addM(hips, S(0.145, 16, 14), skm, 0, 0.73, 0, true).scale.set(0.94, 1.08, 0.98);
  if (isCop) {
    addM(hips, S(0.162, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), gm, 0, 0.75, -0.005, true);
    addM(hips, C(0.156, 0.156, 0.075, 14, 1, true, -0.85, 1.7), std(0x0b253d, 0.06, 0.94, { envMapIntensity: 1.8, side: THREE.DoubleSide }), 0, 0.735, 0.015);
  } else {
    addM(hips, S(0.154, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), std(isPlayer ? 0x141218 : pp[4], 0.78), 0, 0.755, -0.015).scale.set(0.98, 1.05, 1.04);
    if (isPlayer) addM(hips, B(0.22, 0.045, 0.06), std(0x090d16, 0.1, 0.92), 0, 0.74, 0.125);
  }

  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.275, 0.5, 0); hips.add(sh);
    addM(sh, S(isCop ? 0.088 : 0.072, 10, 8), isCop ? gm : jm); addM(sh, K(0.062, 0.19, 6, 10), jm, 0, -0.14, 0, true);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    addM(el, S(0.056, 8, 8), isCop ? gm : jm); addM(el, K(0.052, 0.18, 6, 10), isCop ? jm : skm, 0, -0.13, 0, true); addM(el, S(0.048, 8, 8), isCop ? gm : skm, 0, -0.26);
    return { shoulder: sh, elbow: el };
  };
  const leftArm = mkArm(-1), rightArm = mkArm(1);

  const wg = new THREE.Group(); wg.position.set(0, -0.27, 0.12);
  addM(wg, B(0.075, 0.115, 0.5), gunm, 0, 0, 0.18); addM(wg, B(0.045, 0.16, 0.08), gunm, 0, -0.1, 0.22).rotation.x = 0.2;
  addM(wg, C(0.02, 0.02, 0.36, 8), gunm, 0, 0.02, 0.52).rotation.x = Math.PI / 2;
  const muzzleFlash = createGlowSprite(0xffb84d, 1.55, 0); muzzleFlash.position.set(0, 0.02, 0.78); wg.add(muzzleFlash);
  if (!isPed) rightArm.elbow.add(wg);

  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 0.125, -0.02, 0); hips.add(hip);
    addM(hip, K(0.078, 0.28, 6, 10), pm, 0, -0.21, 0, true);
    if (isCop && side === 1) { addM(hip, C(0.086, 0.086, 0.045, 10), gm, 0, -0.18); addM(hip, B(0.065, 0.17, 0.095), gm, 0.085, -0.19, 0.02); }
    const kn = new THREE.Group(); kn.position.y = -0.43; hip.add(kn);
    addM(kn, S(isCop ? 0.072 : 0.064, 8, 8), isCop ? gm : pm); addM(kn, K(0.064, 0.28, 6, 10), pm, 0, -0.21, 0, true);
    addM(kn, K(0.068, 0.11, 6, 8), bm, 0, -0.42, 0.045).rotation.x = Math.PI / 2;
    return { hip, knee: kn };
  };
  const leftLeg = mkLeg(-1), rightLeg = mkLeg(1);

  const ch = {
    mesh: root, rig, hips, leftArm, rightArm, leftLeg, rightLeg, weaponGroup: wg, muzzleFlash, flashTimer: 0, pose: 'idle',
    setPose(pose, t = 0) {
      this.pose = pose; rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); hips.position.y = 0.94; hips.rotation.set(0, 0, 0);
      if (pose === 'aim' || pose === 'crouch') {
        const cr = pose === 'crouch'; hips.position.y = cr ? 0.62 : 0.88; hips.rotation.set(cr ? 0.18 : 0, cr ? 0 : -0.22, 0);
        rightArm.shoulder.rotation.set(cr ? -1.42 : -1.38, -0.15, -0.09); rightArm.elbow.rotation.set(-0.34, 0, 0);
        leftArm.shoulder.rotation.set(-1.27, 0.54, 0.17); leftArm.elbow.rotation.set(-0.65, 0.22, 0); wg.rotation.set(1.52, 0, 0);
        leftLeg.hip.rotation.set(cr ? -0.95 : -0.24, 0, 0.08); leftLeg.knee.rotation.set(cr ? 1.45 : 0.32, 0, 0);
        rightLeg.hip.rotation.set(cr ? -0.45 : 0.22, 0, -0.08); rightLeg.knee.rotation.set(cr ? 1.25 : 0.24, 0, 0);
      } else if (pose === 'run' || pose === 'walk') {
        const r = pose === 'run', s = Math.sin(t * (r ? 10 : 4.5));
        hips.position.y = (r ? 0.92 : 0.93) + Math.abs(s) * (r ? 0.05 : 0.02); hips.rotation.x = r ? 0.12 : 0;
        leftLeg.hip.rotation.set(s * (r ? 0.68 : 0.36), 0, 0); leftLeg.knee.rotation.set(Math.max(0, -s * (r ? 0.85 : 0.4)), 0, 0);
        rightLeg.hip.rotation.set(-s * (r ? 0.68 : 0.36), 0, 0); rightLeg.knee.rotation.set(Math.max(0, s * (r ? 0.85 : 0.4)), 0, 0);
        leftArm.shoulder.rotation.set(-s * (r ? 0.55 : 0.3), 0, 0.1); leftArm.elbow.rotation.set(r ? -0.65 : -0.25, 0, 0);
        rightArm.shoulder.rotation.set(s * (r ? 0.45 : 0.3) - (r ? 0.35 : 0), 0, -0.1); rightArm.elbow.rotation.set(r ? -0.75 : -0.25, 0, 0);
        if (r) wg.rotation.set(1.1, 0, 0);
      } else if (pose === 'downed') {
        rig.position.set(0, 0.2, 0); rig.rotation.set(-Math.PI / 2, 0, 0.35);
        leftArm.shoulder.rotation.set(-0.45, 0, 0.65); leftArm.elbow.rotation.set(-0.7, 0, 0);
        rightArm.shoulder.rotation.set(-0.85, 0, -0.45); rightArm.elbow.rotation.set(-0.55, 0, 0);
        leftLeg.hip.rotation.set(0.25, 0, 0.22); leftLeg.knee.rotation.set(0.65, 0, 0); rightLeg.hip.rotation.set(-0.18, 0, -0.15); rightLeg.knee.rotation.set(0.45, 0, 0);
      } else {
        leftArm.shoulder.rotation.set(0.08, 0, 0.12); leftArm.elbow.rotation.set(-0.28, 0, 0);
        rightArm.shoulder.rotation.set(0.12, 0, -0.12); rightArm.elbow.rotation.set(-0.35, 0, 0); wg.rotation.set(1.15, 0, 0);
        leftLeg.hip.rotation.set(0, 0, 0.04); leftLeg.knee.rotation.set(0.06, 0, 0); rightLeg.hip.rotation.set(0, 0, -0.04); rightLeg.knee.rotation.set(0.06, 0, 0);
      }
    },
    triggerMuzzleFlash(dur = 0.08) { this.flashTimer = dur; this.muzzleFlash.material.opacity = 0.98; },
    getMuzzleWorldPos(t = new THREE.Vector3()) { this.mesh.updateMatrixWorld(true); return this.muzzleFlash.getWorldPosition(t); },
  };
  ch.setPose('idle', 0); return ch;
}

export function updatePedestrians(g, dt, pPos, pDirZ) {
  const shot = g.lastGunshotPos && (g.time - g.lastGunshotTime) < 6, spd = g.inVehicle && g.currentVehicle ? Math.abs(g.currentVehicle.speed) : 0;
  for (const ped of g.world.sidewalkPeds) {
    let px = ped.char.mesh.position.x, pz = ped.char.mesh.position.z;
    if (Math.hypot(px - pPos.x, pz - pPos.z) > 115) { pz = Math.max(-200, Math.min(200, pPos.z + pDirZ * (45 + Math.random() * 55))); ped.char.mesh.position.z = ped.homeZ = pz; ped.panicTimer = 0; ped.panicked = false; }
    let tx = null, tz = null;
    if (shot && Math.hypot(px - g.lastGunshotPos.x, pz - g.lastGunshotPos.z) < 28) { tx = g.lastGunshotPos.x; tz = g.lastGunshotPos.z; }
    else if (g.wantedStars >= 1 && spd > 14 && Math.hypot(px - pPos.x, pz - pPos.z) < 18) { tx = pPos.x; tz = pPos.z; }
    if (tx !== null) { ped.panicked = true; ped.panicTimer = 5; ped.fleeAngle = Math.atan2(px - tx, pz - tz); }
    if (ped.panicTimer > 0) {
      ped.panicTimer -= dt; const fs = 5.4 * dt, lo = ped.side === 'east' ? 12.4 : -16.2, hi = ped.side === 'east' ? 15.8 : -12.6;
      ped.char.mesh.position.x = Math.max(lo, Math.min(hi, px + Math.sin(ped.fleeAngle) * fs)); ped.char.mesh.position.z += Math.cos(ped.fleeAngle) * fs;
      ped.char.mesh.rotation.y = ped.fleeAngle; ped.char.setPose('run', g.time + ped.phase);
    } else {
      ped.panicked = false; ped.char.mesh.position.z += Math.cos(ped.baseRy) * 1.1 * dt;
      if (Math.abs(ped.char.mesh.position.z - ped.homeZ) > 12) ped.baseRy += Math.PI;
      ped.char.mesh.rotation.y = ped.baseRy; ped.char.setPose('walk', g.time + ped.phase);
    }
  }
}
