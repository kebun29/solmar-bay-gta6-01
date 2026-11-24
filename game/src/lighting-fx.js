// Coralina Bay: Sunset Syndicate — Time-of-Day Lighting, Volumetric Sun Halo & Volumetric VFX
import * as THREE from 'three';
import {
  createGlowSprite,
  createSeamlessSkyTexture,
  getFireSpriteTexture,
  getSmokeSpriteTexture,
} from './textures.js';

export class LightingSystem {
  constructor(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.mode = 'sunset';

    this.scene.fog = new THREE.FogExp2(0xe89e78, 0.0032);

    this.ambientLight = new THREE.AmbientLight(0xffe6cc, 0.62);
    this.hemiLight = new THREE.HemisphereLight(0xffe0b5, 0x52647e, 1.52);

    this.sunLight = new THREE.DirectionalLight(0xffb86c, 2.95);
    this.sunLight.position.set(78, 44, -95);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    const d = 115;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;

    this.fillLight = new THREE.DirectionalLight(0x6ad4f2, 0.92);
    this.fillLight.position.set(-70, 34, 65);

    this.scene.add(this.ambientLight, this.hemiLight, this.sunLight, this.fillLight);

    this._buildSkyAndSunHalo();
    this._buildProceduralIBL();
  }

  _buildSkyAndSunHalo() {
    this.sunsetSkyTex = createSeamlessSkyTexture('sunset');
    this.nightSkyTex = createSeamlessSkyTexture('night');
    this.middaySkyTex = createSeamlessSkyTexture('midday');

    this.skyMat = new THREE.MeshBasicMaterial({
      map: this.sunsetSkyTex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 32), this.skyMat);
    this.scene.add(this.skyDome);

    // Volumetric layered sunset sun disc + atmospheric halo + subtle god-ray beams
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(16, 48, -280);

    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(21, 40),
      new THREE.MeshBasicMaterial({ color: 0xfff9db, fog: false, depthWrite: false })
    );
    this.sunGroup.add(sunDisc);

    this.sunInnerHalo = createGlowSprite(0xfff1c2, 130, 0.82);
    this.sunInnerHalo.material.fog = false;
    this.sunOuterHalo = createGlowSprite(0xff8c5a, 270, 0.48);
    this.sunOuterHalo.material.fog = false;
    this.sunWideGlow = createGlowSprite(0xfb7185, 390, 0.24);
    this.sunWideGlow.material.fog = false;
    this.sunGroup.add(this.sunInnerHalo, this.sunOuterHalo, this.sunWideGlow);

    this.godRays = [this.sunWideGlow];

    this.scene.add(this.sunGroup);
  }

  _buildProceduralIBL() {
    if (!this.renderer) return;
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();

      this.sunsetEnvMap = this._makeEnvMap(pmrem, ['#1b3158', '#684b7a', '#ec7d62', '#ffcb80', '#3d4c66', '#161b26'], '#fff7d6', 384, 118);
      this.middayEnvMap = this._makeEnvMap(pmrem, ['#0c63aa', '#3cb6f0', '#a8ebff', '#e0faff', '#2a8fa8', '#153b4a'], '#ffffff', 360, 74);
      this.nightEnvMap = this._makeEnvMap(pmrem, ['#070d1f', '#162344', '#2b2048', '#141a2b', '#080b14', '#050810'], '#22d3ee', 256, 116);

      pmrem.dispose();
      this.scene.environment = this.sunsetEnvMap;
    } catch {
      // Fallback if PMREM unavailable
    }
  }

  _makeEnvMap(pmrem, stops, spotCol, sx, sy) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);

    const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 96);
    sg.addColorStop(0, spotCol);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 96, sy - 96, 192, 192);

    const eq = new THREE.CanvasTexture(c);
    eq.mapping = THREE.EquirectangularReflectionMapping;
    eq.colorSpace = THREE.SRGBColorSpace;
    const tex = pmrem.fromEquirectangular(eq).texture;
    eq.dispose();
    return tex;
  }

  applyMode(mode, refs = {}) {
    this.mode = mode;
    const isNight = mode === 'night';
    const isMidday = mode === 'midday';

    this.skyMat.map = isNight ? this.nightSkyTex : isMidday ? this.middaySkyTex : this.sunsetSkyTex;
    this.skyMat.needsUpdate = true;

    if (this.sunsetEnvMap && this.nightEnvMap && this.middayEnvMap) {
      this.scene.environment = isNight
        ? this.nightEnvMap
        : isMidday
        ? this.middayEnvMap
        : this.sunsetEnvMap;
    }

    if (this.sunGroup) {
      this.sunGroup.visible = !isNight;
      if (isMidday) {
        this.sunGroup.position.set(85, 138, -220);
        this.sunInnerHalo.material.color.setHex(0xffffff);
        this.sunOuterHalo.material.color.setHex(0xbae6fd);
        this.godRays.forEach((r) => { r.visible = false; });
      } else {
        this.sunGroup.position.set(16, 48, -280);
        this.sunInnerHalo.material.color.setHex(0xffe49e);
        this.sunOuterHalo.material.color.setHex(0xff8c5a);
        this.godRays.forEach((r) => { r.visible = true; });
      }
    }
    if (refs.sunPathMesh) refs.sunPathMesh.visible = !isNight;

    if (isNight) {
      this.scene.fog.color.setHex(0x0c1528);
      this.scene.fog.density = 0.0074;
      this.ambientLight.color.setHex(0x6f8bc2);
      this.ambientLight.intensity = 0.6;
      this.hemiLight.color.setHex(0x7ca2de);
      this.hemiLight.groundColor.setHex(0x2c2044);
      this.hemiLight.intensity = 1.22;
      this.sunLight.color.setHex(0xa8cbff);
      this.sunLight.intensity = 1.38;
      this.sunLight.position.set(-55, 65, 45);
      this.fillLight.color.setHex(0xff9b62);
      this.fillLight.intensity = 1.05;
      if (refs.oceanMat) refs.oceanMat.color.setHex(0x092f46);
      if (refs.lanternGlows) refs.lanternGlows.forEach((s) => { s.material.opacity = 0.96; });
      if (refs.streetLights) refs.streetLights.forEach((s) => { s.material.opacity = 0.9; });
      if (refs.marketPoints) refs.marketPoints.forEach((p, i) => { p.intensity = 42 - i * 3; });
    } else if (isMidday) {
      // Bright Tropical Turquoise Midday (Miami / Vice Beachfront)
      this.scene.fog.color.setHex(0x9ee2f7);
      this.scene.fog.density = 0.0019;
      this.ambientLight.color.setHex(0xe8f9ff);
      this.ambientLight.intensity = 0.78;
      this.hemiLight.color.setHex(0xb8ecff);
      this.hemiLight.groundColor.setHex(0xd4c2a3);
      this.hemiLight.intensity = 1.72;
      this.sunLight.color.setHex(0xfffaf0);
      this.sunLight.intensity = 3.1;
      this.sunLight.position.set(62, 118, 42);
      this.fillLight.color.setHex(0x38d9f5);
      this.fillLight.intensity = 1.08;
      if (refs.oceanMat) refs.oceanMat.color.setHex(0x06c4d8);
      if (refs.lanternGlows) refs.lanternGlows.forEach((s) => { s.material.opacity = 0.14; });
      if (refs.streetLights) refs.streetLights.forEach((s) => { s.material.opacity = 0.08; });
      if (refs.marketPoints) refs.marketPoints.forEach((p) => { p.intensity = 1.5; });
    } else {
      // Golden Sunset
      this.scene.fog.color.setHex(0xe89e78);
      this.scene.fog.density = 0.0033;
      this.ambientLight.color.setHex(0xffe6cc);
      this.ambientLight.intensity = 0.62;
      this.hemiLight.color.setHex(0xffe0b5);
      this.hemiLight.groundColor.setHex(0x52647e);
      this.hemiLight.intensity = 1.55;
      this.sunLight.color.setHex(0xffb86c);
      this.sunLight.intensity = 2.95;
      this.sunLight.position.set(78, 44, -95);
      this.fillLight.color.setHex(0x6ad4f2);
      this.fillLight.intensity = 0.92;
      if (refs.oceanMat) refs.oceanMat.color.setHex(0x14a4bd);
      if (refs.lanternGlows) refs.lanternGlows.forEach((s) => { s.material.opacity = 0.45; });
      if (refs.streetLights) refs.streetLights.forEach((s) => { s.material.opacity = 0.25; });
      if (refs.marketPoints) refs.marketPoints.forEach((p) => { p.intensity = 4; });
    }
  }
}

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  spawnSmoke(pos, scale = 1.1, life = 0.85, color = 0xdbe2ea) {
    const mat = new THREE.SpriteMaterial({
      map: getSmokeSpriteTexture(),
      color,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(pos);
    s.scale.set(scale, scale, 1);
    this.scene.add(s);
    this.items.push({
      mesh: s,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.45 + Math.random() * 0.7, (Math.random() - 0.5) * 0.8),
      life,
      maxLife: life,
      grow: 1.8,
    });
  }

  spawnFirePuff(pos, scale = 1.6, life = 0.48) {
    const mat = new THREE.SpriteMaterial({
      map: getFireSpriteTexture(),
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(pos);
    s.scale.set(scale, scale * 1.15, 1);
    this.scene.add(s);
    this.items.push({
      mesh: s,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 2.2 + Math.random() * 1.0, (Math.random() - 0.5) * 0.5),
      life,
      maxLife: life,
      grow: 0.9,
    });
  }

  spawnSparks(pos, count = 8) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.24),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfef08a : 0xf97316 })
      );
      m.position.copy(pos);
      this.scene.add(m);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 10, 2.8 + Math.random() * 5.2, (Math.random() - 0.5) * 10);
      m.lookAt(pos.clone().add(vel));
      this.items.push({ mesh: m, vel, life: 0.42, maxLife: 0.42, gravity: 15 });
    }
  }

  spawnCasings(pos, count = 4, frozen = false) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.22 });
    const geom = new THREE.CylinderGeometry(0.015, 0.015, 0.068, 6);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geom, brassMat);
      if (frozen) {
        m.position.set(
          pos.x + (i - count / 2) * 0.12,
          pos.y + 0.08 + Math.sin(i * 1.7) * 0.14,
          pos.z + (i % 2 === 0 ? 0.08 : -0.1)
        );
        m.rotation.set(i * 0.9, i * 1.1, i * 0.7);
      } else {
        m.position.copy(pos);
      }
      this.scene.add(m);
      this.items.push({
        mesh: m,
        vel: frozen
          ? new THREE.Vector3(0, 0, 0)
          : new THREE.Vector3(1.2 + Math.random() * 1.8, 1.8 + Math.random() * 1.6, (Math.random() - 0.5) * 1.8),
        life: frozen ? 99 : 0.72,
        maxLife: frozen ? 99 : 0.72,
        gravity: frozen ? 0 : 12,
      });
    }
  }

  spawnTracer(from, to, life = 0.14, color = 0xffffff) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    if (len < 0.05) return;

    const geom = new THREE.CylinderGeometry(0.028, 0.028, len, 6);
    geom.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(geom, mat);
    beam.position.copy(from).add(to).multiplyScalar(0.5);
    beam.lookAt(to);
    this.scene.add(beam);
    this.items.push({ mesh: beam, vel: new THREE.Vector3(), life, maxLife: life });
  }

  clear() {
    for (const it of this.items) {
      this.scene.remove(it.mesh);
    }
    this.items.length = 0;
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.life <= 0) {
        this.scene.remove(it.mesh);
        this.items.splice(i, 1);
        continue;
      }
      if (it.gravity) it.vel.y -= it.gravity * dt;
      it.mesh.position.addScaledVector(it.vel, dt);
      if (it.grow) {
        const s = it.mesh.scale.x + it.grow * dt;
        it.mesh.scale.set(s, s, 1);
      }
      if (it.mesh.material && it.mesh.material.transparent) {
        it.mesh.material.opacity = Math.max(0, (it.life / it.maxLife) * 0.85);
      }
    }
  }
}
