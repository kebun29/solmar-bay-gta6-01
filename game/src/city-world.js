// Coralina Bay: Sunset Syndicate — Open-World City, Bay Bridge, Art-Deco Strip & Mangrove Bazaar
import * as THREE from 'three';
import { INTERACTIVE_LOCATIONS } from './config.js';
import { LightingSystem } from './lighting-fx.js';
import { createCharacter } from './pedestrians.js';
import {
  createBuildingWindowTexture,
  createGlowSprite,
  createOceanShimmerTexture,
  createRoadTextures,
  createSignTexture,
  createStripedAwningTexture,
  createSunPathTexture,
  getCrateSlatsTexture,
  getGlowTexture,
  getHazardDrumTexture,
} from './textures.js';
import { createYacht } from './vehicles.js';

export class CityWorld {
  constructor(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.mode = 'sunset';
    this.isNight = false;

    this.colliders = [];
    this.palms = [];
    this.lanternGlows = [];
    this.streetLights = [];
    this.marketPoints = [];
    this.yachts = [];
    this.sidewalkPeds = [];
    this.interactiveMarkers = [];
    this.missionBeacon = null;

    this.lighting = new LightingSystem(scene, renderer);

    this._buildTerrainAndCoast();
    this._buildBaySuspensionBridge();
    this._buildRoads();
    this._buildArtDecoStrip();
    this._buildSkyline();
    this._buildNightMarket();
    this._buildBeachAndPalms();
    this._buildStreetlights();
    this._buildTrafficSignalsAndCrosswalks();
    this._buildYachtsAndPeds();
    this._buildMissionBeacon();
    this._buildInteractiveLocations();

    this.setMode('sunset');
  }

  setMode(mode) {
    this.mode = mode;
    this.isNight = mode === 'night';
    this.lighting.applyMode(mode, {
      sunPathMesh: this.sunPathMesh,
      oceanMat: this.oceanMat,
      lanternGlows: this.lanternGlows,
      streetLights: this.streetLights,
      marketPoints: this.marketPoints,
    });
  }

  _buildTerrainAndCoast() {
    const cityGround = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 520),
      new THREE.MeshStandardMaterial({ color: 0x384354, roughness: 0.92, metalness: 0.05 })
    );
    cityGround.rotation.x = -Math.PI / 2;
    cityGround.position.set(-150, -0.06, 0);
    cityGround.receiveShadow = true;
    this.scene.add(cityGround);

    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 520),
      new THREE.MeshStandardMaterial({ color: 0xe6c899, roughness: 0.94, metalness: 0.02 })
    );
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(35, -0.02, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    const shoreFoam = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 520),
      new THREE.MeshBasicMaterial({ color: 0xdffbff, transparent: true, opacity: 0.42 })
    );
    shoreFoam.rotation.x = -Math.PI / 2;
    shoreFoam.position.set(57.5, -0.04, 0);
    this.scene.add(shoreFoam);

    this.oceanTex = createOceanShimmerTexture();
    this.oceanMat = new THREE.MeshStandardMaterial({
      map: this.oceanTex,
      color: 0x14a4bd,
      roughness: 0.16,
      metalness: 0.56,
      envMapIntensity: 1.45,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(540, 720), this.oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(324, -0.18, -40);
    this.scene.add(ocean);

    this.sunPathMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(76, 260),
      new THREE.MeshBasicMaterial({
        map: createSunPathTexture(),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.sunPathMesh.rotation.x = -Math.PI / 2;
    this.sunPathMesh.position.set(92, -0.12, -110);
    this.scene.add(this.sunPathMesh);

    // Isla Dorada Resort Island across the Bay Bridge
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(72, 84, 3.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xd9be90, roughness: 0.9 })
    );
    island.position.set(148, 0.8, -172);
    this.scene.add(island);
  }

  _buildBaySuspensionBridge() {
    const g = new THREE.Group();
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd9483b, roughness: 0.42, metalness: 0.32 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.72 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xf4d29c, roughness: 0.35, metalness: 0.62 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(240, 1.8, 16), deckMat);
    deck.position.set(42, 16.5, -138);
    deck.castShadow = true;
    deck.receiveShadow = true;
    g.add(deck);

    // Two iconic Coralina Bay suspension towers
    for (const tx of [-12, 72]) {
      for (const tz of [-144.5, -131.5]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(3.2, 48, 3.2), towerMat);
        leg.position.set(tx, 24, tz);
        leg.castShadow = true;
        g.add(leg);
      }
      for (const by of [28, 42]) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 15.6), towerMat);
        brace.position.set(tx, by, -138);
        g.add(brace);
      }
      const beacon = createGlowSprite(0xff5a5f, 4.2, 0.88);
      beacon.position.set(tx, 49.5, -138);
      g.add(beacon);
    }

    // Parabolic main suspension cables + vertical suspender rods
    for (const cz of [-144.5, -131.5]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = -12 + t * 84;
        const sag = 4 * t * (1 - t);
        const y = 46 - sag * 24;
        pts.push(new THREE.Vector3(x, y, cz));
        if (i > 1 && i < 23 && i % 2 === 0) {
          const h = y - 17.2;
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, h, 6), cableMat);
          rod.position.set(x, 17.2 + h / 2, cz);
          g.add(rod);
        }
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.36, 8, false), cableMat));

      // Side span cables
      const leftCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-64, 17.5, cz),
        new THREE.Vector3(-38, 28, cz),
        new THREE.Vector3(-12, 46, cz),
      ]);
      const rightCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(72, 46, cz),
        new THREE.Vector3(106, 28, cz),
        new THREE.Vector3(138, 17.5, cz),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 16, 0.34, 8, false), cableMat));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 16, 0.34, 8, false), cableMat));
    }

    this.scene.add(g);
  }

  _buildRoads() {
    const { map: roadMap, roughnessMap: roadRough } = createRoadTextures();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadMap,
      roughnessMap: roadRough,
      roughness: 0.78,
      metalness: 0.24,
      envMapIntensity: 1.35,
    });

    // Main Marina Boulevard (North-South 4-lane highway)
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(22, 480), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.01, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // Sidewalks & raised curbs
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b2, roughness: 0.88 });
    for (const sx of [-14.2, 14.2]) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 480), walkMat);
      sw.position.set(sx, 0.06, 0);
      sw.receiveShadow = true;
      this.scene.add(sw);
    }

    // Cross avenues (to Mangrove Bazaar & Azura Downtown)
    for (const cz of [60, -60]) {
      const cross = new THREE.Mesh(new THREE.PlaneGeometry(16, 150), roadMat);
      cross.rotation.x = -Math.PI / 2;
      cross.rotation.z = Math.PI / 2;
      cross.position.set(-76, 0.012, cz);
      cross.receiveShadow = true;
      this.scene.add(cross);
    }
  }

  // Upgraded Art-Deco Pastel Beachfront Strip with balconies, awnings, rooftop AC & neon signs
  _buildArtDecoStrip() {
    const specs = [
      { z: -98, h: 14, w: 18, d: 18, col: '#f5d0c5', sign: 'HOTEL CORALINA', neon: '#fb7185', awn: '#e11d48' },
      { z: -74, h: 11, w: 17, d: 16, col: '#bae6fd', sign: 'AZURA CLUB', neon: '#22d3ee', awn: '#0284c7' },
      { z: -48, h: 15, w: 18, d: 18, col: '#fde68a', sign: 'SUNSET LOUNGE', neon: '#f97316', awn: '#ea580c' },
      { z: -24, h: 12, w: 17, d: 16, col: '#c7d2fe', sign: 'PALM CASINO', neon: '#c084fc', awn: '#7c3aed' },
      { z: 10, h: 11, w: 18, d: 20, col: '#a7f3d0', sign: 'MARINA GARAGE', neon: '#22d3ee', awn: '#0d9488', isGarage: true },
      { z: 36, h: 14, w: 17, d: 16, col: '#fbcfe8', sign: 'TROPICA BAR', neon: '#f43f5e', awn: '#be123c' },
      { z: 86, h: 13, w: 18, d: 18, col: '#fed7aa', sign: 'HARBOR MOTEL', neon: '#fbbf24', awn: '#d97706' },
      { z: 114, h: 12, w: 17, d: 18, col: '#bfdbfe', sign: 'BAYSIDE SUITES', neon: '#38bdf8', awn: '#0369a1' },
    ];

    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.3 });
    const acMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.4 });
    const bayDoorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.65 });

    specs.forEach((b, idx) => {
      const bx = -26.5;
      const winTex = createBuildingWindowTexture(b.col, '#ffdf9e', false, idx + 1);
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.76, metalness: 0.06 })
      );
      bldg.position.set(bx, b.h / 2, b.z);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      this.scene.add(bldg);
      this.colliders.push({ x: bx, z: b.z, hw: b.w / 2 + 0.6, hd: b.d / 2 + 0.6 });

      // Art-Deco stepped parapet crown + glowing neon trim bar
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, 1.1, b.d + 0.6), trimMat);
      parapet.position.set(bx, b.h + 0.55, b.z);
      this.scene.add(parapet);

      const neonBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, b.d - 1.2),
        new THREE.MeshBasicMaterial({ color: b.neon })
      );
      neonBar.position.set(bx + b.w / 2 + 0.25, b.h + 0.4, b.z);
      this.scene.add(neonBar);

      // Rooftop AC units & vents
      for (let ac = 0; ac < 2; ac++) {
        const unit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.8), acMat);
        unit.position.set(bx - 2 + ac * 4.5, b.h + 1.55, b.z - 3 + ac * 5.2);
        this.scene.add(unit);
      }

      // Facade balconies on upper floor
      for (let fl = 0; fl < 2; fl++) {
        const fy = 5.4 + fl * 3.8;
        if (fy > b.h - 1.6) break;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, b.d * 0.72), trimMat);
        slab.position.set(bx + b.w / 2 + 0.75, fy, b.z);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, b.d * 0.72), railMat);
        rail.position.set(bx + b.w / 2 + 1.44, fy + 0.48, b.z);
        this.scene.add(slab, rail);
      }

      // Striped storefront awning facing Marina Boulevard
      const awnTex = createStripedAwningTexture(b.awn);
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.16, b.d * 0.84),
        new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.72 })
      );
      awning.position.set(bx + b.w / 2 + 1.45, 3.65, b.z);
      awning.rotation.z = -0.26;
      awning.castShadow = true;
      this.scene.add(awning);

      // Glowing storefront neon sign
      const signTex = createSignTexture(b.sign, '#0f172a', '#ffffff', b.neon);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.85, 8.8),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      sign.position.set(bx + b.w / 2 + 0.42, b.isGarage ? 5.1 : b.h - 1.5, b.z);
      this.scene.add(sign);

      // Open illuminated Marina Garage service bay doors
      if (b.isGarage) {
        const bay = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.0, 9.2), bayDoorMat);
        bay.position.set(bx + b.w / 2 + 0.12, 2.0, b.z);
        this.scene.add(bay);
        const bayGlow = createGlowSprite(0x22d3ee, 6.5, 0.52);
        bayGlow.position.set(bx + b.w / 2 + 1.1, 2.6, b.z);
        this.scene.add(bayGlow);
      }
    });
  }

  _buildSkyline() {
    const towers = [
      { x: -64, z: -118, w: 24, h: 68, d: 24, col: '#2b3a55', lit: '#fde68a', sign: 'CORALINA PLAZA' },
      { x: -94, z: -88, w: 26, h: 86, d: 26, col: '#22314d', lit: '#bae6fd', sign: 'AZURA TOWER' },
      { x: -62, z: -48, w: 22, h: 52, d: 22, col: '#34415c', lit: '#fed7aa', sign: 'BAY FINANCIAL' },
      { x: -96, z: -26, w: 24, h: 64, d: 24, col: '#283652', lit: '#fbcfe8' },
      { x: -68, z: 12, w: 22, h: 44, d: 22, col: '#313f59', lit: '#fde68a' },
      { x: -98, z: 36, w: 24, h: 56, d: 24, col: '#24324c', lit: '#a5f3fc' },
      { x: -92, z: 92, w: 26, h: 48, d: 24, col: '#2f3d57', lit: '#fde68a' },
    ];
    towers.forEach((t, idx) => {
      const tex = createBuildingWindowTexture(t.col, t.lit, true, idx + 20);
      tex.repeat.set(2, Math.max(2, Math.round(t.h / 18)));
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(t.w, t.h, t.d),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.28 })
      );
      mesh.position.set(t.x, t.h / 2, t.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.colliders.push({ x: t.x, z: t.z, hw: t.w / 2 + 0.8, hd: t.d / 2 + 0.8 });

      // Spire antenna
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.35, 11, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      spire.position.set(t.x, t.h + 5.5, t.z);
      this.scene.add(spire);

      if (t.sign) {
        const sTex = createSignTexture(t.sign, '#111827', '#fde68a', '#fb7185');
        const sMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 3.2, 16),
          new THREE.MeshBasicMaterial({ map: sTex })
        );
        sMesh.position.set(t.x + t.w / 2 + 0.3, t.h - 4, t.z);
        this.scene.add(sMesh);
      }
    });
  }

  // Upgraded Mangrove Bazaar Night Market: slatted crates, hazard-striped iron drums, corrugated stalls, bottles, lanterns & benches
  _buildNightMarket() {
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
    const tileTex = new THREE.CanvasTexture(tc);
    tileTex.colorSpace = THREE.SRGBColorSpace;
    tileTex.wrapS = THREE.RepeatWrapping;
    tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(8, 10);

    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 58),
      new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.11,
        metalness: 0.56,
        envMapIntensity: 1.75,
      })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(-44, 0.02, 60);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Wet neon-reflecting puddles
    const puddles = [
      { x: -39, z: 55, w: 4.8, d: 3.4, col: 0xff8c52 },
      { x: -46, z: 58, w: 5.4, d: 3.8, col: 0x22d3ee },
      { x: -42, z: 64, w: 4.5, d: 3.2, col: 0xfb7185 },
      { x: -51, z: 55, w: 4.2, d: 3.0, col: 0xfbbf24 },
      { x: -35, z: 61, w: 4.0, d: 2.8, col: 0x38bdf8 },
    ];
    for (const pd of puddles) {
      const waterBase = new THREE.Mesh(
        new THREE.CircleGeometry(1, 22),
        new THREE.MeshStandardMaterial({
          color: 0x0a1322,
          roughness: 0.03,
          metalness: 0.94,
          envMapIntensity: 2.1,
          transparent: true,
          opacity: 0.64,
        })
      );
      waterBase.rotation.x = -Math.PI / 2;
      waterBase.scale.set(pd.w, pd.d, 1);
      waterBase.position.set(pd.x, 0.028, pd.z);
      this.scene.add(waterBase);

      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(pd.w * 1.15, pd.d * 0.42),
        new THREE.MeshBasicMaterial({
          map: getGlowTexture(),
          color: pd.col,
          transparent: true,
          opacity: 0.24,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(pd.x, 0.033, pd.z);
      this.scene.add(streak);
    }

    // Entrance Neon Arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0x23192b, roughness: 0.55 });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.4, 0.85), archMat);
    leftPost.position.set(-23, 3.7, 53);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.4, 0.85), archMat);
    rightPost.position.set(-23, 3.7, 67);
    const archSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 2.2, 14.8),
      new THREE.MeshBasicMaterial({ map: createSignTexture('MANGROVE BAZAAR', '#180e24', '#ffe8c2', '#fb7185') })
    );
    archSign.position.set(-23, 6.9, 60);
    this.scene.add(leftPost, rightPost, archSign);

    // Corrugated Market Stalls with bottles, hanging lanterns & glowing neon signs
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
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.68, roughness: 0.36 });
    const bottleColors = [0x34d399, 0xfbbf24, 0x38bdf8, 0xfb7185];

    stallSpecs.forEach((sp) => {
      const g = new THREE.Group();
      g.position.set(sp.x, 0, sp.z);
      g.rotation.y = sp.ry;

      // Corrugated counter front + wooden counter top
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.12, 2.2), woodMat);
      counter.position.set(0, 0.56, 0);
      counter.castShadow = true;
      g.add(counter);

      for (let rib = -3.0; rib <= 3.0; rib += 0.45) {
        const corrug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 6), metalMat);
        corrug.position.set(rib, 0.56, 1.12);
        g.add(corrug);
      }

      // Metal canopy posts
      for (const px of [-3.2, 3.2]) {
        for (const pz of [-1.0, 1.0]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), metalMat);
          post.position.set(px, 1.8, pz);
          g.add(post);
        }
      }

      // Striped corrugated canopy roof
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 0.18, 3.2),
        new THREE.MeshStandardMaterial({ map: createStripedAwningTexture(sp.col), roughness: 0.72 })
      );
      canopy.position.set(0, 3.55, 0.15);
      canopy.rotation.x = 0.18;
      g.add(canopy);

      // Neon stall sign
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 1.15, 0.22),
        new THREE.MeshBasicMaterial({ map: createSignTexture(sp.sign, '#0f172a', '#ffffff', sp.neon) })
      );
      sign.position.set(0, 4.35, 0.9);
      g.add(sign);

      // Glass bottles & condiment jars arranged on counter
      for (let b = 0; b < 5; b++) {
        const bMat = new THREE.MeshStandardMaterial({
          color: bottleColors[b % bottleColors.length],
          roughness: 0.12,
          metalness: 0.2,
          transparent: true,
          opacity: 0.85,
        });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.34, 8), bMat);
        bottle.position.set(-2.2 + b * 1.1, 1.29, 0.45);
        g.add(bottle);
      }

      // Hanging glowing lanterns under canopy eaves
      for (const lx of [-2.1, 0, 2.1]) {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), metalMat);
        cord.position.set(lx, 3.22, 1.32);
        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 10, 8),
          new THREE.MeshBasicMaterial({ color: sp.neon })
        );
        lantern.position.set(lx, 2.92, 1.32);
        const glow = createGlowSprite(sp.neon, 1.65, 0.85);
        glow.position.set(lx, 2.92, 1.32);
        this.lanternGlows.push(glow);
        g.add(cord, lantern, glow);
      }

      this.scene.add(g);
    });

    // Overhead festive string lights crisscrossing Mangrove Bazaar
    const cableColors = [0xfb7185, 0x22d3ee, 0xfbbf24, 0xc084fc];
    const stringRuns = [
      [new THREE.Vector3(-24, 6.2, 46), new THREE.Vector3(-60, 6.0, 72)],
      [new THREE.Vector3(-24, 6.4, 74), new THREE.Vector3(-60, 6.2, 48)],
      [new THREE.Vector3(-32, 6.1, 44), new THREE.Vector3(-56, 6.1, 76)],
    ];
    stringRuns.forEach(([a, b], idx) => {
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= 0.9;
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 16, 0.035, 6, false),
        new THREE.MeshBasicMaterial({ color: cableColors[idx % cableColors.length] })
      );
      this.scene.add(wire);
      for (let i = 1; i < 8; i++) {
        const pt = curve.getPoint(i / 8);
        const col = cableColors[(i + idx) % cableColors.length];
        const glow = createGlowSprite(col, 1.8, 0.92);
        glow.position.copy(pt);
        this.lanternGlows.push(glow);
        this.scene.add(glow);
      }
    });

    // Upgraded Hard-Cover Props: Slatted Wooden Crates, Hazard-Striped Iron Drums & Folding Tables/Benches
    const crateMat = new THREE.MeshStandardMaterial({ map: getCrateSlatsTexture(), roughness: 0.82 });
    const drumRedMat = new THREE.MeshStandardMaterial({ map: getHazardDrumTexture('#991b1b'), roughness: 0.42, metalness: 0.62 });
    const drumTealMat = new THREE.MeshStandardMaterial({ map: getHazardDrumTexture('#0f4c5c'), roughness: 0.42, metalness: 0.62 });

    const coverGroups = [
      { x: -37.2, z: 54.5, ry: 0.14 },
      { x: -45.5, z: 51.8, ry: -0.22 },
      { x: -53.2, z: 61.5, ry: 0.32 },
      { x: -41.0, z: 66.8, ry: -0.15 },
    ];
    coverGroups.forEach((cg, idx) => {
      const g = new THREE.Group();
      g.position.set(cg.x, 0, cg.z);
      g.rotation.y = cg.ry;

      // Slatted wooden cargo crate (base + stacked angled crate)
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.15, 1.35), crateMat);
      crate1.position.set(0, 0.58, 0);
      crate1.castShadow = true;
      crate1.receiveShadow = true;
      g.add(crate1);

      if (idx % 2 === 0) {
        const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 0.95), crateMat);
        crate2.position.set(-0.22, 1.54, -0.08);
        crate2.rotation.y = 0.28;
        crate2.castShadow = true;
        g.add(crate2);
      }

      // Hazard-striped ribbed steel oil drum beside crate
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 1.16, 16),
        idx % 2 === 0 ? drumTealMat : drumRedMat
      );
      drum.position.set(1.24, 0.58, 0.15);
      drum.castShadow = true;
      g.add(drum);

      // Folding wooden street table + bench nearby
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.82), woodMat);
      tableTop.position.set(-1.75, 0.78, 0.4);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.72), metalMat);
      legL.position.set(-2.5, 0.39, 0.4);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.72), metalMat);
      legR.position.set(-1.0, 0.39, 0.4);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 0.36), woodMat);
      bench.position.set(-1.75, 0.44, 1.05);
      g.add(tableTop, legL, legR, bench);

      this.scene.add(g);
    });

    // Night-market neon point lights
    const mpSpecs = [
      [-34, 5.5, 56, 0xfb7185],
      [-48, 5.5, 54, 0x22d3ee],
      [-44, 5.5, 66, 0xfbbf24],
      [-56, 5.5, 60, 0xc084fc],
    ];
    for (const [x, y, z, col] of mpSpecs) {
      const pt = new THREE.PointLight(col, 4, 28, 1.5);
      pt.position.set(x, y, z);
      this.scene.add(pt);
      this.marketPoints.push(pt);
    }
  }

  _buildBeachAndPalms() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5638, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x228b44, roughness: 0.7, side: THREE.DoubleSide });

    for (let z = -125; z <= 135; z += 18) {
      for (const px of [18.5, 29.5]) {
        const g = new THREE.Group();
        g.position.set(px + Math.sin(z * 0.2) * 1.4, 0, z);

        const h = 7.2 + (Math.abs(z) % 3) * 1.1;
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.4, h * 0.45, 0.2),
          new THREE.Vector3(0.95, h, 0.35),
        ]);
        const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 10, 0.24, 7, false), trunkMat);
        trunk.castShadow = true;
        g.add(trunk);

        const crown = new THREE.Group();
        crown.position.set(0.95, h, 0.35);
        for (let f = 0; f < 7; f++) {
          const ang = (f / 7) * Math.PI * 2;
          const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 3.4, 1, 4), frondMat);
          const posAttr = frond.geometry.attributes.position;
          for (let v = 0; v < posAttr.count; v++) {
            const ly = posAttr.getY(v);
            const t = (ly + 1.7) / 3.4;
            posAttr.setZ(v, -t * t * 1.15);
          }
          frond.geometry.computeVertexNormals();
          frond.rotation.x = Math.PI / 2 - 0.18;
          frond.rotation.z = ang;
          frond.position.set(Math.sin(ang) * 1.45, -0.1, Math.cos(ang) * 1.45);
          crown.add(frond);
        }
        g.add(crown);
        this.scene.add(g);
        this.palms.push({ crown, phase: z * 0.15 });
      }
    }

    // Colorful beach umbrellas & lifeguard huts
    const umbColors = ['#fb7185', '#22d3ee', '#fbbf24', '#34d399', '#a855f7'];
    for (let z = -90; z <= 95; z += 16) {
      const col = umbColors[Math.abs(z) % umbColors.length];
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
      );
      pole.position.set(36 + (z % 2) * 5, 1.15, z);
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 0.72, 10),
        new THREE.MeshStandardMaterial({ map: createStripedAwningTexture(col), roughness: 0.7 })
      );
      top.position.set(pole.position.x, 2.28, z);
      top.castShadow = true;
      this.scene.add(pole, top);
    }

    // Iconic Miami pastel lifeguard tower
    for (const lz of [-42, 16, 72]) {
      const lg = new THREE.Group();
      lg.position.set(41, 0, lz);
      const stilts = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      stilts.position.y = 1.1;
      const shack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.1, 2.6), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      shack.position.y = 3.2;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
      roof.position.y = 4.8;
      roof.rotation.y = Math.PI / 4;
      lg.add(stilts, shack, roof);
      this.scene.add(lg);
    }
  }

  _buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.32 });
    for (let z = -120; z <= 130; z += 24) {
      for (const sx of [-11.8, 11.8]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.6, 8), poleMat);
        pole.position.set(sx, 3.8, z);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.14), poleMat);
        arm.position.set(sx + (sx < 0 ? 1.0 : -1.0), 7.5, z);
        const glow = createGlowSprite(0xffd699, 2.6, 0.3);
        glow.position.set(sx + (sx < 0 ? 2.0 : -2.0), 7.3, z);
        this.streetLights.push(glow);
        this.scene.add(pole, arm, glow);
      }
    }
  }

  _buildTrafficSignalsAndCrosswalks() {
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.84 });
    for (const cz of [-60, 0, 60]) {
      for (let x = -8.5; x <= 8.5; x += 2.2) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.4), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.025, cz);
        this.scene.add(stripe);
      }
    }
  }

  _buildYachtsAndPeds() {
    const yachtSpots = [
      { x: 74, z: -86, ry: -0.25, sc: 1.0 },
      { x: 88, z: -18, ry: 0.15, sc: 1.15 },
      { x: 72, z: 24, ry: -0.32, sc: 1.08 },
      { x: 96, z: 68, ry: 0.22, sc: 0.95 },
    ];
    for (const ys of yachtSpots) {
      const y = createYacht(ys.sc);
      y.position.set(ys.x, -0.15, ys.z);
      y.rotation.y = ys.ry;
      this.scene.add(y);
      this.yachts.push({ mesh: y, baseY: -0.15, phase: ys.z * 0.08 });
    }

    // Sidewalk & beachfront pedestrians
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? 'west' : 'east';
      const px = side === 'west' ? -13.6 - (i % 3) * 0.7 : 13.4 + (i % 3) * 0.8;
      const pz = -95 + i * 11.5;
      const ped = createCharacter('ped', i);
      ped.mesh.position.set(px, 0, pz);
      const baseRy = i % 3 === 0 ? 0 : Math.PI;
      ped.mesh.rotation.y = baseRy;
      this.scene.add(ped.mesh);
      this.sidewalkPeds.push({
        char: ped,
        side,
        homeZ: pz,
        baseRy,
        phase: i * 0.9,
        panicked: false,
        panicTimer: 0,
        fleeAngle: 0,
      });
    }
  }

  _buildMissionBeacon() {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.7, 32),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.2, 26, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.y = 13;
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, wireframe: true })
    );
    diamond.position.y = 3.2;

    g.add(ring, beam, diamond);
    g.visible = false;
    this.scene.add(g);
    this.missionBeacon = { group: g, ring, beam, diamond };
  }

  _buildInteractiveLocations() {
    for (const loc of INTERACTIVE_LOCATIONS) {
      const g = new THREE.Group();
      g.position.set(loc.x, 0.08, loc.z);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.75, 2.35, 32),
        new THREE.MeshBasicMaterial({ color: loc.color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = -Math.PI / 2;
      g.add(ring);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.45, 1.85, 4.4, 18, 1, true),
        new THREE.MeshBasicMaterial({
          color: loc.color,
          transparent: true,
          opacity: 0.11,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      beam.position.y = 2.2;
      g.add(beam);

      const icon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshBasicMaterial({ color: loc.color, wireframe: true })
      );
      icon.position.y = 2.1;
      g.add(icon);

      const glow = createGlowSprite(loc.color, 2.4, 0.36);
      glow.position.y = 2.1;
      g.add(glow);

      this.scene.add(g);
      this.interactiveMarkers.push({ ...loc, group: g, ring, icon, beam });
    }
  }

  update(time, missionTarget = null) {
    for (const p of this.palms) {
      p.crown.rotation.z = Math.sin(time * 1.4 + p.phase) * 0.045;
    }
    for (const y of this.yachts) {
      y.mesh.position.y = y.baseY + Math.sin(time * 1.2 + y.phase) * 0.14;
      y.mesh.rotation.z = Math.sin(time * 0.9 + y.phase) * 0.025;
    }
    if (this.oceanTex) {
      this.oceanTex.offset.y = (time * 0.018) % 1;
    }
    for (const m of this.interactiveMarkers) {
      m.icon.rotation.y = time * 1.8;
      m.icon.position.y = 2.3 + Math.sin(time * 2.4) * 0.2;
    }
    if (this.missionBeacon) {
      if (missionTarget) {
        this.missionBeacon.group.visible = true;
        this.missionBeacon.group.position.set(missionTarget.x, 0, missionTarget.z);
        this.missionBeacon.diamond.rotation.y = time * 2.2;
      } else {
        this.missionBeacon.group.visible = false;
      }
    }
  }
}
