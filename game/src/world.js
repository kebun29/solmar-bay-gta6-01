import * as THREE from 'three';
import { createCharacter, createYacht } from './entities.js';

export const DISTRICTS = [
  { id: 'marina', name: 'MARINA BOULEVARD', subtitle: 'COASTAL ART-DECO STRIP', standing: 67, status: 'ALLIED', color: '#fb7185', bounds: { xMin: -28, xMax: 65, zMin: -120, zMax: 35 } },
  { id: 'azura', name: 'AZURA DOWNTOWN', subtitle: 'FINANCIAL & GLASS TOWERS', standing: 54, status: 'CONTESTED', color: '#38bdf8', bounds: { xMin: -160, xMax: -28, zMin: -140, zMax: 15 } },
  { id: 'bazaar', name: 'MANGROVE BAZAAR', subtitle: 'NEON NIGHT MARKET', standing: 82, status: 'LOYAL', color: '#f59e0b', bounds: { xMin: -110, xMax: -14, zMin: 15, zMax: 120 } },
  { id: 'pelican', name: 'PELICAN HARBOR', subtitle: 'CARGO PIERS & DRYDOCK', standing: 49, status: 'HOSTILE', color: '#14b8a6', bounds: { xMin: -30, xMax: 65, zMin: 35, zMax: 190 } },
  { id: 'hibiscus', name: 'HIBISCUS HEIGHTS', subtitle: 'HILLSIDE VILLAS', standing: 61, status: 'NEUTRAL', color: '#c084fc', bounds: { xMin: -220, xMax: -110, zMin: -190, zMax: 40 } },
  { id: 'verdant', name: 'VERDANT INDUSTRIAL', subtitle: 'SHIPYARD & REFINERY', standing: 58, status: 'NEUTRAL', color: '#facc15', bounds: { xMin: -220, xMax: -110, zMin: 40, zMax: 190 } },
  { id: 'dorada', name: 'ISLA DORADA', subtitle: 'PRIVATE YACHT CAY', standing: 76, status: 'ALLIED', color: '#f43f5e', bounds: { xMin: 65, xMax: 180, zMin: -180, zMax: 160 } },
];

export function getDistrictAt(x, z) {
  for (const d of DISTRICTS) {
    const b = d.bounds;
    if (x >= b.xMin && x <= b.xMax && z >= b.zMin && z <= b.zMax) return d;
  }
  return DISTRICTS[0];
}

// Shared soft radial-gradient glow texture
let _glowTex = null;
export function getGlowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  g.addColorStop(0.78, 'rgba(255,255,255,0.07)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

export function createGlowSprite(color, scale = 1.8, opacity = 0.9) {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale, scale, 1);
  return s;
}

let _shadowTex = null;
export function getContactShadowTexture() {
  if (_shadowTex) return _shadowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
  g.addColorStop(0.0, 'rgba(5, 8, 15, 0.72)');
  g.addColorStop(0.55, 'rgba(5, 8, 15, 0.36)');
  g.addColorStop(1.0, 'rgba(5, 8, 15, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _shadowTex = new THREE.CanvasTexture(c);
  return _shadowTex;
}

export function createContactShadow(width, depth, opacity = 0.68) {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshBasicMaterial({
    map: getContactShadowTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

function seamlessCloudFbm(theta, v) {
  const cx = Math.cos(theta);
  const sx = Math.sin(theta);
  let val = 0;
  let amp = 0.54;
  let freq = 2.2;
  for (let i = 0; i < 5; i++) {
    const a = cx * freq + v * freq * 1.55 + i * 1.9;
    const b = sx * freq - v * freq * 1.2 + i * 2.5;
    const wave = Math.sin(a * 1.35 + Math.cos(b * 1.65)) * Math.cos(b * 1.25 - Math.sin(a * 1.15));
    val += (wave * 0.5 + 0.5) * amp;
    freq *= 2.02;
    amp *= 0.48;
  }
  return val;
}

function createSeamlessSkyTexture(isNight) {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;

  // Align sunset glow along northern-coastal horizon
  const sunU = 0.72;
  const sunV = 0.43;

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const elev = Math.max(0, 1 - v * 2);

    let r, g, b;
    if (!isNight) {
      if (v < 0.5) {
        const t = v / 0.5;
        // Rich tropical golden-hour gradient: deep indigo-violet zenith -> coral rose -> luminous amber horizon
        r = 32 + 223 * Math.pow(t, 1.25);
        g = 38 + 148 * Math.pow(t, 1.35) - 22 * Math.pow(t, 3.2);
        b = 112 + 78 * Math.sin(t * Math.PI) - 54 * Math.pow(t, 2.0);
      } else {
        const t = (v - 0.5) / 0.5;
        r = 252 - 175 * t;
        g = 158 - 100 * t;
        b = 112 - 48 * t;
      }
    } else {
      if (v < 0.5) {
        const t = v / 0.5;
        r = 7 + 28 * Math.pow(t, 2.0);
        g = 12 + 32 * Math.pow(t, 1.8);
        b = 32 + 64 * Math.pow(t, 1.4);
      } else {
        r = 12;
        g = 16;
        b = 30;
      }
    }

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const theta = u * Math.PI * 2;
      let pr = r;
      let pg = g;
      let pb = b;

      // Soft multi-layered sunset clouds
      if (v < 0.51) {
        const cloudMask = Math.sin(Math.min(1, v / 0.51) * Math.PI);
        const f1 = seamlessCloudFbm(theta, v * 2.5);
        const f2 = seamlessCloudFbm(theta + 1.2, v * 4.2);
        const cAmt = Math.max(0, (f1 - 0.44) * 2.35) * cloudMask;
        const wisp = Math.max(0, (f2 - 0.54) * 1.8) * cloudMask * 0.5;
        const totalC = Math.min(1, cAmt + wisp);

        if (!isNight) {
          // Warm peach-gold sunlit cloud bellies + soft coral-lavender tops
          const cr = 255;
          const cg = 198 + 42 * (1 - elev) - 24 * wisp;
          const cb = 162 + 44 * elev;
          const blend = Math.min(0.82, totalC * 0.78);
          pr = pr * (1 - blend) + cr * blend;
          pg = pg * (1 - blend) + cg * blend;
          pb = pb * (1 - blend) + cb * blend;
        } else {
          pr += totalC * 16;
          pg += totalC * 22;
          pb += totalC * 38;
        }
      }

      let du = Math.abs(u - sunU);
      if (du > 0.5) du = 1 - du;
      const dv = (v - sunV) * 0.65;
      const dist = Math.sqrt(du * du + dv * dv);

      if (!isNight) {
        const halo = Math.exp(-dist * 7.5) * 0.92;
        const core = Math.exp(-dist * 42.0) * 1.15;
        pr = Math.min(255, pr + 255 * (halo * 0.55 + core));
        pg = Math.min(255, pg + 210 * (halo * 0.42 + core * 0.92));
        pb = Math.min(255, pb + 130 * (halo * 0.22 + core * 0.72));
      } else {
        const moonHalo = Math.exp(-dist * 15.0) * 0.35;
        const moonCore = Math.exp(-dist * 72.0) * 0.9;
        pr = Math.min(255, pr + 185 * (moonHalo + moonCore));
        pg = Math.min(255, pg + 210 * (moonHalo + moonCore));
        pb = Math.min(255, pb + 255 * (moonHalo + moonCore));
      }

      const idx = (y * w + x) * 4;
      data[idx] = Math.max(0, Math.min(255, pr));
      data[idx + 1] = Math.max(0, Math.min(255, pg));
      data[idx + 2] = Math.max(0, Math.min(255, pb));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  if (isNight) {
    ctx.fillStyle = 'rgba(235, 245, 255, 0.88)';
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 280; i++) {
      const sx = rand() * w;
      const sy = rand() * (h * 0.42);
      const sz = rand() < 0.22 ? 2 : 1.1;
      ctx.globalAlpha = 0.35 + rand() * 0.65;
      ctx.fillRect(sx, sy, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createOceanShimmerTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e8ea8';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle horizontal wave highlights
  for (let y = 0; y < 512; y += 4) {
    const wave = Math.sin(y * 0.24) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(180, 245, 255, ${0.04 + wave * 0.08})`;
    ctx.fillRect(0, y, 512, 2);
  }
  for (let i = 0; i < 650; i++) {
    const x = (i * 89) % 512;
    const y = (i * 173) % 512;
    const len = 14 + (i % 26);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 224, 178, 0.22)' : 'rgba(220, 252, 255, 0.16)';
    ctx.fillRect(x, y, len, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 12);
  return tex;
}

function createSunPathTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 512);

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, 'rgba(255, 220, 145, 0.72)');
  g.addColorStop(0.5, 'rgba(255, 165, 110, 0.42)');
  g.addColorStop(1.0, 'rgba(255, 140, 100, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);

  // Sparkling horizontal shimmer streaks
  for (let y = 6; y < 490; y += 9) {
    const spread = 24 + (y / 512) * 84;
    const cx = 128 + Math.sin(y * 0.31) * 16;
    const w = 36 + Math.cos(y * 0.19) * 28;
    const alpha = Math.max(0.08, (1 - y / 512) * 0.85);
    ctx.fillStyle = `rgba(255, 245, 200, ${alpha})`;
    ctx.fillRect(cx - w / 2, y, w, 3);
    ctx.fillStyle = `rgba(255, 210, 140, ${alpha * 0.5})`;
    ctx.fillRect(cx - spread, y + 4, spread * 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStripedAwningTexture(colorA, colorB = '#fff8f0') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const stripes = 8;
  const sw = 256 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(i * sw, 0, sw, 128);
  }
  // Subtle scalloped bottom trim shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(0, 112, 256, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createBuildingWindowTexture(baseHex, litHex, isNight, seedOffset = 0) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 4, 512);
  for (let y = 0; y < 512; y += 32) ctx.fillRect(0, y, 256, 5);

  let s = 9101 + seedOffset * 97;
  const rand = () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let row = 1; row < 15; row++) {
    for (let col = 0; col < 8; col++) {
      const litChance = isNight ? 0.58 : 0.36;
      const isLit = rand() < litChance;
      ctx.fillStyle = isLit ? litHex : (isNight ? '#111927' : '#2a3d52');
      ctx.fillRect(col * 32 + 6, row * 32 + 7, 20, 19);
      if (isLit) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(col * 32 + 6, row * 32 + 7, 20, 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createSignTexture(text, bgColor, fgColor, glowColor) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.font = '900 50px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 22;
  ctx.fillStyle = fgColor;
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoadTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#424b59';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 197) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(14, 0, 5, 512);
  ctx.fillRect(493, 0, 5, 512);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(248, 0, 5, 512);
  ctx.fillRect(259, 0, 5, 512);

  ctx.fillStyle = 'rgba(241,245,249,0.85)';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(132, y, 5, 32);
    ctx.fillRect(375, y, 5, 32);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 22);
  tex.anisotropy = 8;
  return tex;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.isNight = false;
    this.colliders = [];
    this.palms = [];
    this.lanternGlows = [];
    this.streetLights = [];
    this.foamStrips = [];
    this.buildingMats = [];
    this.yachts = [];
    this.sidewalkPeds = [];

    this._buildLighting();
    this._buildSky();
    this._buildTerrainAndCoast();
    this._buildBaySuspensionBridge();
    this._buildRoads();
    this._buildArtDecoStrip();
    this._buildSkyline();
    this._buildNightMarket();
    this._buildBeachAndPalms();
    this._buildStreetlights();
    this._buildYachtsAndPeds();
  }

  _buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffe6cc, 0.58);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffdfb8, 0x4b5c74, 1.5);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffb86c, 2.9);
    this.sunLight.position.set(78, 44, -95);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    const d = 92;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x6ad4f2, 0.9);
    this.fillLight.position.set(-60, 35, 65);
    this.scene.add(this.fillLight);
  }

  _buildSky() {
    this.sunsetSkyTex = createSeamlessSkyTexture(false);
    this.nightSkyTex = createSeamlessSkyTexture(true);

    const skyGeo = new THREE.SphereGeometry(430, 48, 24);
    this.skyMat = new THREE.MeshBasicMaterial({
      map: this.sunsetSkyTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    // Real 3D Glowing Golden-Hour Sun Disc & Corona over the northern coastal horizon
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(58, 46, -285);
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(14.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff5d6, fog: false })
    );
    sunDisc.lookAt(0, 4, -20);
    this.sunGroup.add(sunDisc);

    const sunCorona = createGlowSprite(0xffae52, 86, 0.88);
    sunCorona.material.fog = false;
    this.sunGroup.add(sunCorona);

    const sunHalo = createGlowSprite(0xff6b6b, 145, 0.45);
    sunHalo.material.fog = false;
    this.sunGroup.add(sunHalo);

    // Painterly golden-hour sunset cloud bands across the northern & coastal sky
    const cloudSpecs = [
      { pos: [-115, 76, -270], sx: 145, sy: 30, col: 0xffb899, op: 0.34 },
      { pos: [-25, 88, -280], sx: 175, sy: 34, col: 0xffcfa0, op: 0.38 },
      { pos: [95, 74, -275], sx: 165, sy: 32, col: 0xffb38a, op: 0.36 },
      { pos: [175, 66, -245], sx: 140, sy: 28, col: 0xf9a8b8, op: 0.3 },
      { pos: [-65, 58, -265], sx: 120, sy: 22, col: 0xffe2b0, op: 0.32 },
      { pos: [120, 94, -260], sx: 160, sy: 30, col: 0xfda4af, op: 0.28 },
    ];
    cloudSpecs.forEach((cs) => {
      const mat = new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color: cs.col,
        transparent: true,
        opacity: cs.op,
        depthWrite: false,
        fog: false,
      });
      const sp = new THREE.Sprite(mat);
      sp.position.set(cs.pos[0], cs.pos[1], cs.pos[2]);
      sp.scale.set(cs.sx, cs.sy, 1);
      this.sunGroup.add(sp);
    });

    this.scene.add(this.sunGroup);

    this.scene.fog = new THREE.FogExp2(0xe69c78, 0.0036);
  }

  setMode(mode) {
    const night = mode === 'night';
    this.isNight = night;
    this.skyMat.map = night ? this.nightSkyTex : this.sunsetSkyTex;
    this.skyMat.needsUpdate = true;
    if (this.sunGroup) this.sunGroup.visible = !night;
    if (this.sunPathMesh) this.sunPathMesh.visible = !night;

    if (night) {
      this.scene.fog.color.setHex(0x0c1528);
      this.scene.fog.density = 0.0076;
      this.ambientLight.color.setHex(0x6f8bc2);
      this.ambientLight.intensity = 0.58;
      this.hemiLight.color.setHex(0x7ca2de);
      this.hemiLight.groundColor.setHex(0x2c2044);
      this.hemiLight.intensity = 1.2;
      this.sunLight.color.setHex(0xa8cbff);
      this.sunLight.intensity = 1.35;
      this.sunLight.position.set(-55, 65, 45);
      this.fillLight.color.setHex(0xff9b62);
      this.fillLight.intensity = 1.05;
      this.oceanMat.color.setHex(0x092f46);
      this.lanternGlows.forEach((s) => { s.material.opacity = 0.96; });
      this.streetLights.forEach((s) => { s.material.opacity = 0.9; });
      if (this.marketPoint1) this.marketPoint1.intensity = 42;
      if (this.marketPoint2) this.marketPoint2.intensity = 38;
      if (this.marketPoint3) this.marketPoint3.intensity = 34;
      if (this.marketPoint4) this.marketPoint4.intensity = 32;
    } else {
      this.scene.fog.color.setHex(0xe89e78);
      this.scene.fog.density = 0.0034;
      this.ambientLight.color.setHex(0xffe6cc);
      this.ambientLight.intensity = 0.6;
      this.hemiLight.color.setHex(0xffe0b5);
      this.hemiLight.groundColor.setHex(0x52647e);
      this.hemiLight.intensity = 1.54;
      this.sunLight.color.setHex(0xffb86c);
      this.sunLight.intensity = 2.9;
      this.sunLight.position.set(78, 44, -95);
      this.fillLight.color.setHex(0x6ad4f2);
      this.fillLight.intensity = 0.9;
      this.oceanMat.color.setHex(0x14a4bd);
      this.lanternGlows.forEach((s) => { s.material.opacity = 0.45; });
      this.streetLights.forEach((s) => { s.material.opacity = 0.25; });
      if (this.marketPoint1) this.marketPoint1.intensity = 4;
      if (this.marketPoint2) this.marketPoint2.intensity = 4;
      if (this.marketPoint3) this.marketPoint3.intensity = 4;
      if (this.marketPoint4) this.marketPoint4.intensity = 4;
    }
  }

  _buildTerrainAndCoast() {
    const cityGround = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 560),
      new THREE.MeshStandardMaterial({ color: 0x2b3240, roughness: 0.9, metalness: 0.05 })
    );
    cityGround.rotation.x = -Math.PI / 2;
    cityGround.position.set(-165, -0.02, 0);
    cityGround.receiveShadow = true;
    this.scene.add(cityGround);

    // Golden beach sand strip
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe8c996, roughness: 0.94, metalness: 0.0 });
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(24, 560), sandMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(27, -0.01, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Promenade seawall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe5dfd5, roughness: 0.72 });
    const seawall = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.72, 560), wallMat);
    seawall.position.set(16.2, 0.36, 0);
    seawall.receiveShadow = true;
    seawall.castShadow = true;
    this.scene.add(seawall);

    // Shimmering turquoise ocean plane
    this.oceanTex = createOceanShimmerTexture();
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x14a4bd,
      map: this.oceanTex,
      roughness: 0.18,
      metalness: 0.45,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(420, 680), this.oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(246, -0.14, -20);
    this.scene.add(ocean);

    // Golden sun shimmer reflection path across the bay
    const sunPathTex = createSunPathTexture();
    this.sunPathMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 240),
      new THREE.MeshBasicMaterial({
        map: sunPathTex,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.sunPathMesh.rotation.x = -Math.PI / 2;
    this.sunPathMesh.rotation.z = -0.12;
    this.sunPathMesh.position.set(66, -0.06, -155);
    this.scene.add(this.sunPathMesh);

    // Shallow turquoise water shelf near shore
    const shallow = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 560),
      new THREE.MeshBasicMaterial({ color: 0x38d8de, transparent: true, opacity: 0.5 })
    );
    shallow.rotation.x = -Math.PI / 2;
    shallow.position.set(42, -0.08, 0);
    this.scene.add(shallow);

    // Shoreline foam strips
    for (let i = 0; i < 3; i++) {
      const foam = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8 - i * 0.4, 560),
        new THREE.MeshBasicMaterial({
          color: 0xf4fcff,
          transparent: true,
          opacity: 0.65 - i * 0.16,
          depthWrite: false,
        })
      );
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(36.5 + i * 2.6, -0.04 + i * 0.005, 0);
      this.scene.add(foam);
      this.foamStrips.push({ mesh: foam, baseX: foam.position.x, phase: i * 1.4 });
    }

    // Isla Dorada tropical island silhouette across Coralina Bay
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x3f6a52, roughness: 0.88 });
    const island = new THREE.Mesh(new THREE.CylinderGeometry(38, 52, 6, 18), islandMat);
    island.scale.set(0.85, 1, 2.7);
    island.position.set(175, 1.8, -110);
    this.scene.add(island);
  }

  // Grand Landmark: Coralina Bay Suspension Bridge spanning the coastal horizon
  _buildBaySuspensionBridge() {
    const g = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xc84b3e, metalness: 0.45, roughness: 0.38 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.2 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.55, roughness: 0.3 });

    // Place bridge spanning across the northern bay from Marina Blvd approach out to Isla Dorada
    g.position.set(48, 0, -158);
    g.rotation.y = -0.22;

    const spanLen = 220;
    const deckY = 14.5;

    // Elevated highway deck + side guardrails
    const deck = new THREE.Mesh(new THREE.BoxGeometry(spanLen, 1.8, 10.5), deckMat);
    deck.position.set(0, deckY, 0);
    deck.castShadow = true;
    g.add(deck);

    // Golden sodium bridge lights along deck
    for (let x = -96; x <= 96; x += 24) {
      const lamp = createGlowSprite(0xffcf70, 3.8, 0.82);
      lamp.position.set(x, deckY + 2.6, 4.6);
      g.add(lamp);
    }

    // Twin Monumental Art-Deco Suspension Towers
    const towerXs = [-46, 46];
    const towerH = 54;
    towerXs.forEach((tx) => {
      [-5.2, 5.2].forEach((tz) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(3.2, towerH, 2.8), steelMat);
        leg.position.set(tx, towerH / 2 - 2, tz);
        leg.castShadow = true;
        g.add(leg);
      });
      // Horizontal Art-Deco crossbeams
      [deckY - 1, 30, 42, 50].forEach((cy) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 12.6), steelMat);
        beam.position.set(tx, cy, 0);
        g.add(beam);
      });
      // Red aviation warning beacons atop each tower
      const beacon = createGlowSprite(0xff3b3b, 5.2, 0.96);
      beacon.position.set(tx, towerH + 0.5, 0);
      g.add(beacon);
    });

    // Main catenary suspension cables & vertical hanger cables (both sides of deck)
    [-5.0, 5.0].forEach((cz) => {
      // Center catenary curve between towers
      const midPts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = -46 + t * 92;
        const sag = 4 * (t - 0.5) * (t - 0.5); // 1 at ends, 0 at center
        const y = deckY + 4.5 + sag * (towerH - deckY - 6.5);
        midPts.push(new THREE.Vector3(x, y, cz));
      }
      const midCurve = new THREE.CatmullRomCurve3(midPts);
      const midTube = new THREE.Mesh(new THREE.TubeGeometry(midCurve, 24, 0.42, 6, false), cableMat);
      g.add(midTube);

      // Outer backstay cables
      [
        [new THREE.Vector3(-110, deckY + 1, cz), new THREE.Vector3(-78, 28, cz), new THREE.Vector3(-46, towerH - 2, cz)],
        [new THREE.Vector3(46, towerH - 2, cz), new THREE.Vector3(78, 28, cz), new THREE.Vector3(110, deckY + 1, cz)],
      ].forEach((pts) => {
        const c = new THREE.CatmullRomCurve3(pts);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 14, 0.38, 6, false), cableMat));
      });

      // Vertical suspender cables
      for (let x = -38; x <= 38; x += 8) {
        const t = (x + 46) / 92;
        const sag = 4 * (t - 0.5) * (t - 0.5);
        const topY = deckY + 4.5 + sag * (towerH - deckY - 6.5);
        const h = topY - deckY;
        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, h, 5), cableMat);
        hanger.position.set(x, deckY + h / 2, cz);
        g.add(hanger);
      }
    });

    this.scene.add(g);
  }

  _buildRoads() {
    const roadTex = createRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.74, metalness: 0.1 });

    // Primary Coastal Boulevard (Marina Boulevard)
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(24, 540), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.01, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // Sidewalks flanking main road
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x9aa3af, roughness: 0.82 });
    const eastWalk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 540), walkMat);
    eastWalk.position.set(14.0, 0.08, 0);
    eastWalk.receiveShadow = true;
    this.scene.add(eastWalk);

    const westWalk = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 540), walkMat);
    westWalk.position.set(-14.2, 0.08, 0);
    westWalk.receiveShadow = true;
    this.scene.add(westWalk);

    const crossMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.82 });
    [-110, -35, 45, 125].forEach((z) => {
      const cross = new THREE.Mesh(new THREE.PlaneGeometry(180, 14), crossMat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(-96, 0.015, z);
      cross.receiveShadow = true;
      this.scene.add(cross);
    });

    const inland = new THREE.Mesh(new THREE.PlaneGeometry(16, 520), crossMat);
    inland.rotation.x = -Math.PI / 2;
    inland.position.set(-84, 0.014, 0);
    inland.receiveShadow = true;
    this.scene.add(inland);
  }

  // Left of Marina Boulevard: Art-Deco pastel hotels & shops with striped awnings & glowing neon signs
  _buildArtDecoStrip() {
    const shops = [
      { z: -96, d: 15, h: 14, col: 0xf9a8b8, trim: 0xfff7ed, awn: '#fb7185', sign: 'HOTEL CORALINA', neon: '#fb7185' },
      { z: -78, d: 14, h: 11, col: 0xa7f3d0, trim: 0xf8fafc, awn: '#0d9488', sign: 'CAFE SOL', neon: '#22d3ee' },
      { z: -61, d: 15, h: 16, col: 0xfde68a, trim: 0xfffbeb, awn: '#f97316', sign: 'SUNSET LOUNGE', neon: '#fbbf24' },
      { z: -45, d: 12, h: 10, col: 0xbae6fd, trim: 0xf8fafc, awn: '#0284c7', sign: 'PALM CLUB', neon: '#38bdf8' },
      { z: -21, d: 14, h: 13, col: 0xfecdd3, trim: 0xfff1f2, awn: '#e11d48', sign: 'BAYSIDE DINER', neon: '#f43f5e' },
      { z: -4, d: 14, h: 11, col: 0xe9d5ff, trim: 0xfaf5ff, awn: '#9333ea', sign: 'NEON DRIFT', neon: '#c084fc' },
      { z: 14, d: 15, h: 15, col: 0xfed7aa, trim: 0xfff7ed, awn: '#ea580c', sign: 'TROPIC BAR', neon: '#f97316' },
      { z: 30, d: 13, h: 12, col: 0x99f6e4, trim: 0xf0fdfa, awn: '#0f766e', sign: 'MARINA SUITES', neon: '#2dd4bf' },
    ];

    const shopGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffe8b6,
      emissive: 0xffb85c,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.35,
    });

    shops.forEach((s) => {
      const g = new THREE.Group();
      g.position.set(-22.5, 0, s.z);

      const wallMat = new THREE.MeshStandardMaterial({ color: s.col, roughness: 0.62 });
      const trimMat = new THREE.MeshStandardMaterial({ color: s.trim, roughness: 0.5 });

      // Main Art-Deco pastel facade
      const body = new THREE.Mesh(new THREE.BoxGeometry(11, s.h, s.d), wallMat);
      body.position.y = s.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      // Stepped Art-Deco parapet crown
      const crown = new THREE.Mesh(new THREE.BoxGeometry(11.3, 1.4, s.d * 0.58), trimMat);
      crown.position.y = s.h + 0.7;
      g.add(crown);

      // Horizontal Art-Deco accent speedlines
      const band1 = new THREE.Mesh(new THREE.BoxGeometry(11.24, 0.38, s.d + 0.2), trimMat);
      band1.position.y = s.h - 1.2;
      g.add(band1);

      const band2 = new THREE.Mesh(new THREE.BoxGeometry(11.24, 0.28, s.d + 0.2), trimMat);
      band2.position.y = 4.4;
      g.add(band2);

      // Illuminated ground-floor shopfront windows facing Marina Boulevard (+X)
      const shopWin = new THREE.Mesh(new THREE.PlaneGeometry(s.d * 0.78, 2.7), shopGlassMat);
      shopWin.rotation.y = Math.PI / 2;
      shopWin.position.set(5.55, 1.7, 0);
      g.add(shopWin);

      // Upper pastel hotel windows
      for (let row = 0; row < Math.floor((s.h - 5) / 3.4); row++) {
        for (let col = -1; col <= 1; col++) {
          const uw = new THREE.Mesh(
            new THREE.PlaneGeometry(2.1, 1.8),
            new THREE.MeshStandardMaterial({
              color: 0x1e293b,
              emissive: 0xfde68a,
              emissiveIntensity: (row + col) % 2 === 0 ? 0.35 : 0.08,
              roughness: 0.2,
              metalness: 0.6,
            })
          );
          uw.rotation.y = Math.PI / 2;
          uw.position.set(5.54, 6.4 + row * 3.3, col * (s.d * 0.28));
          g.add(uw);
        }
      }

      // Striped Canvas Awning jutting over the west sidewalk
      const awnTex = createStripedAwningTexture(s.awn, '#fffaf0');
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.16, s.d * 0.84),
        new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.72 })
      );
      awning.position.set(6.6, 3.65, 0);
      awning.rotation.z = -0.24;
      awning.castShadow = true;
      g.add(awning);

      // Glowing Neon Sign facing boulevard
      const signTex = createSignTexture(s.sign, '#0f172a', '#ffffff', s.neon);
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 1.9, s.d * 0.72),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signMesh.position.set(5.75, s.h - 2.6, 0);
      g.add(signMesh);

      const neonGlow = createGlowSprite(new THREE.Color(s.neon).getHex(), 5.5, 0.5);
      neonGlow.position.set(6.4, s.h - 2.6, 0);
      g.add(neonGlow);

      this.scene.add(g);
      this.colliders.push({ x: -22.5, z: s.z, hw: 6.0, hd: s.d / 2 + 0.4 });
    });
  }

  _buildSkyline() {
    const specs = [
      // South & North anchor towers along Marina Boulevard
      { x: -34, z: -135, w: 22, d: 24, h: 52, color: '#2b3a4f', lit: '#fde68a', sign: 'HOTEL CORALINA', signColor: '#fb7185', spire: true },
      { x: -34, z: 105, w: 22, d: 24, h: 38, color: '#2e3f52', lit: '#a5f3fc', sign: 'PELICAN BAY', signColor: '#14b8a6' },
      { x: -34, z: 155, w: 22, d: 26, h: 46, color: '#1e293b', lit: '#fde68a' },

      // Second row taller Azura Downtown skyscrapers
      { x: -62, z: -130, w: 24, d: 24, h: 78, color: '#1e293b', lit: '#7dd3fc', spire: true },
      { x: -62, z: -88, w: 22, d: 26, h: 96, color: '#0f172a', lit: '#fde68a', sign: 'AZURA TOWER', signColor: '#22d3ee', spire: true },
      { x: -62, z: -52, w: 24, d: 22, h: 70, color: '#273449', lit: '#fed7aa', sign: 'CORALINA PLAZA', signColor: '#fb7185', helipad: true },
      { x: -62, z: -10, w: 22, d: 24, h: 86, color: '#1e293b', lit: '#bae6fd', spire: true },
      { x: -62, z: 145, w: 24, d: 24, h: 54, color: '#2c3648', lit: '#fdba74' },

      // Third row background skyline
      { x: -108, z: -115, w: 26, d: 26, h: 108, color: '#172033', lit: '#93c5fd', spire: true },
      { x: -108, z: -64, w: 28, d: 28, h: 90, color: '#243044', lit: '#fde68a' },
      { x: -108, z: -8, w: 24, d: 26, h: 76, color: '#1b263b', lit: '#fdba74', spire: true },
      { x: -108, z: 68, w: 26, d: 26, h: 60, color: '#232c3d', lit: '#fcd34d' },
      { x: -108, z: 122, w: 26, d: 26, h: 66, color: '#1e293b', lit: '#7dd3fc' },
    ];

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });

    specs.forEach((b, i) => {
      const tex = createBuildingWindowTexture(b.color, b.lit, false, i);
      const sideMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.42,
        metalness: 0.28,
        emissive: new THREE.Color(b.lit),
        emissiveMap: tex,
        emissiveIntensity: 0.3,
      });
      this.buildingMats.push(sideMat);

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      const baseH = b.h * 0.68;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, baseH, b.d),
        [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]
      );
      base.position.y = baseH / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const topH = b.h * 0.32;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.74, topH, b.d * 0.74),
        [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]
      );
      top.position.y = baseH + topH / 2;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      if (b.spire) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 14, 8), spireMat);
        spire.position.y = b.h + 7;
        group.add(spire);
        const beacon = createGlowSprite(0xff3b3b, 3.4, 0.92);
        beacon.position.y = b.h + 14.2;
        group.add(beacon);
      }

      if (b.helipad) {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(5.2, 5.2, 0.25, 20),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
        );
        pad.position.y = b.h + 0.15;
        group.add(pad);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(3.8, 4.3, 24),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = b.h + 0.3;
        group.add(ring);
      }

      if (b.sign) {
        const signTex = createSignTexture(b.sign, '#0f172a', '#ffffff', b.signColor);
        const signMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(b.d * 0.85, 4.6),
          new THREE.MeshBasicMaterial({ map: signTex })
        );
        signMesh.rotation.y = Math.PI / 2;
        signMesh.position.set(b.w / 2 + 0.2, baseH - 2.6, 0);
        group.add(signMesh);
      }

      this.scene.add(group);
      this.colliders.push({ x: b.x, z: b.z, hw: b.w / 2 + 0.5, hd: b.d / 2 + 0.5 });
    });
  }

  // Mangrove Bazaar Night Market with wet reflective floor, neon stall signs & rich props
  _buildNightMarket() {
    // Wet glossy cobblestone tile texture
    const tc = document.createElement('canvas');
    tc.width = 256;
    tc.height = 256;
    const tctx = tc.getContext('2d');
    tctx.fillStyle = '#1f2838';
    tctx.fillRect(0, 0, 256, 256);
    tctx.strokeStyle = 'rgba(8, 13, 24, 0.72)';
    tctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 32) {
      tctx.beginPath(); tctx.moveTo(i, 0); tctx.lineTo(i, 256); tctx.stroke();
      tctx.beginPath(); tctx.moveTo(0, i); tctx.lineTo(256, i); tctx.stroke();
    }
    // Subtle wet sheen streaks on tiles
    for (let i = 0; i < 64; i++) {
      const rx = (i * 47) % 256;
      const ry = (i * 83) % 256;
      tctx.fillStyle = i % 2 === 0 ? 'rgba(148, 197, 255, 0.08)' : 'rgba(255, 190, 140, 0.06)';
      tctx.fillRect(rx, ry, 24, 18);
    }
    const tileTex = new THREE.CanvasTexture(tc);
    tileTex.colorSpace = THREE.SRGBColorSpace;
    tileTex.wrapS = THREE.RepeatWrapping;
    tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(8, 10);

    // Wet reflective plaza ground
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 58),
      new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.14,
        metalness: 0.44,
      })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(-44, 0.02, 60);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Subtle realistic wet reflective puddles across the bazaar floor
    const puddles = [
      { x: -39, z: 55, w: 4.8, d: 3.4, col: 0xff8c52 },
      { x: -46, z: 58, w: 5.4, d: 3.8, col: 0x22d3ee },
      { x: -42, z: 64, w: 4.5, d: 3.2, col: 0xfb7185 },
      { x: -51, z: 55, w: 4.2, d: 3.0, col: 0xfbbf24 },
      { x: -35, z: 61, w: 4.0, d: 2.8, col: 0x38bdf8 },
    ];
    puddles.forEach((pd) => {
      // Dark glossy water puddle base
      const waterBase = new THREE.Mesh(
        new THREE.CircleGeometry(1, 20),
        new THREE.MeshStandardMaterial({
          color: 0x0b1220,
          roughness: 0.05,
          metalness: 0.85,
          transparent: true,
          opacity: 0.52,
        })
      );
      waterBase.rotation.x = -Math.PI / 2;
      waterBase.scale.set(pd.w, pd.d, 1);
      waterBase.position.set(pd.x, 0.028, pd.z);
      this.scene.add(waterBase);

      // Soft muted neon bounce reflection on the puddle surface
      const pMesh = new THREE.Mesh(
        new THREE.CircleGeometry(1, 20),
        new THREE.MeshBasicMaterial({
          map: getGlowTexture(),
          color: pd.col,
          transparent: true,
          opacity: 0.085,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.scale.set(pd.w * 0.9, pd.d * 0.9, 1);
      pMesh.position.set(pd.x, 0.032, pd.z);
      this.scene.add(pMesh);
    });

    // Entrance Neon Arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0x23192b, roughness: 0.55 });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.4, 0.85), archMat);
    leftPost.position.set(-23, 3.7, 53);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.4, 0.85), archMat);
    rightPost.position.set(-23, 3.7, 67);
    this.scene.add(leftPost, rightPost);

    const archSignTex = createSignTexture('MANGROVE BAZAAR', '#180e24', '#ffe8c2', '#fb7185');
    const archSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 2.2, 14.8),
      new THREE.MeshBasicMaterial({ map: archSignTex })
    );
    archSign.position.set(-23, 6.9, 60);
    this.scene.add(archSign);

    // Market Stalls with striped canopies, glowing NEON SIGNS, hanging lanterns & props
    const stallSpecs = [
      { x: -32, z: 42, ry: 0, col: '#e11d48', sign: 'NIGHT RAMEN', neon: '#fb7185' },
      { x: -42, z: 42, ry: 0, col: '#0d9488', sign: 'SPICE COVE', neon: '#22d3ee' },
      { x: -54, z: 42, ry: 0, col: '#d97706', sign: 'CORAL GRILL', neon: '#fbbf24' },
      { x: -32, z: 78, ry: Math.PI, col: '#9333ea', sign: 'BAZAAR INK', neon: '#c084fc' },
      { x: -42, z: 78, ry: Math.PI, col: '#e11d48', sign: 'NOODLE BAR', neon: '#f97316' },
      { x: -54, z: 78, ry: Math.PI, col: '#0284c7', sign: 'TIDE LOUNGE', neon: '#38bdf8' },
      { x: -62, z: 54, ry: Math.PI / 2, col: '#be123c', sign: 'CYBER PAWN', neon: '#f43f5e' },
      { x: -62, z: 66, ry: Math.PI / 2, col: '#0f766e', sign: 'MANGROVE TEA', neon: '#34d399' },
    ];

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e3422, roughness: 0.85 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x7c5534, roughness: 0.86 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 });

    stallSpecs.forEach((sp) => {
      const g = new THREE.Group();
      g.position.set(sp.x, 0, sp.z);
      g.rotation.y = sp.ry;

      const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.15, 2.2), woodMat);
      counter.position.set(0, 0.58, 0);
      counter.castShadow = true;
      counter.receiveShadow = true;
      g.add(counter);

      // Market merchandise props on counter (steaming pot, jars, stacked boxes)
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.42, 10), metalMat);
      pot.position.set(-1.6, 1.36, 0.1);
      g.add(pot);
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.65), crateMat);
      box1.position.set(1.5, 1.38, -0.1);
      g.add(box1);
      const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
      box2.position.set(0.3, 1.32, 0.25);
      g.add(box2);

      // 4 support posts
      [[-2.9, -0.9], [2.9, -0.9], [-2.9, 0.9], [2.9, 0.9]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.3, 0.16), woodMat);
        post.position.set(px, 1.65, pz);
        g.add(post);
      });

      // Striped market canopy awning
      const awnTex = createStripedAwningTexture(sp.col, '#fef3c7');
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.18, 3.3),
        new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.62 })
      );
      awning.position.set(0, 3.32, 0.2);
      awning.rotation.x = 0.18;
      awning.castShadow = true;
      g.add(awning);

      // Glowing NEON SIGN mounted atop the front fascia of every stall!
      const sTex = createSignTexture(sp.sign, '#0f172a', '#ffffff', sp.neon);
      const neonBoard = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.92, 0.16),
        new THREE.MeshBasicMaterial({ map: sTex })
      );
      neonBoard.position.set(0, 3.92, 1.48);
      g.add(neonBoard);

      const neonHalo = createGlowSprite(new THREE.Color(sp.neon).getHex(), 3.6, 0.78);
      neonHalo.position.set(0, 3.9, 1.72);
      g.add(neonHalo);
      this.lanternGlows.push(neonHalo);

      // Hanging red/gold paper lanterns beneath awning eaves
      [-2.1, 0, 2.1].forEach((lx) => {
        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 8),
          new THREE.MeshBasicMaterial({ color: lx === 0 ? 0xffd166 : 0xff4d4d })
        );
        lantern.scale.set(1, 1.35, 1);
        lantern.position.set(lx, 2.75, 1.45);
        g.add(lantern);
      });

      const warmGlow = createGlowSprite(0xffb454, 2.5, 0.85);
      warmGlow.position.set(0, 2.7, 0.9);
      g.add(warmGlow);
      this.lanternGlows.push(warmGlow);

      // Plastic street stools in front of stall
      const stoolMat = new THREE.MeshStandardMaterial({ color: sp.col, roughness: 0.5 });
      [-1.4, 0.8].forEach((sx) => {
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.52, 8), stoolMat);
        stool.position.set(sx, 0.26, 2.0);
        g.add(stool);
      });

      g.add(createContactShadow(7.0, 3.4, 0.54));
      this.scene.add(g);
      this.colliders.push({ x: sp.x, z: sp.z, hw: 3.4, hd: 1.5 });
    });

    // Night Market Props: Glowing Neon Vending Machines, Folding Tables, Barrels & Tactical Cover Crates
    const vendingSpecs = [
      { x: -58.5, z: 48, ry: Math.PI / 2, col: '#22d3ee' },
      { x: -58.5, z: 72, ry: Math.PI / 2, col: '#fb7185' },
    ];
    vendingSpecs.forEach((vm) => {
      const vg = new THREE.Group();
      vg.position.set(vm.x, 0, vm.z);
      vg.rotation.y = vm.ry;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.35, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.4 })
      );
      body.position.y = 1.18;
      body.castShadow = true;
      vg.add(body);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 1.35),
        new THREE.MeshBasicMaterial({ color: vm.col })
      );
      screen.position.set(0, 1.38, 0.52);
      vg.add(screen);
      const vGlow = createGlowSprite(new THREE.Color(vm.col).getHex(), 2.8, 0.72);
      vGlow.position.set(0, 1.4, 0.8);
      vg.add(vGlow);
      this.lanternGlows.push(vGlow);
      this.scene.add(vg);
    });

    // Tactical cover crates + barrels + folding street tables
    [
      { x: -37, z: 54 }, { x: -48, z: 65 }, { x: -34, z: 66 }, { x: -52, z: 52 },
    ].forEach((c, idx) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.25, 1.7), crateMat);
      crate.position.set(c.x, 0.62, c.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);

      // Barrel or stacked smaller crate next to cover
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 1.05, 10),
        new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0x0e7490 : 0x9f1239, roughness: 0.55, metalness: 0.35 })
      );
      barrel.position.set(c.x + 1.25, 0.52, c.z - 0.3);
      barrel.castShadow = true;
      this.scene.add(barrel);

      this.colliders.push({ x: c.x, z: c.z, hw: 1.0, hd: 1.0 });
    });

    // Overhead string cables with soft radial-gradient glowing lanterns
    const wireMat = new THREE.LineBasicMaterial({ color: 0x222630 });
    const lanternColors = [0xffa94d, 0xfb7185, 0xffd166, 0x22d3ee];
    const stringRows = [47, 55, 63, 71];
    stringRows.forEach((zRow, rIdx) => {
      const pts = [];
      for (let step = 0; step <= 8; step++) {
        const t = step / 8;
        const x = -25 - t * 36;
        const sag = Math.sin(t * Math.PI) * 1.1;
        pts.push(new THREE.Vector3(x, 6.4 - sag, zRow));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(lineGeo, wireMat));

      for (let step = 1; step < 8; step++) {
        const p = pts[step];
        const col = lanternColors[(step + rIdx) % lanternColors.length];
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.17, 8, 8),
          new THREE.MeshBasicMaterial({ color: col })
        );
        bulb.position.copy(p).add(new THREE.Vector3(0, -0.22, 0));
        this.scene.add(bulb);

        const sprite = createGlowSprite(col, 2.7, 0.88);
        sprite.position.copy(bulb.position);
        this.scene.add(sprite);
        this.lanternGlows.push(sprite);
      }
    });

    // Vibrant night-market point lights reflecting off wet floor
    this.marketPoint1 = new THREE.PointLight(0xff8c42, 6, 40, 1.35);
    this.marketPoint1.position.set(-34, 4.8, 56);
    this.marketPoint2 = new THREE.PointLight(0xfb7185, 6, 40, 1.35);
    this.marketPoint2.position.set(-50, 4.8, 62);
    this.marketPoint3 = new THREE.PointLight(0x22d3ee, 5, 36, 1.4);
    this.marketPoint3.position.set(-42, 4.8, 49);
    this.marketPoint4 = new THREE.PointLight(0xfbbf24, 5, 34, 1.4);
    this.marketPoint4.position.set(-56, 4.8, 56);
    this.scene.add(this.marketPoint1, this.marketPoint2, this.marketPoint3, this.marketPoint4);
  }

  _buildBeachAndPalms() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5c43, roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x267c47, roughness: 0.72, side: THREE.DoubleSide });

    const createPalm = (x, z, scale = 1, lean = 0.14) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      let cy = 0;
      let cx = 0;
      const segs = 5;
      for (let i = 0; i < segs; i++) {
        const h = 1.58 * scale;
        const rBot = (0.31 - i * 0.035) * scale;
        const rTop = (0.27 - i * 0.035) * scale;
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 7), trunkMat);
        seg.position.set(cx, cy + h / 2, 0);
        seg.rotation.z = -lean * (i * 0.45);
        seg.castShadow = true;
        g.add(seg);
        cy += h * 0.94;
        cx += Math.sin(lean * i * 0.45) * h * 0.45;
      }

      const crown = new THREE.Group();
      crown.position.set(cx, cy, 0);
      for (let f = 0; f < 8; f++) {
        const ang = (f / 8) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.62 * scale, 4.1 * scale, 4), leafMat);
        frond.scale.set(1, 1, 0.22);
        frond.position.set(Math.cos(ang) * 1.65 * scale, -0.25 * scale, Math.sin(ang) * 1.65 * scale);
        frond.rotation.y = -ang;
        frond.rotation.z = -1.18;
        frond.castShadow = true;
        crown.add(frond);
      }
      g.add(crown);
      g.add(createContactShadow(3.5 * scale, 3.5 * scale, 0.46));
      this.scene.add(g);
      this.palms.push({ crown, phase: x * 0.17 + z * 0.11 });
    };

    // Place beach palms cleanly on the beach side (x = 18.8) keeping the chase/heli corridor (z = -38..-16) clear!
    for (let z = -148; z <= 160; z += 20) {
      if (z >= -44 && z <= -22) {
        // Place slightly further onto the beach so helicopter & spotlight stay 100% unobstructed
        createPalm(24.5, z, 0.88, 0.16);
      } else {
        createPalm(18.5, z, 0.94 + (Math.abs(z) % 4) * 0.04, 0.14);
      }
    }

    // Beach umbrellas & reclined lounge chairs along the right-side sandy beach
    const umbColors = ['#f43f5e', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.5 });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78 });

    for (let i = 0; i < 20; i++) {
      const z = -136 + i * 14.5;
      const x = 21.8 + (i % 2) * 5.6;
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.55, 6), poleMat);
      pole.position.y = 1.28;
      g.add(pole);

      const uTex = createStripedAwningTexture(umbColors[i % umbColors.length], '#ffffff');
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(2.25, 0.76, 10),
        new THREE.MeshStandardMaterial({ map: uTex, roughness: 0.68 })
      );
      canopy.position.y = 2.6;
      canopy.castShadow = true;
      g.add(canopy);

      // Pair of reclined beach lounge chairs
      [-0.85, 0.85].forEach((cz) => {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.22, 0.68), chairMat);
        bed.position.set(0.3, 0.22, cz);
        g.add(bed);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.68), chairMat);
        back.position.set(-0.62, 0.46, cz);
        back.rotation.z = 0.68;
        g.add(back);
      });

      g.add(createContactShadow(4.2, 4.2, 0.4));
      this.scene.add(g);
    }

    // Coastal Lifeguard Tower on the beach
    const lg = new THREE.Group();
    lg.position.set(29.5, 0, -56);
    const lgWood = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const lgRoof = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.6 });
    [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), lgWood);
      leg.position.set(px, 1.6, pz);
      lg.add(leg);
    });
    const hut = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), lgWood);
    hut.position.y = 4.1;
    lg.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.1, 4), lgRoof);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5.75;
    lg.add(roof);
    this.scene.add(lg);
  }

  _buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b485b, metalness: 0.68, roughness: 0.32 });
    for (let z = -140; z <= 150; z += 28) {
      [12.8, -12.8].forEach((x) => {
        // Keep east-side helicopter spotlight zone (z = -50..-24) completely pole-free!
        if (x > 0 && z >= -52 && z <= -22) return;

        const g = new THREE.Group();
        g.position.set(x, 0, z);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 6.6, 8), poleMat);
        pole.position.y = 3.3;
        g.add(pole);

        const armDir = x > 0 ? -1 : 1;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.12), poleMat);
        arm.position.set(armDir * 0.95, 6.5, 0);
        g.add(arm);

        const glow = createGlowSprite(0xffd28a, 3.0, 0.34);
        glow.position.set(armDir * 1.9, 6.3, 0);
        g.add(glow);
        this.streetLights.push(glow);

        this.scene.add(g);
      });
    }
  }

  _buildYachtsAndPeds() {
    // Luxury yachts cruising & moored in Coralina Bay
    const yachtSpecs = [
      { x: 56, z: -72, ry: Math.PI - 0.25, s: 1.05 },
      { x: 74, z: -108, ry: Math.PI + 0.3, s: 1.25 },
      { x: 92, z: -52, ry: Math.PI - 0.12, s: 1.1 },
      { x: 64, z: -18, ry: 0.4, s: 0.95 },
      { x: 84, z: 22, ry: Math.PI + 0.15, s: 1.15 },
    ];
    yachtSpecs.forEach((ys, i) => {
      const y = createYacht(ys.s);
      y.position.set(ys.x, -0.1, ys.z);
      y.rotation.y = ys.ry;
      this.scene.add(y);
      this.yachts.push({ mesh: y, baseY: -0.1, phase: i * 1.3 });
    });

    // Sidewalk pedestrians strolling along the Art-Deco shopfront strip (left of Marina Blvd)
    const pedSpecs = [
      { x: -14.6, z: -58, ry: 0.2 },
      { x: -13.9, z: -42, ry: Math.PI - 0.3 },
      { x: -14.8, z: -29, ry: 1.3 },
      { x: -14.1, z: -19, ry: 1.1 },
      { x: -14.5, z: -7, ry: Math.PI + 0.2 },
      { x: -13.8, z: 9, ry: 0.4 },
      { x: -14.6, z: 24, ry: Math.PI },
    ];
    pedSpecs.forEach((ps, i) => {
      const p = createCharacter('ped', i);
      p.mesh.position.set(ps.x, 0.16, ps.z);
      p.mesh.rotation.y = ps.ry;
      p.setPose('walk', i * 0.9);
      this.scene.add(p.mesh);
      this.sidewalkPeds.push({ char: p, phase: i * 1.1 });
    });
  }

  update(time) {
    for (const p of this.palms) {
      p.crown.rotation.z = Math.sin(time * 1.4 + p.phase) * 0.045;
    }
    for (const f of this.foamStrips) {
      f.mesh.position.x = f.baseX + Math.sin(time * 1.5 + f.phase) * 0.65;
    }
    for (const y of this.yachts) {
      y.mesh.position.y = y.baseY + Math.sin(time * 1.2 + y.phase) * 0.14;
      y.mesh.rotation.z = Math.sin(time * 0.9 + y.phase) * 0.025;
    }
    if (this.oceanTex) {
      this.oceanTex.offset.y = (time * 0.025) % 1;
    }
  }
}
