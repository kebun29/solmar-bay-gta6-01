// Coralina Bay: Sunset Syndicate — PMREM Sky Reflections, Time-of-Day Lighting & Volumetric VFX
import * as THREE from 'three';
import { createGlowSprite, createSeamlessSkyTexture, getFireSpriteTexture, getSmokeSpriteTexture } from './textures.js';

const MODES = {
  night: { fog: 0x0c1528, fd: 0.0074, amb: [0x6f8bc2, 0.58], hemi: [0x7ca2de, 0x2c2044, 1.2], sun: [0xa8cbff, 1.38, -55, 65, 45], fill: [0xff9b62, 1.08], oc: 0x092f46, lan: 0.96, st: 0.9, mp: 44 },
  midday: { fog: 0x9ee2f7, fd: 0.0019, amb: [0xe8f9ff, 0.76], hemi: [0xb8ecff, 0xd4c2a3, 1.72], sun: [0xfffaf0, 3.15, 62, 118, 42], fill: [0x38d9f5, 1.1], oc: 0x06c4d8, lan: 0.14, st: 0.08, mp: 1.5 },
  sunset: { fog: 0xe89e78, fd: 0.0033, amb: [0xffe6cc, 0.58], hemi: [0xffe0b5, 0x52647e, 1.52], sun: [0xffb86c, 3.05, 78, 44, -95], fill: [0x6ad4f2, 0.95], oc: 0x14a4bd, lan: 0.45, st: 0.25, mp: 4 },
};

export class LightingSystem {
  constructor(scene, renderer = null) {
    this.scene = scene; this.renderer = renderer; this.mode = 'sunset';
    scene.fog = new THREE.FogExp2(0xe89e78, 0.0032);
    this.ambientLight = new THREE.AmbientLight(0xffe6cc, 0.58);
    this.hemiLight = new THREE.HemisphereLight(0xffe0b5, 0x52647e, 1.48);
    this.sunLight = new THREE.DirectionalLight(0xffb86c, 3.05);
    this.sunLight.position.set(78, 44, -95); this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048); this.sunLight.shadow.bias = -0.0005;
    Object.assign(this.sunLight.shadow.camera, { near: 10, far: 280, left: -115, right: 115, top: 115, bottom: -115 });
    this.fillLight = new THREE.DirectionalLight(0x6ad4f2, 0.95); this.fillLight.position.set(-70, 34, 65);
    scene.add(this.ambientLight, this.hemiLight, this.sunLight, this.fillLight);
    this._buildSkyAndSunHalo(); this._buildProceduralIBL();
  }

  _buildSkyAndSunHalo() {
    this.skyTex = { sunset: createSeamlessSkyTexture('sunset'), night: createSeamlessSkyTexture('night'), midday: createSeamlessSkyTexture('midday') };
    this.skyMat = new THREE.MeshBasicMaterial({ map: this.skyTex.sunset, side: THREE.BackSide, fog: false, depthWrite: false });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 48, 32), this.skyMat));
    this.sunGroup = new THREE.Group(); this.sunGroup.position.set(16, 48, -280);
    this.sunGroup.add(new THREE.Mesh(new THREE.CircleGeometry(21, 40), new THREE.MeshBasicMaterial({ color: 0xfff9db, fog: false, depthWrite: false })));
    this.sunInnerHalo = createGlowSprite(0xfff1c2, 130, 0.84);
    this.sunOuterHalo = createGlowSprite(0xff8c5a, 270, 0.5);
    this.sunWideGlow = createGlowSprite(0xfb7185, 390, 0.25);
    [this.sunInnerHalo, this.sunOuterHalo, this.sunWideGlow].forEach((s) => { s.material.fog = false; this.sunGroup.add(s); });
    this.scene.add(this.sunGroup);
  }

  _buildProceduralIBL() {
    if (!this.renderer) return;
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer); pmrem.compileEquirectangularShader();
      this.envMaps = {
        sunset: this._makeEnvMap(pmrem, ['#182d5a', '#6b4782', '#f2785c', '#ffd485', '#2a354a', '#0f141e'], [[384, 112, 105, '#fff8dc'], [140, 124, 85, '#fb7185']]),
        midday: this._makeEnvMap(pmrem, ['#0759a8', '#38bdf8', '#bae6fd', '#f0fdff', '#0e7490', '#0c2b3a'], [[360, 64, 100, '#ffffff'], [180, 118, 85, '#67e8f9']]),
        night: this._makeEnvMap(pmrem, ['#050918', '#142042', '#311d52', '#171c30', '#070a14', '#04060c'], [[160, 122, 92, '#22d3ee'], [355, 124, 92, '#fb7185']]),
      };
      pmrem.dispose(); this.scene.environment = this.envMaps.sunset;
    } catch {}
  }

  _makeEnvMap(pmrem, stops, spots) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(0, 120, 512, 12);
    for (const [x, y, r, col] of spots) {
      const sg = ctx.createRadialGradient(x, y, 4, x, y, r); sg.addColorStop(0, col); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const eq = new THREE.CanvasTexture(c); eq.mapping = THREE.EquirectangularReflectionMapping; eq.colorSpace = THREE.SRGBColorSpace;
    const tex = pmrem.fromEquirectangular(eq).texture; eq.dispose(); return tex;
  }

  applyMode(mode, refs = {}) {
    this.mode = mode; const cfg = MODES[mode] || MODES.sunset, isNight = mode === 'night', isMid = mode === 'midday';
    this.skyMat.map = this.skyTex[mode] || this.skyTex.sunset; this.skyMat.needsUpdate = true;
    if (this.envMaps) this.scene.environment = this.envMaps[mode] || this.envMaps.sunset;
    if (this.sunGroup) {
      this.sunGroup.visible = !isNight; this.sunGroup.position.set(isMid ? 85 : 16, isMid ? 138 : 48, isMid ? -220 : -280);
      this.sunInnerHalo.material.color.setHex(isMid ? 0xffffff : 0xffe49e);
      this.sunOuterHalo.material.color.setHex(isMid ? 0xbae6fd : 0xff8c5a);
      this.sunWideGlow.visible = !isMid;
    }
    if (refs.sunPathMesh) refs.sunPathMesh.visible = !isNight;
    this.scene.fog.color.setHex(cfg.fog); this.scene.fog.density = cfg.fd;
    this.ambientLight.color.setHex(cfg.amb[0]); this.ambientLight.intensity = cfg.amb[1];
    this.hemiLight.color.setHex(cfg.hemi[0]); this.hemiLight.groundColor.setHex(cfg.hemi[1]); this.hemiLight.intensity = cfg.hemi[2];
    this.sunLight.color.setHex(cfg.sun[0]); this.sunLight.intensity = cfg.sun[1]; this.sunLight.position.set(cfg.sun[2], cfg.sun[3], cfg.sun[4]);
    this.fillLight.color.setHex(cfg.fill[0]); this.fillLight.intensity = cfg.fill[1];
    if (refs.oceanMat) refs.oceanMat.color.setHex(cfg.oc);
    refs.lanternGlows?.forEach((s) => { s.material.opacity = cfg.lan; });
    refs.streetLights?.forEach((s) => { s.material.opacity = cfg.st; });
    refs.marketPoints?.forEach((p, i) => { p.intensity = isNight ? cfg.mp - i * 3 : cfg.mp; });
  }
}

export class VFXManager {
  constructor(scene) { this.scene = scene; this.items = []; }
  _sp(tex, pos, sc, sy, col, op, add, vel, life, grow = 0) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: op, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }));
    s.position.copy(pos); s.scale.set(sc, sy, 1); this.scene.add(s); this.items.push({ mesh: s, vel, life, maxLife: life, grow });
  }
  spawnSmoke(p, sc = 1.1, l = 0.85, col = 0xdbe2ea) { this._sp(getSmokeSpriteTexture(), p, sc, sc, col, 0.56, 0, new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.45 + Math.random() * 0.7, (Math.random() - 0.5) * 0.8), l, 1.8); }
  spawnFirePuff(p, sc = 1.6, l = 0.48) { this._sp(getFireSpriteTexture(), p, sc, sc * 1.15, 0xffffff, 0.92, 1, new THREE.Vector3((Math.random() - 0.5) * 0.5, 2.2 + Math.random(), (Math.random() - 0.5) * 0.5), l, 0.9); }
  spawnSparks(p, n = 8) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.24), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf97316 : 0xfef08a })), v = new THREE.Vector3((Math.random() - 0.5) * 10, 2.8 + Math.random() * 5.2, (Math.random() - 0.5) * 10);
      m.position.copy(p); m.lookAt(p.clone().add(v)); this.scene.add(m); this.items.push({ mesh: m, vel: v, life: 0.42, maxLife: 0.42, gravity: 15 });
    }
  }
  spawnCasings(p, n = 4, fr = false) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.22 }), g = new THREE.CylinderGeometry(0.015, 0.015, 0.068, 6);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(g, mat);
      if (fr) { m.position.set(p.x + (i - n / 2) * 0.12, p.y + 0.08 + Math.sin(i * 1.7) * 0.14, p.z + (i % 2 ? -0.1 : 0.08)); m.rotation.set(i * 0.9, i * 1.1, i * 0.7); } else m.position.copy(p);
      this.scene.add(m); this.items.push({ mesh: m, vel: fr ? new THREE.Vector3() : new THREE.Vector3(1.2 + Math.random() * 1.8, 1.8 + Math.random() * 1.6, (Math.random() - 0.5) * 1.8), life: fr ? 99 : 0.72, maxLife: fr ? 99 : 0.72, gravity: fr ? 0 : 12 });
    }
  }
  spawnTracer(a, b, l = 0.14, col = 0xffffff) {
    const len = a.distanceTo(b); if (len < 0.05) return;
    const g = new THREE.CylinderGeometry(0.028, 0.028, len, 6); g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); this.scene.add(m); this.items.push({ mesh: m, vel: new THREE.Vector3(), life: l, maxLife: l });
  }
  clear() { this.items.forEach((it) => this.scene.remove(it.mesh)); this.items.length = 0; }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; if ((it.life -= dt) <= 0) { this.scene.remove(it.mesh); this.items.splice(i, 1); continue; }
      if (it.gravity) it.vel.y -= it.gravity * dt; it.mesh.position.addScaledVector(it.vel, dt);
      if (it.grow) { const s = it.mesh.scale.x + it.grow * dt; it.mesh.scale.set(s, s, 1); }
      if (it.mesh.material?.transparent) it.mesh.material.opacity = Math.max(0, (it.life / it.maxLife) * 0.85);
    }
  }
}
