// Coralina Bay: Sunset Syndicate — Next-Gen Sculpted Vehicles, Driving Physics & Stealing
import * as THREE from 'three';
import { WORLD_BOUNDS } from '../core/config.js';
import {
  createContactShadow, createGlowSprite, getCBPDDoorTexture, getFireSpriteTexture,
  getHeroSideSeamTexture, getHeroTopStripeTexture, getSmokeSpriteTexture,
} from '../world/textures.js';

const B = (...a) => new THREE.BoxGeometry(...a), C = (...a) => new THREE.CylinderGeometry(...a), P = (...a) => new THREE.PlaneGeometry(...a), G = () => new THREE.Group();
const std = (color, roughness = 0.5, metalness = 0.3, ex = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...ex });
const bas = (o) => new THREE.MeshBasicMaterial(o);
const addM = (p, g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); p.add(o); return o; };

function createWheel(r = 0.39, w = 0.28, isHero = false) {
  const g = new THREE.Group();
  addM(g, C(r, r, w, 24), std(0x0e121a, 0.88, 0.1), 0, 0, 0, 0, 0, Math.PI / 2).castShadow = true;
  addM(g, C(r * 0.68, r * 0.68, w + 0.015, 20), std(isHero ? 0xf8fafc : 0xdbe4f0, 0.12, 0.96, { envMapIntensity: 2.1 }), 0, 0, 0, 0, 0, Math.PI / 2);
  const spM = std(isHero ? 0xe2e8f0 : 0x94a3b8, 0.16, 0.92, { envMapIntensity: 1.9 });
  for (let i = 0; i < 6; i++) addM(g, B(w + 0.028, r * 1.16, 0.04), spM, 0, 0, 0, (i * Math.PI) / 6);
  addM(g, C(r * 0.22, r * 0.22, w + 0.036, 12), std(0x1e293b, 0.26, 0.82), 0, 0, 0, 0, 0, Math.PI / 2);
  addM(g, B(w * 0.65, r * 0.36, r * 0.26), std(isHero ? 0xf43f5e : 0xf59e0b, 0.32, 0.65), 0, 0.02, r * 0.38);
  return g;
}

function extrudeProfile(pts, width, bevel = 0.08) {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.1, width - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -(width - bevel * 2) / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals(); return g;
}

export function createVehicleMesh(type = 'hero', bodyColor = 0xf43f5e) {
  const root = new THREE.Group(), isPolice = type === 'police', isSport = type === 'hero' || type === 'exotic';
  const bodyMat = std(isPolice ? 0x0c1322 : bodyColor, isSport ? 0.11 : isPolice ? 0.16 : 0.22, isSport ? 0.88 : isPolice ? 0.74 : 0.62, { envMapIntensity: isSport ? 2.35 : 1.85 });
  const whiteMat = std(0xf8fafc, 0.18, 0.32, { envMapIntensity: 1.65 });
  const darkTrim = std(0x090d16, 0.36, 0.58, { envMapIntensity: 1.5 });
  const glassMat = std(0x071324, 0.03, 0.96, { envMapIntensity: 2.6, transparent: true, opacity: 0.86 });
  const chromeMat = std(0xf1f5f9, 0.1, 0.98, { envMapIntensity: 2.2 });
  const W = isSport ? 2.12 : 1.98, L = isSport ? 4.86 : isPolice ? 4.88 : 4.55;

  const lowerProf = isSport ? [[-2.4, 0.26], [-2.26, 0.82], [-1.56, 0.9], [-0.4, 0.91], [1.02, 0.86], [1.92, 0.68], [2.42, 0.44], [2.44, 0.25]] : [[-2.4, 0.28], [-2.3, 0.84], [-1.35, 0.93], [1.18, 0.91], [2.26, 0.78], [2.42, 0.48], [2.44, 0.28]];
  const lower = addM(root, extrudeProfile(lowerProf, W, 0.11), bodyMat); lower.castShadow = lower.receiveShadow = true;
  addM(root, B(W * 0.96, 0.07, 0.42), darkTrim, 0, 0.24, L * 0.47);
  for (const s of [-1, 1]) addM(root, B(0.12, 0.11, 2.35), darkTrim, s * W * 0.505, 0.27, 0);

  const glassProf = isSport ? [[-1.44, 0.86], [-0.74, 1.29], [0.46, 1.29], [1.18, 0.84]] : [[-1.44, 0.88], [-0.94, 1.43], [0.68, 1.43], [1.28, 0.88]];
  addM(root, extrudeProfile(glassProf, W * 0.79, 0.055), glassMat).castShadow = true;
  addM(root, B(W * 0.74, 0.07, isSport ? 1.24 : 1.62), isPolice ? whiteMat : bodyMat, 0, isSport ? 1.31 : 1.45, isSport ? -0.14 : -0.13);

  const pH = isSport ? 0.52 : 0.62, pY = isSport ? 1.08 : 1.16;
  for (const s of [-1, 1]) {
    const sx = s * W * 0.395;
    addM(root, B(0.055, pH + 0.14, 0.075), darkTrim, sx, pY, isSport ? 0.78 : 0.95, isSport ? -0.94 : -0.72);
    addM(root, B(0.05, pH * 0.88, 0.09), darkTrim, sx, pY, -0.08);
    addM(root, B(0.06, pH + 0.12, 0.11), isPolice ? whiteMat : bodyMat, sx, pY, isSport ? -1.04 : -1.16, isSport ? 0.92 : 0.68);
    addM(root, B(0.16, 0.05, 0.07), darkTrim, s * W * 0.51, 0.91, 0.64);
    addM(root, B(0.18, 0.095, 0.14), bodyMat, s * W * 0.58, 0.93, 0.6);
  }

  const wheels = [], archG = new THREE.TorusGeometry(0.45, 0.055, 8, 16, Math.PI);
  for (const [wx, wy, wz] of [[-W * 0.49, 0.39, 1.46], [W * 0.49, 0.39, 1.46], [-W * 0.49, 0.39, -1.44], [W * 0.49, 0.39, -1.44]]) {
    const w = createWheel(0.39, isSport ? 0.32 : 0.27, isSport); w.position.set(wx, wy, wz); root.add(w); wheels.push(w);
    addM(root, archG, darkTrim, wx + (wx > 0 ? 0.06 : -0.06), wy + 0.02, wz, 0, Math.PI / 2);
  }

  addM(root, B(W * 0.72, 0.19, 0.14), darkTrim, 0, 0.44, L * 0.495);
  addM(root, B(W * 0.88, 0.22, 0.22), darkTrim, 0, 0.34, -L * 0.495);
  for (const fx of [-0.32, 0, 0.32]) addM(root, B(0.04, 0.16, 0.24), darkTrim, fx, 0.31, -L * 0.505);
  for (const ex of [-0.52, 0.52]) addM(root, C(0.068, 0.078, 0.26, 12), chromeMat, ex, 0.33, -L * 0.515, Math.PI / 2);

  const headM = bas({ color: 0xfffaf0 });
  for (const sx of [-0.68, 0.68]) {
    addM(root, B(0.46, 0.075, 0.1), headM, sx, 0.58, L * 0.492);
    const hg = createGlowSprite(0xfff4cc, 1.05, 0.52); hg.position.set(sx, 0.58, L * 0.53); root.add(hg);
  }
  addM(root, B(W * 0.88, 0.11, 0.09), darkTrim, 0, 0.7, -L * 0.492);
  addM(root, B(W * 0.84, 0.052, 0.095), bas({ color: 0xff1638 }), 0, 0.7, -L * 0.498);
  addM(root, B(W * 0.78, 0.02, 0.1), bas({ color: 0xff8095 }), 0, 0.7, -L * 0.501);
  for (const sx of [-0.66, 0.66]) { const tg = createGlowSprite(0xff1e42, 1.2, 0.62); tg.position.set(sx, 0.7, -L * 0.54); root.add(tg); }

  let nitroGroup = null;
  if (isSport) {
    addM(root, P(W * 0.74, 1.65), bas({ map: getHeroTopStripeTexture(), transparent: true, depthWrite: false }), 0, 0.92, 1.38, -Math.PI / 2);
    for (const s of [-1, 1]) addM(root, P(3.3, 0.6), bas({ map: getHeroSideSeamTexture(), transparent: true, depthWrite: false }), s * W * 0.506, 0.58, -0.02, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    addM(root, B(W * 0.98, 0.055, 0.34), darkTrim, 0, 1.18, -2.14, 0.13);
    for (const sx of [-0.64, 0.64]) addM(root, B(0.06, 0.34, 0.2), darkTrim, sx, 1, -2.12);
    for (const sx of [-W * 0.49, W * 0.49]) addM(root, B(0.04, 0.24, 0.42), bodyMat, sx, 1.17, -2.14);
    nitroGroup = new THREE.Group();
    for (const ex of [-0.52, 0.52]) {
      const o = createGlowSprite(0xff7b22, 1.4, 0.88), c = createGlowSprite(0x38e8ff, 0.92, 0.96);
      o.position.set(ex, 0.34, -L * 0.58); c.position.set(ex, 0.34, -L * 0.55); nitroGroup.add(o, c);
    }
    nitroGroup.visible = false; root.add(nitroGroup);
  }

  let redGlow = null, blueGlow = null;
  if (isPolice) {
    for (const sx of [-0.46, 0.46]) addM(root, B(0.08, 0.46, 0.14), darkTrim, sx, 0.54, L * 0.52);
    for (const py of [0.42, 0.68]) addM(root, B(1.12, 0.07, 0.09), darkTrim, 0, py, L * 0.53);
    const dM = new THREE.MeshStandardMaterial({ map: getCBPDDoorTexture(), roughness: 0.22, metalness: 0.42, envMapIntensity: 1.5 });
    for (const s of [-1, 1]) addM(root, P(3.65, 0.62), dM, s * W * 0.506, 0.62, 0, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    addM(root, B(1.26, 0.05, 0.22), darkTrim, 0, 1.49, -0.06);
    addM(root, B(0.56, 0.065, 0.18), bas({ color: 0xff2244 }), -0.31, 1.53, -0.06);
    addM(root, B(0.56, 0.065, 0.18), bas({ color: 0x22b8ff }), 0.31, 1.53, -0.06);
    redGlow = createGlowSprite(0xff2a55, 2.2, 0.9); redGlow.position.set(-0.35, 1.61, -0.06);
    blueGlow = createGlowSprite(0x22b8ff, 2.2, 0.9); blueGlow.position.set(0.35, 1.61, -0.06);
    root.add(redGlow, blueGlow);
  }
  root.add(createContactShadow(W * 1.38, L * 1.24, 0.76));
  return { mesh: root, bodyMat, wheels, redGlow, blueGlow, nitroGroup };
}

export function createScooterMesh(col = 0x22d3ee) {
  const r = G(), bm = std(col, 0.18, 0.72, { envMapIntensity: 1.8 }), dm = std(0x111827, 0.65, 0.2);
  addM(r, B(0.52, 0.16, 1.42), bm, 0, 0.34); addM(r, B(0.46, 0.76, 0.34), bm, 0, 0.74, 0.56, -0.18);
  addM(r, B(0.44, 0.14, 0.76), dm, 0, 0.76, -0.22); addM(r, C(0.03, 0.03, 0.72, 8), dm, 0, 1.12, 0.48, 0, 0, Math.PI / 2);
  const wf = createWheel(0.26, 0.14), wr = createWheel(0.26, 0.16); wf.position.set(0, 0.26, 0.64); wr.position.set(0, 0.26, -0.58);
  r.add(wf, wr, createContactShadow(0.95, 1.95, 0.6)); return { mesh: r, bodyMat: bm, wheels: [wf, wr], isScooter: true };
}
export function createWindowShooter(side = 1) {
  const g = G(), um = std(0x162442, 0.72, 0.1);
  addM(g, B(0.38, 0.42, 0.26), um); addM(g, new THREE.SphereGeometry(0.14, 12, 10), std(0xdba784, 0.65, 0), 0, 0.3);
  addM(g, B(0.55, 0.12, 0.12), um, side * 0.38, 0.1, 0.08); addM(g, B(0.68, 0.08, 0.08), std(0x111827, 0.25, 0.8), side * 0.78, 0.14, 0.12);
  const fl = createGlowSprite(0xffdf80, 1.3, 0.92); fl.position.set(side * 1.16, 0.16, 0.14); g.add(fl);
  return { group: g, muzzlePosLocal: new THREE.Vector3(side * 1.15, 0.16, 0.14) };
}
export function createBurningWreck() {
  const r = G(), base = createVehicleMesh('police');
  base.mesh.traverse((o) => { if (o.isMesh && o.material?.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.24); if (o.material.roughness !== undefined) o.material.roughness = 0.92; } });
  if (base.redGlow) base.redGlow.visible = false; if (base.blueGlow) base.blueGlow.visible = false;
  base.mesh.rotation.set(-0.06, 0, 0.18); base.mesh.position.y = 0.06; r.add(base.mesh);
  const lw = createWheel(0.36, 0.26); lw.position.set(1.52, 0.14, 1.55); lw.rotation.set(Math.PI / 2 - 0.05, 0.3, 0.1); r.add(lw);
  const fT = getFireSpriteTexture(), sT = getSmokeSpriteTexture();
  for (const [x, y, z, sx, sy, op] of [[0, 1.35, 1.05, 2.8, 3.2, 0.96], [0.32, 1.75, 0.82, 3.3, 3.8, 0.88], [-0.34, 1.52, 1.12, 3, 3.4, 0.84], [0.12, 2.25, 0.65, 2.6, 3.1, 0.74]]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fT, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(x, y, z); s.scale.set(sx, sy, 1); r.add(s);
  }
  const hg = createGlowSprite(0xff6b22, 4.4, 0.56); hg.position.set(0.05, 1.45, 0.95); r.add(hg);
  for (let i = 0; i < 9; i++) {
    const t = i / 8, sc = 2.2 + i * 0.58, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sT, color: i < 2 ? 0x5c2e1c : i < 4 ? 0x2c2424 : 0x181c26, transparent: true, opacity: 0.74 - t * 0.36, depthWrite: false }));
    s.scale.set(sc, sc * 0.92, 1); s.position.set(0.15 + Math.pow(t, 1.3) * 3.4 + (i % 2 ? -0.18 : 0.22), 1.95 + i * 0.88, 0.75 - Math.pow(t, 1.2) * 2.1); r.add(s);
  }
  const fl = new THREE.PointLight(0xff6b22, 22, 24, 1.5); fl.position.set(0, 2.2, 0.9); r.add(fl); return r;
}
export function createPoliceHelicopter() {
  const g = G(), hm = std(0x0f172a, 0.28, 0.7, { envMapIntensity: 1.7 }), sm = std(0xf8fafc, 0.28, 0.1), gm = std(0x1e3a5f, 0.06, 0.94, { transparent: true, opacity: 0.8 });
  addM(g, B(2.3, 1.75, 5.4), hm).castShadow = true; addM(g, new THREE.SphereGeometry(1.18, 16, 12), gm, 0, -0.06, 2.6).scale.set(0.95, 0.75, 1.2);
  addM(g, B(2.34, 0.24, 4.4), sm, 0, -0.22, 0.1); addM(g, B(0.42, 0.52, 5.2), hm, 0, 0.25, -4.9); addM(g, B(0.14, 1.55, 0.9), hm, 0, 0.65, -7.2);
  for (const sx of [-1.05, 1.05]) addM(g, C(0.06, 0.06, 4.2, 8), hm, sx, -1.35, 0.3, Math.PI / 2);
  const rotorGroup = G(); rotorGroup.position.set(0, 1.15, 0.2);
  addM(rotorGroup, C(0.12, 0.16, 0.55, 10), hm); addM(rotorGroup, B(10.8, 0.05, 0.28), hm); addM(rotorGroup, B(0.28, 0.05, 10.8), hm);
  const tailRotor = addM(g, B(0.06, 1.6, 0.16), hm, 0.28, 0.55, -7.3);
  const spotCone = addM(g, new THREE.ConeGeometry(4.2, 18.5, 22, 1, true), bas({ color: 0xfff8dc, transparent: true, opacity: 0.19, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }), 0, -9.8, 2.2, 0.08);
  const sl = createGlowSprite(0xffffff, 2.4, 0.92); sl.position.set(0, -0.78, 2.45); g.add(rotorGroup, sl);
  return { mesh: g, rotorGroup, tailRotor, spotCone };
}
export function createPatrolBoat() {
  const g = G(); addM(g, B(3.2, 1.1, 8.8), std(0xf8fafc, 0.32, 0.1), 0, 0.5); addM(g, B(3.26, 0.28, 8.85), std(0x0284c7, 0.3, 0.2), 0, 0.72);
  addM(g, B(2.2, 1.25, 3.2), std(0x0f172a, 0.22, 0.55), 0, 1.55, -0.4); const b = createGlowSprite(0x22d3ee, 2.1, 0.9); b.position.set(0, 2.45, -0.4); g.add(b); return g;
}
export function createYacht(sc = 1) {
  const g = G(), wm = std(0xfafcff, 0.2, 0.24, { envMapIntensity: 1.5 });
  addM(g, B(5.2, 1.9, 16.5), wm, 0, 0.95); addM(g, B(5.26, 0.45, 16.56), std(0x0e2a47, 0.22, 0.45), 0, 0.55); addM(g, B(4.8, 0.16, 15.2), std(0xb6814c, 0.72, 0), 0, 1.95);
  addM(g, B(4.1, 1.75, 8.6), wm, 0, 2.85, -1.2); addM(g, B(4.18, 0.65, 7.6), std(0x0d2642, 0.05, 0.94, { envMapIntensity: 2.1 }), 0, 3.05, -1);
  addM(g, B(3.2, 1.25, 5.2), wm, 0, 4.35, -1.8); addM(g, C(0.08, 0.14, 2.2, 8), wm, 0, 5.8, -2); g.scale.setScalar(sc); return g;
}

export function updatePlayerVehicle(g, dt, boost) {
  g.nearbyVehicle = null;
  const v = g.currentVehicle, a = g.input.w ? 28 : g.input.s ? -22 : 0;
  v.speed += (a + (boost ? 14 : 0)) * dt;
  if (!a && !boost) v.speed *= Math.pow(0.28, dt);
  if (g.input.space) { v.speed *= Math.pow(0.18, dt); if (Math.abs(v.speed) > 8 && Math.random() < 0.45) g.vfx.spawnSmoke(v.mesh.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 1, 0.7); }
  v.speed = Math.max(-14, Math.min(boost ? Math.max(56, v.maxSpeed) : v.maxSpeed, v.speed));
  const st = ((g.input.a || g.input.arrowLeft) ? 1 : 0) - ((g.input.d || g.input.arrowRight) ? 1 : 0);
  if (Math.abs(v.speed) > 0.6) v.heading += st * (v.isScooter ? 2.5 : 2.15) * dt * Math.sign(v.speed);
  const nx = v.mesh.position.x + Math.sin(v.heading) * v.speed * dt, nz = v.mesh.position.z + Math.cos(v.heading) * v.speed * dt;
  if (!g.collidesBuilding(nx, nz, v.radius || 1.8)) { v.mesh.position.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, nx)); v.mesh.position.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, nz)); }
  else { v.speed *= -0.35; v.damagePct = Math.min(95, v.damagePct + 4); g.vfx.spawnSparks(v.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 6); g.sound.playImpact(true); }
  v.mesh.rotation.y = v.heading; v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });
  if (v.damagePct > 55 && Math.random() < dt * 8.5) { const hd = v.isScooter ? 0.55 : 1.45; g.vfx.spawnSmoke(v.mesh.position.clone().add(new THREE.Vector3(Math.sin(v.heading) * hd, 0.92, Math.cos(v.heading) * hd)), 1.15, 1.05, 0x334155); }
  const kmh = Math.round(Math.abs(v.speed) * 3.6); if (kmh > g.career.topSpeedKmh) g.career.topSpeedKmh = kmh;
}

export function togglePlayerVehicle(g) {
  if (g.inVehicle && g.currentVehicle) {
    g.inVehicle = false; const v = g.currentVehicle; v.speed *= 0.2; g.playerChar.mesh.visible = true;
    g.playerChar.mesh.position.set(v.mesh.position.x - Math.cos(v.heading) * 2.25, 0, v.mesh.position.z + Math.sin(v.heading) * 2.25);
    g.playerChar.mesh.rotation.y = v.heading; g.cameraCtrl.onExitVehicle(v.heading); g.sound.playClick(); return;
  }
  const p = g.playerChar.mesh.position; let near = null, best = 7.2;
  for (const v of g.vehicles) { if (!v.mesh.visible) continue; const d = Math.hypot(v.mesh.position.x - p.x, v.mesh.position.z - p.z); if (d < best) { best = d; near = v; } }
  if (!near) return;
  g.currentVehicle = near; g.inVehicle = true; g.playerChar.mesh.visible = false; g.cameraCtrl.onEnterVehicle(near.heading);
  if (near !== g.heroVehicle) { g.career.vehiclesBoosted += 1; g.wantedStars = Math.max(g.wantedStars, near.type === 'police' ? 2 : 1); g.dialogue = { speaker: 'VALERIA REYES', role: 'broker', text: `Nice boost — ${near.name} is yours!`, timer: 6 }; }
  g.sound.playClick();
}
