import * as THREE from 'three';

export const DISTRICTS = [
  { id: 'paloma', name: 'PALOMA STRIP', subtitle: 'OCEANFRONT PROMENADE', standing: 58, status: 'NEUTRAL', color: '#f59e0b', bounds: { xMin: -25, xMax: 65, zMin: -110, zMax: 35 } },
  { id: 'heights', name: 'SOLMAR HEIGHTS', subtitle: 'FINANCIAL SKYLINE', standing: 64, status: 'NEUTRAL', color: '#38bdf8', bounds: { xMin: -160, xMax: -25, zMin: -140, zMax: 15 } },
  { id: 'lantern', name: 'LANTERN QUAY', subtitle: 'NIGHT MARKET & SMUGGLER ALLEY', standing: 74, status: 'FRIENDLY', color: '#f97316', bounds: { xMin: -110, xMax: -14, zMin: 15, zMax: 120 } },
  { id: 'calypso', name: 'CALYPSO DOCKS', subtitle: 'CONTAINER PIERS', standing: 48, status: 'NEUTRAL', color: '#10b981', bounds: { xMin: -30, xMax: 65, zMin: 35, zMax: 190 } },
  { id: 'mirador', name: 'MIRADOR HILLS', subtitle: 'COASTAL CLIFF ESTATES', standing: 52, status: 'NEUTRAL', color: '#a855f7', bounds: { xMin: -220, xMax: -110, zMin: -190, zMax: 40 } },
  { id: 'salinas', name: 'SALINAS FLATS', subtitle: 'INDUSTRIAL YARDS', standing: 61, status: 'NEUTRAL', color: '#eab308', bounds: { xMin: -220, xMax: -110, zMin: 40, zMax: 190 } },
  { id: 'coral', name: 'CORAL KEY', subtitle: 'MARINA & PRIVATE STRIP', standing: 69, status: 'FRIENDLY', color: '#ec4899', bounds: { xMin: 65, xMax: 180, zMin: -160, zMax: 160 } },
];

export function getDistrictAt(x, z) {
  for (const d of DISTRICTS) {
    const b = d.bounds;
    if (x >= b.xMin && x <= b.xMax && z >= b.zMin && z <= b.zMax) return d;
  }
  return DISTRICTS[0];
}

// Shared soft radial-gradient glow texture (never flat circles)
let _glowTex = null;
export function getGlowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.82)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.78, 'rgba(255,255,255,0.06)');
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

// Seamless periodic value noise on a cylinder/sphere so u=0 and u=1 match identically
function seamlessCloudFbm(theta, v) {
  const cx = Math.cos(theta);
  const sx = Math.sin(theta);
  let val = 0;
  let amp = 0.52;
  let freq = 2.0;
  for (let i = 0; i < 4; i++) {
    const a = cx * freq + v * freq * 1.4 + i * 1.7;
    const b = sx * freq - v * freq * 1.1 + i * 2.3;
    const wave = Math.sin(a * 1.3 + Math.cos(b * 1.7)) * Math.cos(b * 1.2 - Math.sin(a * 1.1));
    val += (wave * 0.5 + 0.5) * amp;
    freq *= 2.05;
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

  // Sun direction in spherical coords (placed nicely over the coastal horizon)
  const sunU = 0.23;
  const sunV = 0.44;

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1); // 0 = zenith, 0.5 = horizon, 1 = nadir
    const elev = Math.max(0, 1 - v * 2); // 1 at zenith, 0 at horizon

    let r, g, b;
    if (!isNight) {
      // Golden-hour sunset sky gradient
      if (v < 0.5) {
        const t = v / 0.5; // 0 zenith -> 1 horizon
        const t2 = Math.pow(t, 1.45);
        r = 26 + 228 * t2;
        g = 52 + 124 * Math.pow(t, 1.3) - 18 * Math.pow(t, 3.0);
        b = 118 + 64 * Math.sin(t * Math.PI) - 42 * Math.pow(t, 2.2);
      } else {
        // Below horizon warm haze
        const t = (v - 0.5) / 0.5;
        r = 250 - 170 * t;
        g = 158 - 96 * t;
        b = 108 - 44 * t;
      }
    } else {
      // Deep twilight/night coastal sky
      if (v < 0.5) {
        const t = v / 0.5;
        r = 9 + 34 * Math.pow(t, 2.0);
        g = 14 + 36 * Math.pow(t, 1.8);
        b = 34 + 62 * Math.pow(t, 1.4);
      } else {
        r = 14;
        g = 18;
        b = 32;
      }
    }

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const theta = u * Math.PI * 2;

      let pr = r;
      let pg = g;
      let pb = b;

      // Seamless clouds in upper hemisphere
      if (v < 0.52) {
        const cloudMask = Math.sin(Math.min(1, v / 0.52) * Math.PI);
        const f = seamlessCloudFbm(theta, v * 2.4);
        const cAmt = Math.max(0, (f - 0.52) * 2.3) * cloudMask;
        if (!isNight) {
          // Warm sunlit coral/gold clouds
          const cr = 255;
          const cg = 188 + 42 * (1 - elev);
          const cb = 146 + 40 * elev;
          pr = pr * (1 - cAmt * 0.65) + cr * (cAmt * 0.65);
          pg = pg * (1 - cAmt * 0.65) + cg * (cAmt * 0.65);
          pb = pb * (1 - cAmt * 0.65) + cb * (cAmt * 0.65);
        } else {
          pr = pr + cAmt * 18;
          pg = pg + cAmt * 22;
          pb = pb + cAmt * 38;
        }
      }

      // Periodic angular distance to sun/moon so even the halo wraps seamlessly
      let du = Math.abs(u - sunU);
      if (du > 0.5) du = 1 - du;
      const dv = (v - sunV) * 0.65;
      const dist = Math.sqrt(du * du + dv * dv);

      if (!isNight) {
        const halo = Math.exp(-dist * 10.5) * 0.85;
        const core = Math.exp(-dist * 46.0) * 1.1;
        pr = Math.min(255, pr + 255 * (halo * 0.55 + core));
        pg = Math.min(255, pg + 215 * (halo * 0.45 + core * 0.95));
        pb = Math.min(255, pb + 135 * (halo * 0.25 + core * 0.78));
      } else {
        const moonHalo = Math.exp(-dist * 16.0) * 0.35;
        const moonCore = Math.exp(-dist * 75.0) * 0.9;
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
    // Crisp stars
    ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 240; i++) {
      const sx = rand() * w;
      const sy = rand() * (h * 0.42);
      const sz = rand() < 0.2 ? 2 : 1.1;
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

function createBuildingWindowTexture(baseHex, litHex, isNight, seedOffset = 0) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 512);

  // Architectural mullions
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
      const litChance = isNight ? 0.56 : 0.32;
      const isLit = rand() < litChance;
      ctx.fillStyle = isLit ? litHex : (isNight ? '#111927' : '#2a3d52');
      ctx.fillRect(col * 32 + 6, row * 32 + 7, 20, 19);
      if (isLit) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
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
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.font = '900 54px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
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
  ctx.fillStyle = '#242933';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 4200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 197) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Side curb edges
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(14, 0, 5, 512);
  ctx.fillRect(493, 0, 5, 512);

  // Double yellow center line
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(248, 0, 5, 512);
  ctx.fillRect(259, 0, 5, 512);

  // Dashed lane lines
  ctx.fillStyle = 'rgba(241,245,249,0.82)';
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
    this.colliders = []; // { x, z, hw, hd }
    this.palms = [];
    this.lanternGlows = [];
    this.streetLights = [];
    this.foamStrips = [];
    this.buildingMats = [];

    this._buildLighting();
    this._buildSky();
    this._buildTerrainAndCoast();
    this._buildRoads();
    this._buildSkyline();
    this._buildNightMarket();
    this._buildBeachAndPalms();
    this._buildStreetlights();
  }

  _buildLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffd6a5, 0x2c3e50, 0.92);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffb870, 2.35);
    this.sunLight.position.set(85, 52, -75);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    const d = 88;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Subtle cool rim fill from the ocean side
    this.fillLight = new THREE.DirectionalLight(0x52c4e8, 0.55);
    this.fillLight.position.set(-60, 35, 65);
    this.scene.add(this.fillLight);
  }

  _buildSky() {
    this.sunsetSkyTex = createSeamlessSkyTexture(false);
    this.nightSkyTex = createSeamlessSkyTexture(true);

    const skyGeo = new THREE.SphereGeometry(420, 48, 24);
    this.skyMat = new THREE.MeshBasicMaterial({
      map: this.sunsetSkyTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    this.scene.fog = new THREE.FogExp2(0xe29a72, 0.0046);
  }

  setMode(mode) {
    const night = mode === 'night';
    this.isNight = night;
    this.skyMat.map = night ? this.nightSkyTex : this.sunsetSkyTex;
    this.skyMat.needsUpdate = true;

    if (night) {
      this.scene.fog.color.setHex(0x0b1224);
      this.scene.fog.density = 0.0095;
      this.hemiLight.color.setHex(0x6388c2);
      this.hemiLight.groundColor.setHex(0x231c36);
      this.hemiLight.intensity = 0.96;
      this.sunLight.color.setHex(0x9ac0ff);
      this.sunLight.intensity = 1.1;
      this.sunLight.position.set(-55, 65, 45);
      this.fillLight.color.setHex(0xff9a52);
      this.fillLight.intensity = 0.78;
      this.oceanMat.color.setHex(0x082a3e);
      this.lanternGlows.forEach((s) => { s.material.opacity = 0.96; });
      this.streetLights.forEach((s) => { s.material.opacity = 0.88; });
      if (this.marketPoint1) this.marketPoint1.intensity = 28;
      if (this.marketPoint2) this.marketPoint2.intensity = 24;
      if (this.marketPoint3) this.marketPoint3.intensity = 20;
    } else {
      this.scene.fog.color.setHex(0xdf946d);
      this.scene.fog.density = 0.0044;
      this.hemiLight.color.setHex(0xffd8aa);
      this.hemiLight.groundColor.setHex(0x3a465c);
      this.hemiLight.intensity = 0.95;
      this.sunLight.color.setHex(0xffb468);
      this.sunLight.intensity = 2.45;
      this.sunLight.position.set(85, 46, -72);
      this.fillLight.color.setHex(0x52c4e8);
      this.fillLight.intensity = 0.58;
      this.oceanMat.color.setHex(0x0f8fa6);
      this.lanternGlows.forEach((s) => { s.material.opacity = 0.45; });
      this.streetLights.forEach((s) => { s.material.opacity = 0.25; });
      if (this.marketPoint1) this.marketPoint1.intensity = 4;
      if (this.marketPoint2) this.marketPoint2.intensity = 4;
      if (this.marketPoint3) this.marketPoint3.intensity = 4;
    }
  }

  _buildTerrainAndCoast() {
    // Main urban ground plane
    const cityGround = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 560),
      new THREE.MeshStandardMaterial({ color: 0x2c333f, roughness: 0.9, metalness: 0.05 })
    );
    cityGround.rotation.x = -Math.PI / 2;
    cityGround.position.set(-165, -0.02, 0);
    cityGround.receiveShadow = true;
    this.scene.add(cityGround);

    // Golden beach sand strip
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe6c896, roughness: 0.95, metalness: 0.0 });
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(24, 560), sandMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(27, -0.01, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Promenade seawall separating sidewalk & beach
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c7, roughness: 0.75 });
    const seawall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 560), wallMat);
    seawall.position.set(16.2, 0.37, 0);
    seawall.receiveShadow = true;
    seawall.castShadow = true;
    this.scene.add(seawall);

    // Turquoise ocean plane
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0f8fa6,
      roughness: 0.22,
      metalness: 0.38,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(360, 620), this.oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(216, -0.14, 0);
    this.scene.add(ocean);

    // Shallow turquoise water shelf near shore
    const shallow = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 560),
      new THREE.MeshBasicMaterial({ color: 0x38d0d6, transparent: true, opacity: 0.55 })
    );
    shallow.rotation.x = -Math.PI / 2;
    shallow.position.set(42, -0.08, 0);
    this.scene.add(shallow);

    // Shoreline white foam strips
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

    // Distant Coral Key island silhouette across the bay
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x456b52, roughness: 0.9 });
    const island = new THREE.Mesh(new THREE.CylinderGeometry(36, 48, 5, 16), islandMat);
    island.scale.set(0.7, 1, 2.8);
    island.position.set(165, 1.5, -55);
    this.scene.add(island);
  }

  _buildRoads() {
    const roadTex = createRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.78, metalness: 0.08 });

    // Primary Coastal Boulevard (Paloma Strip)
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(24, 540), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.01, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // Sidewalks flanking main road
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x8b949e, roughness: 0.85 });
    const eastWalk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 540), walkMat);
    eastWalk.position.set(14.0, 0.08, 0);
    eastWalk.receiveShadow = true;
    this.scene.add(eastWalk);

    const westWalk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 540), walkMat);
    westWalk.position.set(-14.0, 0.08, 0);
    westWalk.receiveShadow = true;
    this.scene.add(westWalk);

    // Cross avenues heading inland
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x262c36, roughness: 0.82 });
    [-110, -35, 45, 125].forEach((z) => {
      const cross = new THREE.Mesh(new THREE.PlaneGeometry(180, 14), crossMat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(-96, 0.015, z);
      cross.receiveShadow = true;
      this.scene.add(cross);
    });

    // Inland avenue
    const inland = new THREE.Mesh(new THREE.PlaneGeometry(16, 520), crossMat);
    inland.rotation.x = -Math.PI / 2;
    inland.position.set(-84, 0.014, 0);
    inland.receiveShadow = true;
    this.scene.add(inland);
  }

  _buildSkyline() {
    const specs = [
      // Oceanfront resort row (west of Paloma Strip)
      { x: -30, z: -135, w: 22, d: 24, h: 46, color: '#334155', lit: '#fde68a', sign: 'HOTEL SOLMAR', signColor: '#38bdf8', spire: true },
      { x: -30, z: -90, w: 20, d: 22, h: 32, color: '#475569', lit: '#fed7aa', sign: 'OCEAN CLUB', signColor: '#f472b6', helipad: true },
      { x: -30, z: -56, w: 22, d: 20, h: 58, color: '#1e293b', lit: '#bae6fd', sign: 'PALOMA PLAZA', signColor: '#f59e0b', spire: true },
      { x: -30, z: -12, w: 20, d: 24, h: 40, color: '#3b4252', lit: '#fde68a', helipad: true },
      { x: -30, z: 18, w: 18, d: 18, h: 28, color: '#43384c', lit: '#fdba74' },
      { x: -30, z: 105, w: 22, d: 24, h: 36, color: '#334155', lit: '#a5f3fc', sign: 'CALYPSO BAY', signColor: '#34d399' },
      { x: -30, z: 155, w: 22, d: 26, h: 44, color: '#1e293b', lit: '#fde68a' },

      // Second row taller downtown Solmar Heights skyscrapers
      { x: -62, z: -130, w: 24, d: 24, h: 74, color: '#1e293b', lit: '#7dd3fc', spire: true },
      { x: -62, z: -88, w: 22, d: 26, h: 92, color: '#0f172a', lit: '#fde68a', sign: 'MIRADOR TOWER', signColor: '#38bdf8', spire: true },
      { x: -62, z: -52, w: 24, d: 22, h: 66, color: '#273449', lit: '#fed7aa', helipad: true },
      { x: -62, z: -10, w: 22, d: 24, h: 82, color: '#1e293b', lit: '#bae6fd', spire: true },
      { x: -62, z: 145, w: 24, d: 24, h: 52, color: '#2c3648', lit: '#fdba74' },

      // Third row background skyline
      { x: -108, z: -115, w: 26, d: 26, h: 104, color: '#172033', lit: '#93c5fd', spire: true },
      { x: -108, z: -64, w: 28, d: 28, h: 86, color: '#243044', lit: '#fde68a' },
      { x: -108, z: -8, w: 24, d: 26, h: 72, color: '#1b263b', lit: '#fdba74', spire: true },
      { x: -108, z: 68, w: 26, d: 26, h: 58, color: '#232c3d', lit: '#fcd34d' },
      { x: -108, z: 122, w: 26, d: 26, h: 64, color: '#1e293b', lit: '#7dd3fc' },
    ];

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });

    specs.forEach((b, i) => {
      const tex = createBuildingWindowTexture(b.color, b.lit, false, i);
      const sideMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.45,
        metalness: 0.25,
        emissive: new THREE.Color(b.lit),
        emissiveMap: tex,
        emissiveIntensity: 0.28,
      });
      this.buildingMats.push(sideMat);

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      // Base podium
      const baseH = b.h * 0.68;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, baseH, b.d),
        [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]
      );
      base.position.y = baseH / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Stepped upper tower
      const topH = b.h * 0.32;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.74, topH, b.d * 0.74),
        [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]
      );
      top.position.y = baseH + topH / 2;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // Optional spire with aviation beacon
      if (b.spire) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 14, 8), spireMat);
        spire.position.y = b.h + 7;
        group.add(spire);
        const beacon = createGlowSprite(0xff3b3b, 3.2, 0.9);
        beacon.position.y = b.h + 14.2;
        group.add(beacon);
      }

      // Optional rooftop helipad
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

      // Optional glowing hotel/plaza roof sign facing the coast
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

  _buildNightMarket() {
    // Lantern Quay Night Market plaza around x: -64..-22, z: 32..88
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 56),
      new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.42, metalness: 0.18 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(-44, 0.02, 60);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Market entrance neon arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0x2a1f2d, roughness: 0.6 });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.2, 0.8), archMat);
    leftPost.position.set(-23, 3.6, 53);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.2, 0.8), archMat);
    rightPost.position.set(-23, 3.6, 67);
    this.scene.add(leftPost, rightPost);

    const archSignTex = createSignTexture('LANTERN QUAY', '#1b1124', '#ffe8c2', '#f97316');
    const archSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 2.2, 14.8),
      new THREE.MeshBasicMaterial({ map: archSignTex })
    );
    archSign.position.set(-23, 6.8, 60);
    this.scene.add(archSign);

    // Market stalls with striped awnings & cover crates
    const stallColors = [0xdc2626, 0x0d9488, 0xd97706, 0x9333ea, 0xe11d48, 0x0284c7];
    const stallPositions = [
      { x: -32, z: 42, ry: 0 },
      { x: -42, z: 42, ry: 0 },
      { x: -54, z: 42, ry: 0 },
      { x: -32, z: 78, ry: Math.PI },
      { x: -42, z: 78, ry: Math.PI },
      { x: -54, z: 78, ry: Math.PI },
      { x: -62, z: 54, ry: Math.PI / 2 },
      { x: -62, z: 66, ry: Math.PI / 2 },
    ];

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.85 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x7c5534, roughness: 0.88 });

    stallPositions.forEach((sp, i) => {
      const g = new THREE.Group();
      g.position.set(sp.x, 0, sp.z);
      g.rotation.y = sp.ry;

      // Counter
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.15, 2.2), woodMat);
      counter.position.set(0, 0.58, 0);
      counter.castShadow = true;
      counter.receiveShadow = true;
      g.add(counter);

      // 4 posts
      [[-2.9, -0.9], [2.9, -0.9], [-2.9, 0.9], [2.9, 0.9]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 0.16), woodMat);
        post.position.set(px, 1.6, pz);
        g.add(post);
      });

      // Sloped awning
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.18, 3.2),
        new THREE.MeshStandardMaterial({ color: stallColors[i % stallColors.length], roughness: 0.65 })
      );
      awning.position.set(0, 3.25, 0.2);
      awning.rotation.x = 0.18;
      awning.castShadow = true;
      g.add(awning);

      // Warm stall lantern glow
      const glow = createGlowSprite(0xffb454, 2.4, 0.85);
      glow.position.set(0, 2.75, 0.8);
      g.add(glow);
      this.lanternGlows.push(glow);

      g.add(createContactShadow(7.0, 3.2, 0.52));
      this.scene.add(g);
      this.colliders.push({ x: sp.x, z: sp.z, hw: 3.4, hd: 1.5 });
    });

    // Tactical cover crates in the plaza
    [
      { x: -37, z: 54 }, { x: -48, z: 65 }, { x: -34, z: 66 }, { x: -52, z: 52 },
    ].forEach((c) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.25, 1.7), crateMat);
      crate.position.set(c.x, 0.62, c.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.colliders.push({ x: c.x, z: c.z, hw: 1.0, hd: 1.0 });
    });

    // Overhead string cables with soft radial-gradient additive glow lanterns
    const wireMat = new THREE.LineBasicMaterial({ color: 0x222630 });
    const lanternColors = [0xffa94d, 0xff6b4a, 0xffd166, 0xff8c42];
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
        // Tiny lantern core bulb
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 8),
          new THREE.MeshBasicMaterial({ color: col })
        );
        bulb.position.copy(p).add(new THREE.Vector3(0, -0.22, 0));
        this.scene.add(bulb);

        // Soft radial additive glow sprite (never flat circles)
        const sprite = createGlowSprite(col, 2.5, 0.85);
        sprite.position.copy(bulb.position);
        this.scene.add(sprite);
        this.lanternGlows.push(sprite);
      }
    });

    // Warm night-market point lights
    this.marketPoint1 = new THREE.PointLight(0xff9b42, 6, 38, 1.4);
    this.marketPoint1.position.set(-34, 5.2, 56);
    this.marketPoint2 = new THREE.PointLight(0xff7742, 6, 38, 1.4);
    this.marketPoint2.position.set(-50, 5.2, 64);
    this.marketPoint3 = new THREE.PointLight(0x38bdf8, 5, 32, 1.5);
    this.marketPoint3.position.set(-24, 5.5, 60);
    this.scene.add(this.marketPoint1, this.marketPoint2, this.marketPoint3);
  }

  _buildBeachAndPalms() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5c43, roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d47, roughness: 0.72, side: THREE.DoubleSide });

    const createPalm = (x, z, scale = 1, lean = 0.14) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      // Curved segmented trunk
      let cy = 0;
      let cx = 0;
      const segs = 5;
      for (let i = 0; i < segs; i++) {
        const h = 1.65 * scale;
        const rBot = (0.32 - i * 0.035) * scale;
        const rTop = (0.28 - i * 0.035) * scale;
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 7), trunkMat);
        seg.position.set(cx, cy + h / 2, 0);
        seg.rotation.z = -lean * (i * 0.45);
        seg.castShadow = true;
        g.add(seg);
        cy += h * 0.94;
        cx += Math.sin(lean * i * 0.45) * h * 0.45;
      }

      // Frond crown
      const crown = new THREE.Group();
      crown.position.set(cx, cy, 0);
      for (let f = 0; f < 7; f++) {
        const ang = (f / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.65 * scale, 4.2 * scale, 4), leafMat);
        frond.scale.set(1, 1, 0.22);
        frond.position.set(Math.cos(ang) * 1.7 * scale, -0.25 * scale, Math.sin(ang) * 1.7 * scale);
        frond.rotation.y = -ang;
        frond.rotation.z = -1.18;
        frond.castShadow = true;
        crown.add(frond);
      }
      g.add(crown);
      g.add(createContactShadow(3.6 * scale, 3.6 * scale, 0.48));
      this.scene.add(g);
      this.palms.push({ crown, phase: x * 0.17 + z * 0.11 });
    };

    // Palms lining Paloma Strip promenade & west sidewalk
    for (let z = -150; z <= 165; z += 18) {
      createPalm(15.2, z, 0.95 + (Math.abs(z) % 5) * 0.05, 0.13);
      if (Math.abs(z - 45) > 12 && Math.abs(z + 35) > 12 && Math.abs(z + 110) > 12) {
        createPalm(-15.0, z + 6, 0.92, -0.1);
      }
    }

    // Beach umbrellas & lounge chairs
    const umbColors = [0xf43f5e, 0x0ea5e9, 0xf59e0b, 0x10b981, 0xec4899];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.5 });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });

    for (let i = 0; i < 16; i++) {
      const z = -130 + i * 17;
      const x = 22.5 + (i % 2) * 5.2;
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), poleMat);
      pole.position.y = 1.25;
      g.add(pole);

      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 0.72, 8),
        new THREE.MeshStandardMaterial({ color: umbColors[i % umbColors.length], roughness: 0.7 })
      );
      canopy.position.y = 2.55;
      canopy.castShadow = true;
      g.add(canopy);

      const chair = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 0.75), chairMat);
      chair.position.set(0.2, 0.2, 1.15);
      g.add(chair);

      g.add(createContactShadow(3.8, 3.8, 0.42));
      this.scene.add(g);
    }
  }

  _buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 });
    for (let z = -140; z <= 150; z += 26) {
      [12.5, -12.5].forEach((x) => {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.6, 8), poleMat);
        pole.position.y = 3.8;
        g.add(pole);

        const armDir = x > 0 ? -1 : 1;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.14), poleMat);
        arm.position.set(armDir * 1.0, 7.5, 0);
        g.add(arm);

        const glow = createGlowSprite(0xffd28a, 3.2, 0.32);
        glow.position.set(armDir * 2.0, 7.3, 0);
        g.add(glow);
        this.streetLights.push(glow);

        this.scene.add(g);
      });
    }
  }

  update(time) {
    // Gentle palm sway
    for (const p of this.palms) {
      p.crown.rotation.z = Math.sin(time * 1.4 + p.phase) * 0.045;
    }
    // Animated shoreline foam
    for (const f of this.foamStrips) {
      f.mesh.position.x = f.baseX + Math.sin(time * 1.5 + f.phase) * 0.65;
    }
  }
}
