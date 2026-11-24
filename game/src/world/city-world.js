// Coralina Bay: Sunset Syndicate — Open-World City, Bay Bridge, Art-Deco Strip & Mangrove Bazaar
import * as THREE from 'three';
import { INTERACTIVE_LOCATIONS } from '../core/config.js';
import { createCharacter } from '../entities/pedestrians.js';
import { createYacht } from '../entities/vehicles.js';
import { LightingSystem } from './lighting-fx.js';
import {
  createBuildingWindowTexture, createGlowSprite, createOceanShimmerTexture, createRoadTextures,
  createSignTexture, createStripedAwningTexture, createSunPathTexture, getCrateSlatsTexture,
  getGlowTexture, getHazardDrumTexture,
} from './textures.js';

const B = (...a) => new THREE.BoxGeometry(...a), C = (...a) => new THREE.CylinderGeometry(...a), P = (...a) => new THREE.PlaneGeometry(...a), V = (...a) => new THREE.Vector3(...a), G = () => new THREE.Group();
const std = (color, roughness = 0.7, metalness = 0.1, ex = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...ex });
const mapM = (map, roughness = 0.72, metalness = 0.1, ex = {}) => new THREE.MeshStandardMaterial({ map, roughness, metalness, ...ex });
const bas = (o) => new THREE.MeshBasicMaterial(o);
const addM = (p, g, m, x = 0, y = 0, z = 0, sh = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); if (sh & 1) o.castShadow = true; if (sh & 2) o.receiveShadow = true; p.add(o); return o; };
const tube = (pts, seg, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 7, false), m);

export class CityWorld {
  constructor(scene, renderer = null) {
    Object.assign(this, { scene, renderer, mode: 'sunset', isNight: false, colliders: [], palms: [], lanternGlows: [], streetLights: [], marketPoints: [], yachts: [], sidewalkPeds: [], interactiveMarkers: [], missionBeacon: null });
    this.lighting = new LightingSystem(scene, renderer);
    this._buildTerrainAndCoast(); this._buildBaySuspensionBridge(); this._buildRoads(); this._buildArtDecoStrip();
    this._buildSkyline(); this._buildNightMarket(); this._buildBeachAndPalms(); this._buildStreetlights();
    this._buildCrosswalks(); this._buildYachtsAndPeds(); this._buildMissionBeacon(); this._buildInteractiveLocations();
    this.setMode('sunset');
  }

  setMode(mode) {
    this.mode = mode; this.isNight = mode === 'night';
    this.lighting.applyMode(mode, { sunPathMesh: this.sunPathMesh, oceanMat: this.oceanMat, lanternGlows: this.lanternGlows, streetLights: this.streetLights, marketPoints: this.marketPoints });
  }

  _buildTerrainAndCoast() {
    const s = this.scene;
    addM(s, P(340, 520), std(0x2c3645, 0.92, 0.05), -150, -0.06, 0, 2).rotation.x = -Math.PI / 2;
    addM(s, P(46, 520), std(0xe6c899, 0.94, 0.02), 35, -0.02, 0, 2).rotation.x = -Math.PI / 2;
    addM(s, P(5.5, 520), bas({ color: 0xdffbff, transparent: true, opacity: 0.44 }), 57.5, -0.04, 0).rotation.x = -Math.PI / 2;
    this.oceanTex = createOceanShimmerTexture();
    this.oceanMat = new THREE.MeshStandardMaterial({ map: this.oceanTex, color: 0x14a4bd, roughness: 0.12, metalness: 0.68, envMapIntensity: 1.95 });
    addM(s, P(540, 720), this.oceanMat, 324, -0.18, -40).rotation.x = -Math.PI / 2;
    this.sunPathMesh = addM(s, P(76, 260), bas({ map: createSunPathTexture(), transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }), 92, -0.12, -110);
    this.sunPathMesh.rotation.x = -Math.PI / 2;
    addM(s, C(72, 84, 3.2, 24), std(0xd9be90, 0.9, 0), 148, 0.8, -172);
  }

  _buildBaySuspensionBridge() {
    const g = G(), tM = std(0xd9483b, 0.42, 0.34), cM = std(0xf4d29c, 0.35, 0.65);
    addM(g, B(240, 1.8, 16), std(0x263142, 0.72), 42, 16.5, -138, 3);
    for (const tx of [-12, 72]) {
      for (const tz of [-144.5, -131.5]) addM(g, B(3.2, 48, 3.2), tM, tx, 24, tz, 1);
      for (const by of [28, 42]) addM(g, B(2.4, 2.2, 15.6), tM, tx, by, -138);
      const b = createGlowSprite(0xff5a5f, 4.2, 0.88); b.position.set(tx, 49.5, -138); g.add(b);
    }
    for (const cz of [-144.5, -131.5]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, x = -12 + t * 84, y = 46 - 4 * t * (1 - t) * 24; pts.push(V(x, y, cz));
        if (i > 1 && i < 23 && i % 2 === 0) addM(g, C(0.11, 0.11, y - 17.2, 6), cM, x, 17.2 + (y - 17.2) / 2, cz);
      }
      g.add(tube(pts, 32, 0.36, cM), tube([V(-64, 17.5, cz), V(-38, 28, cz), V(-12, 46, cz)], 16, 0.34, cM), tube([V(72, 46, cz), V(106, 28, cz), V(138, 17.5, cz)], 16, 0.34, cM));
    }
    this.scene.add(g);
  }

  _buildRoads() {
    const { map, roughnessMap } = createRoadTextures(), rM = new THREE.MeshStandardMaterial({ map, roughnessMap, roughness: 0.64, metalness: 0.36, envMapIntensity: 1.9 });
    addM(this.scene, P(22, 480), rM, 0, 0.01, 0, 2).rotation.x = -Math.PI / 2;
    const wM = std(0x8f9aa8, 0.86, 0);
    for (const sx of [-14.2, 14.2]) addM(this.scene, B(6.4, 0.16, 480), wM, sx, 0.06, 0, 2);
    for (const cz of [60, -60]) { const cr = addM(this.scene, P(16, 150), rM, -76, 0.012, cz, 2); cr.rotation.set(-Math.PI / 2, 0, Math.PI / 2); }
  }

  _buildArtDecoStrip() {
    const trim = std(0xf8fafc, 0.45), rail = std(0x334155, 0.3, 0.72), acM = std(0x64748b, 0.6, 0.4), bayM = std(0x0f172a, 0.4, 0.65), s = this.scene;
    [
      [-98, 14, 18, 18, '#f5d0c5', 'HOTEL CORALINA', '#fb7185', '#e11d48'], [-74, 11, 17, 16, '#bae6fd', 'AZURA CLUB', '#22d3ee', '#0284c7'],
      [-48, 15, 18, 18, '#fde68a', 'SUNSET LOUNGE', '#f97316', '#ea580c'], [-24, 12, 17, 16, '#c7d2fe', 'PALM CASINO', '#c084fc', '#7c3aed'],
      [10, 11, 18, 20, '#a7f3d0', 'MARINA GARAGE', '#22d3ee', '#0d9488', 1], [36, 14, 17, 16, '#fbcfe8', 'TROPICA BAR', '#f43f5e', '#be123c'],
      [86, 13, 18, 18, '#fed7aa', 'HARBOR MOTEL', '#fbbf24', '#d97706'], [114, 12, 17, 18, '#bfdbfe', 'BAYSIDE SUITES', '#38bdf8', '#0369a1'],
    ].forEach(([z, h, w, d, col, sign, neon, awn, isG], idx) => {
      const bx = -26.5, rx = bx + w / 2;
      addM(s, B(w, h, d), mapM(createBuildingWindowTexture(col, '#ffdf9e', false, idx + 1), 0.76, 0.06), bx, h / 2, z, 3);
      this.colliders.push({ x: bx, z, hw: w / 2 + 0.6, hd: d / 2 + 0.6 });
      addM(s, B(w + 0.6, 1.1, d + 0.6), trim, bx, h + 0.55, z); addM(s, B(0.24, 0.28, d - 1.2), bas({ color: neon }), rx + 0.25, h + 0.4, z);
      for (let ac = 0; ac < 2; ac++) addM(s, B(2.2, 1.1, 1.8), acM, bx - 2 + ac * 4.5, h + 1.55, z - 3 + ac * 5.2);
      for (let fl = 0; fl < 2 && 5.4 + fl * 3.8 <= h - 1.6; fl++) { const fy = 5.4 + fl * 3.8; addM(s, B(1.5, 0.22, d * 0.72), trim, rx + 0.75, fy, z); addM(s, B(0.1, 0.85, d * 0.72), rail, rx + 1.44, fy + 0.48, z); }
      addM(s, B(3.2, 0.16, d * 0.84), mapM(createStripedAwningTexture(awn), 0.72, 0), rx + 1.45, 3.65, z, 1).rotation.z = -0.26;
      addM(s, B(0.35, 1.85, 8.8), bas({ map: createSignTexture(sign, '#0f172a', '#ffffff', neon) }), rx + 0.42, isG ? 5.1 : h - 1.5, z);
      if (isG) { addM(s, B(0.45, 4, 9.2), bayM, rx + 0.12, 2, z); const bg = createGlowSprite(0x22d3ee, 6.5, 0.52); bg.position.set(rx + 1.1, 2.6, z); s.add(bg); }
    });
  }

  _buildSkyline() {
    const s = this.scene;
    [[-64, -118, 24, 68, 24, '#2b3a55', '#fde68a', 'CORALINA PLAZA'], [-94, -88, 26, 86, 26, '#22314d', '#bae6fd', 'AZURA TOWER'], [-62, -48, 22, 52, 22, '#34415c', '#fed7aa', 'BAY FINANCIAL'], [-96, -26, 24, 64, 24, '#283652', '#fbcfe8'], [-68, 12, 22, 44, 22, '#313f59', '#fde68a'], [-98, 36, 24, 56, 24, '#24324c', '#a5f3fc'], [-92, 92, 26, 48, 24, '#2f3d57', '#fde68a']].forEach(([x, z, w, h, d, col, lit, sign], idx) => {
      const tex = createBuildingWindowTexture(col, lit, true, idx + 20); tex.repeat.set(2, Math.max(2, Math.round(h / 18)));
      addM(s, B(w, h, d), mapM(tex, 0.45, 0.38, { envMapIntensity: 1.4 }), x, h / 2, z, 3);
      addM(s, C(0.12, 0.35, 11, 8), std(0x94a3b8, 0.3, 0.8), x, h + 5.5, z);
      this.colliders.push({ x, z, hw: w / 2 + 0.8, hd: d / 2 + 0.8 });
      if (sign) addM(s, B(0.4, 3.2, 16), bas({ map: createSignTexture(sign, '#111827', '#fde68a', '#fb7185') }), x + w / 2 + 0.3, h - 4, z);
    });
  }

  _buildNightMarket() {
    const tc = document.createElement('canvas'); tc.width = tc.height = 256;
    const tctx = tc.getContext('2d'); tctx.fillStyle = '#151c29'; tctx.fillRect(0, 0, 256, 256);
    tctx.strokeStyle = 'rgba(5,9,18,0.82)'; tctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 32) { tctx.beginPath(); tctx.moveTo(i, 0); tctx.lineTo(i, 256); tctx.moveTo(0, i); tctx.lineTo(256, i); tctx.stroke(); }
    const tileTex = new THREE.CanvasTexture(tc); tileTex.colorSpace = THREE.SRGBColorSpace; tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(8, 10);
    addM(this.scene, P(48, 58), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.09, metalness: 0.62, envMapIntensity: 2 }), -44, 0.02, 60, 2).rotation.x = -Math.PI / 2;

    for (const [x, z, w, d, col] of [[-39, 55, 4.8, 3.4, 0xff8c52], [-46, 58, 5.4, 3.8, 0x22d3ee], [-42, 64, 4.5, 3.2, 0xfb7185], [-51, 55, 4.2, 3, 0xfbbf24], [-35, 61, 4, 2.8, 0x38bdf8]]) {
      const wb = addM(this.scene, new THREE.CircleGeometry(1, 20), std(0x070e1c, 0.02, 0.96, { envMapIntensity: 2.4, transparent: true, opacity: 0.72 }), x, 0.028, z);
      wb.rotation.x = -Math.PI / 2; wb.scale.set(w, d, 1);
      addM(this.scene, P(w * 1.15, d * 0.44), bas({ map: getGlowTexture(), color: col, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), x, 0.033, z).rotation.x = -Math.PI / 2;
    }

    const archM = std(0x23192b, 0.55);
    addM(this.scene, B(0.85, 7.4, 0.85), archM, -23, 3.7, 53);
    addM(this.scene, B(0.85, 7.4, 0.85), archM, -23, 3.7, 67);
    addM(this.scene, B(0.65, 2.2, 14.8), bas({ map: createSignTexture('MANGROVE BAZAAR', '#180e24', '#ffe8c2', '#fb7185') }), -23, 6.9, 60);

    const woodM = std(0x4e3422, 0.85), metalM = std(0x475569, 0.36, 0.68), bCols = [0x34d399, 0xfbbf24, 0x38bdf8, 0xfb7185];
    [[-32, 42, 0, '#e11d48', 'NIGHT RAMEN', '#fb7185'], [-42, 42, 0, '#0d9488', 'SPICE COVE', '#22d3ee'], [-54, 42, 0, '#d97706', 'CORAL GRILL', '#fbbf24'], [-32, 78, Math.PI, '#9333ea', 'BAZAAR INK', '#c084fc'], [-42, 78, Math.PI, '#e11d48', 'NOODLE BAR', '#f97316'], [-54, 78, Math.PI, '#0284c7', 'TIDE LOUNGE', '#38bdf8'], [-62, 54, Math.PI / 2, '#be123c', 'CYBER PAWN', '#f43f5e'], [-62, 66, Math.PI / 2, '#0f766e', 'MANGROVE TEA', '#34d399']].forEach(([x, z, ry, col, sign, neon]) => {
      const g = G(); g.position.set(x, 0, z); g.rotation.y = ry;
      addM(g, B(6.8, 1.12, 2.2), woodM, 0, 0.56, 0, 1);
      for (let rib = -3; rib <= 3; rib += 0.5) addM(g, C(0.06, 0.06, 1.05, 6), metalM, rib, 0.56, 1.12);
      for (const px of [-3.2, 3.2]) for (const pz of [-1, 1]) addM(g, C(0.08, 0.08, 3.6, 8), metalM, px, 1.8, pz);
      addM(g, B(7.5, 0.18, 3.2), mapM(createStripedAwningTexture(col), 0.72, 0), 0, 3.55, 0.15).rotation.x = 0.18;
      addM(g, B(5.6, 1.15, 0.22), bas({ map: createSignTexture(sign, '#0f172a', '#fff', neon) }), 0, 4.35, 0.9);
      for (let b = 0; b < 5; b++) addM(g, C(0.05, 0.075, 0.34, 8), std(bCols[b % 4], 0.12, 0.2, { transparent: true, opacity: 0.85 }), -2.2 + b * 1.1, 1.29, 0.45);
      for (const lx of [-2.1, 0, 2.1]) {
        addM(g, C(0.015, 0.015, 0.45, 6), metalM, lx, 3.22, 1.32); addM(g, new THREE.SphereGeometry(0.18, 10, 8), bas({ color: neon }), lx, 2.92, 1.32);
        const glow = createGlowSprite(neon, 1.65, 0.85); glow.position.set(lx, 2.92, 1.32); this.lanternGlows.push(glow); g.add(glow);
      }
      this.scene.add(g);
    });

    const cCols = [0xfb7185, 0x22d3ee, 0xfbbf24, 0xc084fc];
    [[[-24, 6.2, 46], [-60, 6, 72]], [[-24, 6.4, 74], [-60, 6.2, 48]], [[-32, 6.1, 44], [-56, 6.1, 76]]].forEach(([a, b], idx) => {
      const va = V(...a), vb = V(...b), mid = va.clone().lerp(vb, 0.5); mid.y -= 0.9;
      const curve = new THREE.CatmullRomCurve3([va, mid, vb]);
      this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 6, false), bas({ color: cCols[idx % 4] })));
      for (let i = 1; i < 8; i++) { const glow = createGlowSprite(cCols[(i + idx) % 4], 1.8, 0.92); glow.position.copy(curve.getPoint(i / 8)); this.lanternGlows.push(glow); this.scene.add(glow); }
    });
    const crateM = mapM(getCrateSlatsTexture(), 0.82, 0), dRed = mapM(getHazardDrumTexture('#991b1b'), 0.42, 0.62), dTeal = mapM(getHazardDrumTexture('#0f4c5c'), 0.42, 0.62);
    [[-37.2, 54.5, 0.14], [-45.5, 51.8, -0.22], [-53.2, 61.5, 0.32], [-41, 66.8, -0.15]].forEach(([x, z, ry], idx) => {
      const g = G(); g.position.set(x, 0, z); g.rotation.y = ry;
      addM(g, B(1.55, 1.15, 1.35), crateM, 0, 0.58, 0, 3);
      if (idx % 2 === 0) addM(g, B(0.95, 0.78, 0.95), crateM, -0.22, 1.54, -0.08, 1).rotation.y = 0.28;
      addM(g, C(0.42, 0.42, 1.16, 16), idx % 2 === 0 ? dTeal : dRed, 1.24, 0.58, 0.15, 1);
      addM(g, B(1.85, 0.08, 0.82), woodM, -1.75, 0.78, 0.4); addM(g, B(0.08, 0.78, 0.72), metalM, -2.5, 0.39, 0.4); addM(g, B(0.08, 0.78, 0.72), metalM, -1, 0.39, 0.4);
      addM(g, B(1.65, 0.08, 0.36), woodM, -1.75, 0.44, 1.05); this.scene.add(g);
    });

    for (const [x, y, z, col] of [[-34, 5.5, 56, 0xfb7185], [-48, 5.5, 54, 0x22d3ee], [-44, 5.5, 66, 0xfbbf24], [-56, 5.5, 60, 0xc084fc]]) {
      const pt = new THREE.PointLight(col, 4, 28, 1.5); pt.position.set(x, y, z); this.scene.add(pt); this.marketPoints.push(pt);
    }
  }

  _buildBeachAndPalms() {
    const tM = std(0x7a5638, 0.9), fM = std(0x228b44, 0.7, 0, { side: THREE.DoubleSide });
    for (let z = -125; z <= 135; z += 18) for (const px of [18.5, 29.5]) {
      const g = G(); g.position.set(px + Math.sin(z * 0.2) * 1.4, 0, z);
      const h = 7.2 + (Math.abs(z) % 3) * 1.1, tr = tube([V(), V(0.4, h * 0.45, 0.2), V(0.95, h, 0.35)], 10, 0.24, tM);
      tr.castShadow = true; g.add(tr);
      const crown = G(); crown.position.set(0.95, h, 0.35);
      for (let f = 0; f < 7; f++) {
        const ang = (f / 7) * Math.PI * 2, fr = new THREE.Mesh(P(0.85, 3.4, 1, 4), fM), pos = fr.geometry.attributes.position;
        for (let v = 0; v < pos.count; v++) { const t = (pos.getY(v) + 1.7) / 3.4; pos.setZ(v, -t * t * 1.15); }
        fr.geometry.computeVertexNormals(); fr.rotation.set(Math.PI / 2 - 0.18, 0, ang);
        fr.position.set(Math.sin(ang) * 1.45, -0.1, Math.cos(ang) * 1.45); crown.add(fr);
      }
      g.add(crown); this.scene.add(g); this.palms.push({ crown, phase: z * 0.15 });
    }
    const uCols = ['#fb7185', '#22d3ee', '#fbbf24', '#34d399', '#a855f7'];
    for (let z = -90; z <= 95; z += 16) {
      const x = 36 + (z % 2) * 5;
      addM(this.scene, C(0.05, 0.05, 2.3, 6), std(0xe2e8f0), x, 1.15, z);
      addM(this.scene, new THREE.ConeGeometry(2.1, 0.72, 10), mapM(createStripedAwningTexture(uCols[Math.abs(z) % 5]), 0.7, 0), x, 2.28, z, 1);
    }
    const wM = std(0xf8fafc, 0.5), rM = std(0xf43f5e, 0.5);
    for (const lz of [-42, 16, 72]) {
      const lg = G(); lg.position.set(41, 0, lz);
      addM(lg, B(2.4, 2.2, 2.4), wM, 0, 1.1, 0); addM(lg, B(2.6, 2.1, 2.6), wM, 0, 3.2, 0);
      addM(lg, new THREE.ConeGeometry(2.4, 1.1, 4), rM, 0, 4.8, 0).rotation.y = Math.PI / 4; this.scene.add(lg);
    }
  }

  _buildStreetlights() {
    const pm = std(0x1e293b, 0.32, 0.75);
    for (let z = -120; z <= 130; z += 24) for (const sx of [-11.8, 11.8]) {
      addM(this.scene, C(0.1, 0.14, 7.6, 8), pm, sx, 3.8, z);
      addM(this.scene, B(2.2, 0.12, 0.14), pm, sx + (sx < 0 ? 1 : -1), 7.5, z);
      const glow = createGlowSprite(0xffd699, 2.6, 0.3); glow.position.set(sx + (sx < 0 ? 2 : -2), 7.3, z);
      this.streetLights.push(glow); this.scene.add(glow);
    }
  }

  _buildCrosswalks() {
    const sm = bas({ color: 0xf8fafc, transparent: true, opacity: 0.84 });
    for (const cz of [-60, 0, 60]) for (let x = -8.5; x <= 8.5; x += 2.2) addM(this.scene, P(1.1, 3.4), sm, x, 0.025, cz).rotation.x = -Math.PI / 2;
  }

  _buildYachtsAndPeds() {
    for (const [x, z, ry, sc] of [[74, -86, -0.25, 1], [88, -18, 0.15, 1.15], [72, 24, -0.32, 1.08], [96, 68, 0.22, 0.95]]) {
      const y = createYacht(sc); y.position.set(x, -0.15, z); y.rotation.y = ry; this.scene.add(y);
      this.yachts.push({ mesh: y, baseY: -0.15, phase: z * 0.08 });
    }
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? 'west' : 'east', px = side === 'west' ? -13.6 - (i % 3) * 0.7 : 13.4 + (i % 3) * 0.8, pz = -95 + i * 11.5;
      const ped = createCharacter('ped', i), baseRy = i % 3 === 0 ? 0 : Math.PI;
      ped.mesh.position.set(px, 0, pz); ped.mesh.rotation.y = baseRy; this.scene.add(ped.mesh);
      this.sidewalkPeds.push({ char: ped, side, homeZ: pz, baseRy, phase: i * 0.9, panicked: false, panicTimer: 0, fleeAngle: 0 });
    }
  }

  _buildMissionBeacon() {
    const g = G(), bM = (c, op, add) => bas({ color: c, side: THREE.DoubleSide, transparent: true, opacity: op, ...(add ? { blending: THREE.AdditiveBlending, depthWrite: false } : {}) });
    addM(g, new THREE.RingGeometry(2.1, 2.7, 32), bM(0xfbbf24, 0.85), 0, 0.08).rotation.x = -Math.PI / 2;
    addM(g, C(1.6, 2.2, 26, 18, 1, true), bM(0xfbbf24, 0.14, 1), 0, 13);
    const diamond = addM(g, new THREE.OctahedronGeometry(0.85, 0), bas({ color: 0xfef08a, wireframe: true }), 0, 3.2);
    g.visible = false; this.scene.add(g); this.missionBeacon = { group: g, diamond };
  }

  _buildInteractiveLocations() {
    for (const loc of INTERACTIVE_LOCATIONS) {
      const g = G(); g.position.set(loc.x, 0.08, loc.z);
      addM(g, new THREE.RingGeometry(1.75, 2.35, 32), bas({ color: loc.color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })).rotation.x = -Math.PI / 2;
      addM(g, C(1.45, 1.85, 4.4, 18, 1, true), bas({ color: loc.color, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }), 0, 2.2);
      const icon = addM(g, new THREE.OctahedronGeometry(0.55, 0), bas({ color: loc.color, wireframe: true }), 0, 2.1);
      const glow = createGlowSprite(loc.color, 2.4, 0.36); glow.position.y = 2.1; g.add(glow);
      this.scene.add(g); this.interactiveMarkers.push({ ...loc, group: g, icon });
    }
  }

  update(time, missionTarget = null) {
    this.palms.forEach((p) => { p.crown.rotation.z = Math.sin(time * 1.4 + p.phase) * 0.045; });
    this.yachts.forEach((y) => { y.mesh.position.y = y.baseY + Math.sin(time * 1.2 + y.phase) * 0.14; y.mesh.rotation.z = Math.sin(time * 0.9 + y.phase) * 0.025; });
    if (this.oceanTex) this.oceanTex.offset.y = (time * 0.018) % 1;
    this.interactiveMarkers.forEach((m) => { m.icon.rotation.y = time * 1.8; m.icon.position.y = 2.3 + Math.sin(time * 2.4) * 0.2; });
    if (this.missionBeacon) {
      this.missionBeacon.group.visible = !!missionTarget;
      if (missionTarget) { this.missionBeacon.group.position.set(missionTarget.x, 0, missionTarget.z); this.missionBeacon.diamond.rotation.y = time * 2.2; }
    }
  }
}
