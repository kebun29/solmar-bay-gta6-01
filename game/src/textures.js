// Coralina Bay: Sunset Syndicate — Procedural PBR Canvas Textures & Volumetric Sprite Maps
import * as THREE from 'three';

let sharedGlowTex = null;
let sharedContactShadowTex = null;
let sharedFireTex = null;
let sharedSmokeTex = null;
let cachedCBPDDoorTex = null;
let cachedHeroTopTex = null;
let cachedHeroSideTex = null;
let cachedCrateTex = null;
let cachedHazardDrumTex = null;

export function getGlowTexture() {
  if (sharedGlowTex) return sharedGlowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.24, 'rgba(255,255,255,0.86)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  sharedGlowTex = new THREE.CanvasTexture(c);
  return sharedGlowTex;
}

export function getFireSpriteTexture() {
  if (sharedFireTex) return sharedFireTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 72, 4, 64, 64, 60);
  g.addColorStop(0.0, 'rgba(255, 253, 232, 1.0)');
  g.addColorStop(0.22, 'rgba(255, 210, 92, 0.94)');
  g.addColorStop(0.50, 'rgba(255, 112, 32, 0.72)');
  g.addColorStop(0.78, 'rgba(205, 36, 22, 0.28)');
  g.addColorStop(1.0, 'rgba(80, 10, 8, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  sharedFireTex = new THREE.CanvasTexture(c);
  sharedFireTex.colorSpace = THREE.SRGBColorSpace;
  return sharedFireTex;
}

export function getSmokeSpriteTexture() {
  if (sharedSmokeTex) return sharedSmokeTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  // Multi-lobe soft volumetric cloud puff
  const puffs = [
    [64, 64, 48, 0.58],
    [48, 56, 36, 0.42],
    [80, 58, 34, 0.40],
    [62, 46, 32, 0.36],
  ];
  for (const [x, y, r, a] of puffs) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.52, `rgba(230,235,245,${a * 0.55})`);
    g.addColorStop(1, 'rgba(200,210,225,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  sharedSmokeTex = new THREE.CanvasTexture(c);
  return sharedSmokeTex;
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

export function getContactShadowTexture() {
  if (sharedContactShadowTex) return sharedContactShadowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  g.addColorStop(0, 'rgba(3, 6, 14, 0.88)');
  g.addColorStop(0.56, 'rgba(3, 6, 14, 0.48)');
  g.addColorStop(1, 'rgba(3, 6, 14, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  sharedContactShadowTex = new THREE.CanvasTexture(c);
  return sharedContactShadowTex;
}

export function createContactShadow(width, depth, opacity = 0.72) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.032;
  return m;
}

function seamlessCloudFbm(theta, v) {
  let sum = 0;
  let amp = 0.52;
  let freq = 2.0;
  for (let o = 0; o < 4; o++) {
    const cx = Math.cos(theta * freq + o * 1.15);
    const sx = Math.sin(theta * freq - o * 0.75);
    const n =
      Math.sin(cx * 2.1 + v * freq * 3.1 + o * 1.7) *
      Math.cos(sx * 1.9 - v * freq * 2.4 + o * 0.9);
    sum += n * amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return sum;
}

export function createSeamlessSkyTexture(mode = 'sunset') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  const isNight = mode === 'night';
  const isMidday = mode === 'midday';

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  if (isNight) {
    g.addColorStop(0.0, '#040814');
    g.addColorStop(0.28, '#0b1630');
    g.addColorStop(0.50, '#18264a');
    g.addColorStop(0.68, '#28234b');
    g.addColorStop(0.84, '#1b1d36');
    g.addColorStop(1.0, '#090c17');
  } else if (isMidday) {
    // Vibrant Miami / Vice Tropical Midday Sky
    g.addColorStop(0.0, '#0b5fa5');
    g.addColorStop(0.24, '#1c8cd6');
    g.addColorStop(0.46, '#4ec3f7');
    g.addColorStop(0.66, '#9ce4ff');
    g.addColorStop(0.80, '#d8f6ff');
    g.addColorStop(1.0, '#8dd5e8');
  } else {
    // Rich Golden-Coral Sunset Sky
    g.addColorStop(0.0, '#1c3158');
    g.addColorStop(0.22, '#4b4879');
    g.addColorStop(0.40, '#9e5478');
    g.addColorStop(0.56, '#e57664');
    g.addColorStop(0.70, '#fba864');
    g.addColorStop(0.84, '#ffe19c');
    g.addColorStop(1.0, '#e59a74');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  if (isNight) {
    for (let i = 0; i < 420; i++) {
      const sx = (Math.sin(i * 127.1 + 1.3) * 0.5 + 0.5) * 1024;
      const sy = (Math.cos(i * 311.7 + 2.1) * 0.5 + 0.5) * 235;
      const r = 0.65 + (i % 3) * 0.45;
      ctx.fillStyle = i % 7 === 0 ? 'rgba(180, 224, 255, 0.92)' : 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const mg = ctx.createRadialGradient(340, 128, 5, 340, 128, 72);
    mg.addColorStop(0, 'rgba(235, 245, 255, 0.92)');
    mg.addColorStop(0.25, 'rgba(180, 210, 255, 0.4)');
    mg.addColorStop(1, 'rgba(180, 210, 255, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(260, 48, 160, 160);
  } else if (isMidday) {
    // High bright tropical sun halo
    const sunX = 760;
    const sunY = 148;
    const sg = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 210);
    sg.addColorStop(0.0, 'rgba(255, 255, 248, 0.96)');
    sg.addColorStop(0.18, 'rgba(255, 252, 225, 0.65)');
    sg.addColorStop(0.45, 'rgba(200, 245, 255, 0.22)');
    sg.addColorStop(1.0, 'rgba(200, 245, 255, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, 1024, 420);

    // Crisp white tropical cumulus clouds
    const imgData = ctx.getImageData(0, 0, 1024, 512);
    const data = imgData.data;
    for (let y = 95; y < 340; y++) {
      const v = y / 512;
      const bandMask = Math.sin(((y - 95) / 245) * Math.PI);
      for (let x = 0; x < 1024; x++) {
        const theta = (x / 1024) * Math.PI * 2;
        const n = seamlessCloudFbm(theta, v * 1.65);
        const density = Math.max(0, (n - 0.14) * 1.48) * bandMask;
        if (density <= 0.01) continue;
        const a = Math.min(0.64, density);
        const idx = (y * 1024 + x) * 4;
        data[idx] = Math.round(data[idx] * (1 - a) + 255 * a);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + 255 * a);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + 255 * a);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // Sunset horizon sun bloom + sunlit clouds
    const sunX = 768;
    const sunY = 330;
    const sg = ctx.createRadialGradient(sunX, sunY, 16, sunX, sunY, 270);
    sg.addColorStop(0.0, 'rgba(255, 252, 220, 0.92)');
    sg.addColorStop(0.18, 'rgba(255, 214, 130, 0.64)');
    sg.addColorStop(0.45, 'rgba(252, 135, 92, 0.28)');
    sg.addColorStop(1.0, 'rgba(251, 113, 133, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, 1024, 512);

    const imgData = ctx.getImageData(0, 0, 1024, 512);
    const data = imgData.data;
    for (let y = 115; y < 365; y++) {
      const v = y / 512;
      const bandMask = Math.sin(((y - 115) / 250) * Math.PI);
      for (let x = 0; x < 1024; x++) {
        const theta = (x / 1024) * Math.PI * 2;
        const n = seamlessCloudFbm(theta, v * 1.5);
        const density = Math.max(0, (n - 0.07) * 1.38) * bandMask;
        if (density <= 0.01) continue;

        let dx = Math.abs(x - sunX);
        if (dx > 512) dx = 1024 - dx;
        const sunProx = Math.max(0, 1 - Math.hypot(dx / 245, (y - sunY) / 145));
        const cr = 255;
        const cg = Math.round(166 + sunProx * 78);
        const cb = Math.round(150 + sunProx * 62);
        const a = Math.min(0.48, density * (0.58 + sunProx * 0.42));

        const idx = (y * 1024 + x) * 4;
        data[idx] = Math.round(data[idx] * (1 - a) + cr * a);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + cg * a);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + cb * a);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createOceanShimmerTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c8ea6';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 6) {
    const wave = Math.sin(y * 0.09) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(34, 211, 238, ${0.06 + wave * 0.09})`;
    ctx.fillRect(0, y, 512, 3);
  }
  for (let i = 0; i < 420; i++) {
    const x = (i * 73) % 512;
    const y = (i * 41) % 512;
    const w = 12 + (i % 24);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.24)' : 'rgba(103, 232, 249, 0.18)';
    ctx.fillRect(x, y, w, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 14);
  return tex;
}

export function createSunPathTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, 'rgba(255, 236, 175, 0.65)');
  g.addColorStop(0.35, 'rgba(255, 198, 120, 0.42)');
  g.addColorStop(0.75, 'rgba(255, 155, 108, 0.18)');
  g.addColorStop(1.0, 'rgba(255, 140, 100, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);

  ctx.globalCompositeOperation = 'destination-in';
  const hg = ctx.createLinearGradient(0, 0, 256, 0);
  hg.addColorStop(0.0, 'rgba(0,0,0,0)');
  hg.addColorStop(0.28, 'rgba(0,0,0,0.48)');
  hg.addColorStop(0.5, 'rgba(0,0,0,1)');
  hg.addColorStop(0.72, 'rgba(0,0,0,0.48)');
  hg.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, 256, 512);

  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 65; i++) {
    const y = (i / 65) * 480;
    const w = 30 + (i % 5) * 18;
    const x = 128 - w / 2 + Math.sin(i * 1.9) * 24;
    ctx.fillStyle = 'rgba(255, 248, 215, 0.34)';
    ctx.fillRect(x, y, w, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStripedAwningTexture(colorA, colorB = '#fff8f0') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(i * 32, 0, 32, 128);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 114, 256, 14);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createBuildingWindowTexture(baseHex, litHex, isNight, seedOffset = 0) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Subtle Art-Deco stucco plaster grain
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 900; i++) {
    const gx = (i * 61 + seedOffset * 17) % 256;
    const gy = (i * 97 + seedOffset * 23) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(gx, gy, 3, 3);
  }

  // Architectural floor ledges
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let y = 0; y < 512; y += 32) {
    ctx.fillRect(0, y, 256, 3);
  }

  const cols = 6;
  const rows = 16;
  const padX = 8;
  const padY = 6;
  const w = (256 - padX * (cols + 1)) / cols;
  const h = (512 - padY * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const seed = (r * 31 + col * 17 + seedOffset * 13) % 100;
      const lit = isNight ? seed > 36 : seed > 56;
      const x = padX + col * (w + padX);
      const y = padY + r * (h + padY);
      ctx.fillStyle = lit ? litHex : '#1b273b';
      ctx.fillRect(x, y, w, h);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x + 2, y + 2, w - 4, h * 0.35);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createSignTexture(text, bgColor, fgColor, glowColor) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = fgColor;
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Cracked coastal asphalt with wet reflective puddles & crisp double-yellow / white lane markings
export function createRoadTextures() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Roughness map canvas (dark = glossy wet puddle, bright = dry rough asphalt)
  const rc = document.createElement('canvas');
  rc.width = 512;
  rc.height = 512;
  const rctx = rc.getContext('2d');

  ctx.fillStyle = '#252a34';
  ctx.fillRect(0, 0, 512, 512);
  rctx.fillStyle = '#c8c8c8'; // ~0.78 roughness dry asphalt
  rctx.fillRect(0, 0, 512, 512);

  // Subtle aggregate grain
  for (let i = 0; i < 3200; i++) {
    const x = (i * 53) % 512;
    const y = (i * 97) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.065)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Asphalt tar cracks
  ctx.strokeStyle = 'rgba(10, 12, 18, 0.55)';
  ctx.lineWidth = 1.6;
  const cracks = [
    [[78, 42], [96, 86], [88, 134], [112, 168]],
    [[372, 210], [398, 252], [385, 304], [412, 344]],
    [[148, 340], [176, 378], [162, 425]],
    [[320, 48], [344, 92], [332, 132]],
  ];
  for (const cr of cracks) {
    ctx.beginPath();
    cr.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  }

  // Wet reflective road puddles (darker color + very low roughness)
  const puddles = [
    [130, 145, 58, 36],
    [388, 290, 62, 40],
    [170, 395, 48, 30],
    [350, 96, 44, 28],
  ];
  for (const [px, py, rx, ry] of puddles) {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, ry / rx);
    const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, rx);
    cg.addColorStop(0, 'rgba(12, 16, 26, 0.52)');
    cg.addColorStop(0.7, 'rgba(15, 20, 32, 0.28)');
    cg.addColorStop(1, 'rgba(15, 20, 32, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    rctx.save();
    rctx.translate(px, py);
    rctx.scale(1, ry / rx);
    const rg = rctx.createRadialGradient(0, 0, 4, 0, 0, rx);
    rg.addColorStop(0, 'rgba(18, 18, 18, 0.96)'); // glossy mirror puddle
    rg.addColorStop(0.72, 'rgba(42, 42, 42, 0.72)');
    rg.addColorStop(1, 'rgba(200, 200, 200, 0)');
    rctx.fillStyle = rg;
    rctx.beginPath();
    rctx.arc(0, 0, rx, 0, Math.PI * 2);
    rctx.fill();
    rctx.restore();
  }

  // Crisp double yellow center line
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(248, 0, 5, 512);
  ctx.fillRect(259, 0, 5, 512);

  // Dashed white lane dividers
  ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(126, y, 6, 36);
    ctx.fillRect(380, y, 6, 36);
  }
  // Crisp outer shoulder lines
  ctx.fillStyle = 'rgba(248, 250, 252, 0.65)';
  ctx.fillRect(18, 0, 6, 512);
  ctx.fillRect(488, 0, 6, 512);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 22);

  const roughnessMap = new THREE.CanvasTexture(rc);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(1, 22);

  return { map, roughnessMap };
}

export function getCBPDDoorTexture() {
  if (cachedCBPDDoorTex) return cachedCBPDDoorTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(118, 12, 276, 168);

  const sg = ctx.createLinearGradient(0, 0, 512, 0);
  sg.addColorStop(0, '#0284c7');
  sg.addColorStop(0.5, '#22d3ee');
  sg.addColorStop(1, '#fbbf24');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 134, 512, 16);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 152, 512, 4);

  // Gold 5-point CBPD star emblem
  ctx.save();
  ctx.translate(168, 76);
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 30 : 13;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('CBPD', 210, 68);
  ctx.fillStyle = '#0284c7';
  ctx.font = '800 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('INTERCEPTOR · 911', 212, 106);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '800 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORALINA BAY', 16, 174);
  ctx.fillText('UNIT-07', 418, 174);

  cachedCBPDDoorTex = new THREE.CanvasTexture(c);
  cachedCBPDDoorTex.colorSpace = THREE.SRGBColorSpace;
  return cachedCBPDDoorTex;
}

export function getHeroTopStripeTexture() {
  if (cachedHeroTopTex) return cachedHeroTopTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 512);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(88, 0, 28, 512);
  ctx.fillRect(140, 0, 28, 512);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(82, 0, 4, 512);
  ctx.fillRect(170, 0, 4, 512);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.88)';
  ctx.fillRect(124, 0, 8, 512);
  cachedHeroTopTex = new THREE.CanvasTexture(c);
  cachedHeroTopTex.colorSpace = THREE.SRGBColorSpace;
  return cachedHeroTopTex;
}

export function getHeroSideSeamTexture() {
  if (cachedHeroSideTex) return cachedHeroSideTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fillRect(28, 84, 456, 22);
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, '#fbbf24');
  g.addColorStop(0.5, '#ffffff');
  g.addColorStop(1, '#22d3ee');
  ctx.fillStyle = g;
  ctx.fillRect(28, 82, 456, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORSAIR V12', 194, 101);
  cachedHeroSideTex = new THREE.CanvasTexture(c);
  cachedHeroSideTex.colorSpace = THREE.SRGBColorSpace;
  return cachedHeroSideTex;
}

// Slatted wooden cargo crate texture for Mangrove Bazaar
export function getCrateSlatsTexture() {
  if (cachedCrateTex) return cachedCrateTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7c5230';
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal wooden planks
  for (let y = 0; y < 256; y += 36) {
    ctx.fillStyle = y % 72 === 0 ? '#8c5d37' : '#744b2b';
    ctx.fillRect(0, y, 256, 33);
    ctx.fillStyle = '#3d2412';
    ctx.fillRect(0, y + 33, 256, 3);
  }
  // Outer wooden frame + diagonal brace
  ctx.strokeStyle = '#5c381c';
  ctx.lineWidth = 22;
  ctx.strokeRect(11, 11, 234, 234);
  ctx.beginPath();
  ctx.moveTo(22, 22);
  ctx.lineTo(234, 234);
  ctx.stroke();

  // Iron corner nails
  ctx.fillStyle = '#1e293b';
  for (const [nx, ny] of [[16, 16], [240, 16], [16, 240], [240, 240]]) {
    ctx.beginPath();
    ctx.arc(nx, ny, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  cachedCrateTex = new THREE.CanvasTexture(c);
  cachedCrateTex.colorSpace = THREE.SRGBColorSpace;
  return cachedCrateTex;
}

// Hazard-striped metal oil drum texture for Mangrove Bazaar
export function getHazardDrumTexture(baseHex = '#1e3a5f') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Ribbed metal ridges
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(0, 74, 256, 8);
  ctx.fillRect(0, 174, 256, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 82, 256, 4);
  ctx.fillRect(0, 182, 256, 4);

  // Diagonal yellow/black hazard band
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 108, 256, 40);
  ctx.clip();
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 108, 256, 40);
  ctx.fillStyle = '#0f172a';
  for (let x = -40; x < 300; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 108);
    ctx.lineTo(x + 16, 108);
    ctx.lineTo(x + 36, 148);
    ctx.lineTo(x + 20, 148);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (!cachedHazardDrumTex) cachedHazardDrumTex = tex;
  return tex;
}
