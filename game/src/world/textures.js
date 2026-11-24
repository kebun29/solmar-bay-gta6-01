// Coralina Bay: Sunset Syndicate — Procedural PBR Canvas Textures & Volumetric Sprites
import * as THREE from 'three';

const cache = {};
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const toTex = (c, srgb = true, rx = 0, ry = 0) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t; };
const rad = (x, px, py, r0, r1, st) => { const g = x.createRadialGradient(px, py, r0, px, py, r1); st.forEach(([p, c]) => g.addColorStop(p, c)); return g; };
const lin = (x, x1, y1, st) => { const g = x.createLinearGradient(0, 0, x1, y1); st.forEach(([p, c]) => g.addColorStop(p, c)); return g; };

export function getGlowTexture() {
  if (cache.glow) return cache.glow;
  const [c, x] = mk(128, 128);
  x.fillStyle = rad(x, 64, 64, 0, 64, [[0, 'rgba(255,255,255,1)'], [0.24, 'rgba(255,255,255,.86)'], [0.55, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]);
  x.fillRect(0, 0, 128, 128); return (cache.glow = toTex(c, false));
}

export function getFireSpriteTexture() {
  if (cache.fire) return cache.fire;
  const [c, x] = mk(128, 128);
  x.fillStyle = rad(x, 64, 68, 4, 60, [[0, 'rgba(255,253,232,1)'], [0.22, 'rgba(255,210,92,.94)'], [0.5, 'rgba(255,112,32,.72)'], [0.78, 'rgba(205,36,22,.28)'], [1, 'rgba(80,10,8,0)']]);
  x.fillRect(0, 0, 128, 128); return (cache.fire = toTex(c));
}

export function getSmokeSpriteTexture() {
  if (cache.smoke) return cache.smoke;
  const [c, x] = mk(128, 128);
  for (const [px, py, r, a] of [[64, 64, 48, 0.58], [48, 56, 36, 0.42], [80, 58, 34, 0.4], [62, 46, 32, 0.36]]) {
    x.fillStyle = rad(x, px, py, 2, r, [[0, `rgba(255,255,255,${a})`], [0.52, `rgba(230,235,245,${a * 0.55})`], [1, 'rgba(200,210,225,0)']]);
    x.fillRect(0, 0, 128, 128);
  }
  return (cache.smoke = toTex(c, false));
}

export function createGlowSprite(color, scale = 1.8, opacity = 0.9) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(scale, scale, 1); return s;
}

export function getContactShadowTexture() {
  if (cache.sh) return cache.sh;
  const [c, x] = mk(128, 128);
  x.fillStyle = rad(x, 64, 64, 8, 60, [[0, 'rgba(3,6,14,.9)'], [0.56, 'rgba(3,6,14,.48)'], [1, 'rgba(3,6,14,0)']]);
  x.fillRect(0, 0, 128, 128); return (cache.sh = toTex(c, false));
}

export function createContactShadow(w, d, opacity = 0.72) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: getContactShadowTexture(), transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.032; return m;
}

function cloudFbm(th, v) {
  let s = 0, a = 0.52, f = 2;
  for (let o = 0; o < 4; o++) { s += Math.sin(Math.cos(th * f + o * 1.15) * 2.1 + v * f * 3.1 + o * 1.7) * Math.cos(Math.sin(th * f - o * 0.75) * 1.9 - v * f * 2.4 + o * 0.9) * a; a *= 0.5; f *= 2; }
  return s;
}

export function createSeamlessSkyTexture(mode = 'sunset') {
  const [c, x] = mk(1024, 512), isN = mode === 'night', isM = mode === 'midday';
  x.fillStyle = lin(x, 0, 512, isN ? [[0, '#040814'], [0.28, '#0b1630'], [0.5, '#18264a'], [0.68, '#28234b'], [0.84, '#1b1d36'], [1, '#090c17']]
    : isM ? [[0, '#0b5fa5'], [0.24, '#1c8cd6'], [0.46, '#4ec3f7'], [0.66, '#9ce4ff'], [0.8, '#d8f6ff'], [1, '#8dd5e8']]
    : [[0, '#182b52'], [0.22, '#4a467a'], [0.4, '#a4527a'], [0.56, '#ea7460'], [0.7, '#fba862'], [0.84, '#ffe29e'], [1, '#e59a74']]);
  x.fillRect(0, 0, 1024, 512);
  if (isN) {
    for (let i = 0; i < 400; i++) { x.fillStyle = i % 7 === 0 ? 'rgba(180,224,255,.92)' : 'rgba(255,255,255,.85)'; x.beginPath(); x.arc((Math.sin(i * 127.1 + 1.3) * 0.5 + 0.5) * 1024, (Math.cos(i * 311.7 + 2.1) * 0.5 + 0.5) * 235, 0.65 + (i % 3) * 0.45, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = rad(x, 340, 128, 5, 72, [[0, 'rgba(235,245,255,.92)'], [0.25, 'rgba(180,210,255,.4)'], [1, 'rgba(180,210,255,0)']]); x.fillRect(260, 48, 160, 160);
  } else {
    const sx = isM ? 760 : 768, sy = isM ? 148 : 330;
    x.fillStyle = rad(x, sx, sy, 14, isM ? 210 : 270, [[0, 'rgba(255,252,224,.95)'], [0.2, isM ? 'rgba(255,252,225,.65)' : 'rgba(255,214,130,.64)'], [0.48, isM ? 'rgba(200,245,255,.22)' : 'rgba(252,135,92,.28)'], [1, 'rgba(251,113,133,0)']]);
    x.fillRect(0, 0, 1024, 512);
    const img = x.getImageData(0, 0, 1024, 512), d = img.data, y0 = isM ? 95 : 115, y1 = isM ? 340 : 365;
    for (let y = y0; y < y1; y++) {
      const v = y / 512, mask = Math.sin(((y - y0) / (y1 - y0)) * Math.PI);
      for (let px = 0; px < 1024; px++) {
        const den = Math.max(0, (cloudFbm((px / 1024) * Math.PI * 2, v * (isM ? 1.65 : 1.5)) - (isM ? 0.14 : 0.07)) * (isM ? 1.48 : 1.38)) * mask;
        if (den <= 0.01) continue;
        let dx = Math.abs(px - sx); if (dx > 512) dx = 1024 - dx;
        const prox = Math.max(0, 1 - Math.hypot(dx / 245, (y - sy) / 145)), a = Math.min(isM ? 0.64 : 0.48, den * (isM ? 1 : 0.58 + prox * 0.42)), idx = (y * 1024 + px) * 4;
        d[idx] = Math.round(d[idx] * (1 - a) + 255 * a); d[idx + 1] = Math.round(d[idx + 1] * (1 - a) + (isM ? 255 : 166 + prox * 78) * a); d[idx + 2] = Math.round(d[idx + 2] * (1 - a) + (isM ? 255 : 150 + prox * 62) * a);
      }
    }
    x.putImageData(img, 0, 0);
  }
  const tex = toTex(c); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; return tex;
}

export function createOceanShimmerTexture() {
  const [c, x] = mk(512, 512); x.fillStyle = '#0c8ea6'; x.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 6) { x.fillStyle = `rgba(34,211,238,${0.06 + (Math.sin(y * 0.09) * 0.5 + 0.5) * 0.09})`; x.fillRect(0, y, 512, 3); }
  for (let i = 0; i < 420; i++) { x.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,.26)' : 'rgba(103,232,249,.2)'; x.fillRect((i * 73) % 512, (i * 41) % 512, 12 + (i % 24), 2); }
  return toTex(c, true, 9, 14);
}

export function createSunPathTexture() {
  const [c, x] = mk(256, 512), g = x.createLinearGradient(0, 0, 0, 512);
  [[0, 'rgba(255,236,175,.65)'], [0.35, 'rgba(255,198,120,.42)'], [0.75, 'rgba(255,155,108,.18)'], [1, 'rgba(255,140,100,0)']].forEach(([p, col]) => g.addColorStop(p, col));
  x.fillStyle = g; x.fillRect(0, 0, 256, 512);
  x.globalCompositeOperation = 'destination-in';
  const hg = x.createLinearGradient(0, 0, 256, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = hg; x.fillRect(0, 0, 256, 512); x.globalCompositeOperation = 'source-over';
  x.fillStyle = 'rgba(255,248,215,.34)';
  for (let i = 0; i < 65; i++) { const w = 30 + (i % 5) * 18; x.fillRect(128 - w / 2 + Math.sin(i * 1.9) * 24, (i / 65) * 480, w, 3); }
  return toTex(c);
}

export function createStripedAwningTexture(colA, colB = '#fff8f0') {
  const [c, x] = mk(256, 128);
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 === 0 ? colA : colB; x.fillRect(i * 32, 0, 32, 128); }
  x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, 114, 256, 14);
  const t = toTex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

export function createBuildingWindowTexture(baseHex, litHex, isNight, seed = 0) {
  const [c, x] = mk(256, 512); x.fillStyle = baseHex; x.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 600; i++) { x.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)'; x.fillRect((i * 61 + seed * 17) % 256, (i * 97 + seed * 23) % 512, 3, 3); }
  x.fillStyle = 'rgba(255,255,255,.07)'; for (let y = 0; y < 512; y += 32) x.fillRect(0, y, 256, 3);
  const w = (256 - 56) / 6, h = (512 - 102) / 16;
  for (let r = 0; r < 16; r++) for (let col = 0; col < 6; col++) {
    const lit = ((r * 31 + col * 17 + seed * 13) % 100) > (isNight ? 36 : 56), px = 8 + col * (w + 8), py = 6 + r * (h + 6);
    x.fillStyle = lit ? litHex : '#1b273b'; x.fillRect(px, py, w, h);
    if (lit) { x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(px + 2, py + 2, w - 4, h * 0.35); }
    x.strokeStyle = 'rgba(0,0,0,.28)'; x.strokeRect(px, py, w, h);
  }
  return toTex(c, true, 1, 1);
}

export function createSignTexture(text, bg, fg, glow) {
  const [c, x] = mk(512, 128); x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = glow; x.lineWidth = 8; x.strokeRect(8, 8, 496, 112);
  x.shadowColor = glow; x.shadowBlur = 18; x.fillStyle = fg;
  x.font = '900 44px "Segoe UI",Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 66);
  return toTex(c);
}

export function createRoadTextures() {
  const [c, x] = mk(512, 512), [rc, rx] = mk(512, 512);
  x.fillStyle = '#181d27'; x.fillRect(0, 0, 512, 512); rx.fillStyle = '#a6a6a6'; rx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) { x.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.032)' : 'rgba(0,0,0,.08)'; x.fillRect((i * 53) % 512, (i * 97) % 512, 2, 2); }
  x.strokeStyle = 'rgba(6,8,14,.68)'; x.lineWidth = 1.6;
  for (const cr of [[[78, 42], [96, 86], [88, 134], [112, 168]], [[372, 210], [398, 252], [385, 304], [412, 344]], [[148, 340], [176, 378], [162, 425]]]) {
    x.beginPath(); cr.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke();
  }
  for (const [px, py, rw, rh] of [[130, 145, 64, 40], [388, 290, 68, 44], [170, 395, 54, 34], [350, 96, 50, 32]]) {
    for (const [ctx, stops] of [[x, [[0, 'rgba(6,9,16,.68)'], [0.7, 'rgba(10,14,24,.34)'], [1, 'rgba(10,14,24,0)']]], [rx, [[0, 'rgba(10,10,10,.98)'], [0.7, 'rgba(32,32,32,.78)'], [1, 'rgba(166,166,166,0)']]]]) {
      ctx.save(); ctx.translate(px, py); ctx.scale(1, rh / rw); ctx.fillStyle = rad(ctx, 0, 0, 4, rw, stops);
      ctx.beginPath(); ctx.arc(0, 0, rw, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  x.fillStyle = '#fbbf24'; x.fillRect(248, 0, 5, 512); x.fillRect(259, 0, 5, 512);
  x.fillStyle = 'rgba(248,250,252,.92)'; for (let y = 16; y < 512; y += 64) { x.fillRect(126, y, 6, 36); x.fillRect(380, y, 6, 36); }
  x.fillStyle = 'rgba(248,250,252,.72)'; x.fillRect(18, 0, 6, 512); x.fillRect(488, 0, 6, 512);
  return { map: toTex(c, true, 1, 22), roughnessMap: toTex(rc, false, 1, 22) };
}

export function getCBPDDoorTexture() {
  if (cache.cbpd) return cache.cbpd;
  const [c, x] = mk(512, 192);
  x.fillStyle = '#0f172a'; x.fillRect(0, 0, 512, 192); x.fillStyle = '#f8fafc'; x.fillRect(118, 12, 276, 168);
  const sg = x.createLinearGradient(0, 0, 512, 0); sg.addColorStop(0, '#0284c7'); sg.addColorStop(0.5, '#22d3ee'); sg.addColorStop(1, '#fbbf24');
  x.fillStyle = sg; x.fillRect(0, 134, 512, 16); x.fillStyle = '#fbbf24'; x.fillRect(0, 152, 512, 4);
  x.save(); x.translate(168, 76); x.fillStyle = '#f59e0b'; x.strokeStyle = '#0f172a'; x.lineWidth = 3; x.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? 30 : 13, a = (i * Math.PI) / 5 - Math.PI / 2; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath(); x.fill(); x.stroke(); x.restore();
  x.fillStyle = '#0f172a'; x.font = '900 44px "Segoe UI",Arial,sans-serif'; x.textBaseline = 'middle'; x.fillText('CBPD', 210, 68);
  x.fillStyle = '#0284c7'; x.font = '800 18px "Segoe UI",Arial,sans-serif'; x.fillText('INTERCEPTOR · 911', 212, 106);
  x.fillStyle = '#cbd5e1'; x.fillText('CORALINA BAY', 16, 174); x.fillText('UNIT-07', 418, 174);
  return (cache.cbpd = toTex(c));
}

export function getHeroTopStripeTexture() {
  if (cache.htop) return cache.htop;
  const [c, x] = mk(256, 512);
  x.fillStyle = 'rgba(15,23,42,.88)'; x.fillRect(88, 0, 28, 512); x.fillRect(140, 0, 28, 512);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(82, 0, 4, 512); x.fillRect(170, 0, 4, 512);
  x.fillStyle = 'rgba(34,211,238,.88)'; x.fillRect(124, 0, 8, 512);
  return (cache.htop = toTex(c));
}

export function getHeroSideSeamTexture() {
  if (cache.hside) return cache.hside;
  const [c, x] = mk(512, 128);
  x.fillStyle = 'rgba(15,23,42,.82)'; x.fillRect(28, 84, 456, 22);
  const g = x.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, '#fbbf24'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#22d3ee');
  x.fillStyle = g; x.fillRect(28, 82, 456, 4);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '900 18px "Segoe UI",Arial,sans-serif'; x.fillText('CORSAIR V12', 194, 101);
  return (cache.hside = toTex(c));
}

export function getCrateSlatsTexture() {
  if (cache.crate) return cache.crate;
  const [c, x] = mk(256, 256); x.fillStyle = '#7c5230'; x.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 36) { x.fillStyle = y % 72 === 0 ? '#8c5d37' : '#744b2b'; x.fillRect(0, y, 256, 33); x.fillStyle = '#3d2412'; x.fillRect(0, y + 33, 256, 3); }
  x.strokeStyle = '#5c381c'; x.lineWidth = 22; x.strokeRect(11, 11, 234, 234); x.beginPath(); x.moveTo(22, 22); x.lineTo(234, 234); x.stroke();
  x.fillStyle = '#1e293b'; for (const [nx, ny] of [[16, 16], [240, 16], [16, 240], [240, 240]]) { x.beginPath(); x.arc(nx, ny, 5, 0, Math.PI * 2); x.fill(); }
  return (cache.crate = toTex(c));
}

export function getHazardDrumTexture(baseHex = '#1e3a5f') {
  const [c, x] = mk(256, 256); x.fillStyle = baseHex; x.fillRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(0, 74, 256, 8); x.fillRect(0, 174, 256, 8);
  x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 82, 256, 4); x.fillRect(0, 182, 256, 4);
  x.save(); x.beginPath(); x.rect(0, 108, 256, 40); x.clip(); x.fillStyle = '#f59e0b'; x.fillRect(0, 108, 256, 40);
  x.fillStyle = '#0f172a'; for (let px = -40; px < 300; px += 32) { x.beginPath(); x.moveTo(px, 108); x.lineTo(px + 16, 108); x.lineTo(px + 36, 148); x.lineTo(px + 20, 148); x.closePath(); x.fill(); }
  x.restore(); return toTex(c);
}
