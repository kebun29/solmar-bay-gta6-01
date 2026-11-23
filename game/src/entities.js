import * as THREE from 'three';
import { createContactShadow, createGlowSprite } from './world.js';

function createWheel(radius = 0.39, width = 0.28, isHero = false) {
  const g = new THREE.Group();

  // Rubber tire
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.88, metalness: 0.08 })
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  g.add(tire);

  // Recessed alloy barrel
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, width + 0.015, 16),
    new THREE.MeshStandardMaterial({
      color: isHero ? 0xe2e8f0 : 0xcbd5e1,
      metalness: 0.85,
      roughness: 0.2,
    })
  );
  rim.rotation.z = Math.PI / 2;
  g.add(rim);

  // 5-spoke star detail + hubcap
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(width + 0.03, 0.055, radius * 1.15), spokeMat);
    spoke.rotation.x = a;
    g.add(spoke);
  }

  // Brake caliper accent on hero sports car
  if (isHero) {
    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.7, 0.16, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.4, roughness: 0.35 })
    );
    caliper.position.set(0, 0.06, 0.14);
    g.add(caliper);
  }

  return g;
}

function createExtrudedProfile(points, width, bevel = 0.08) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.translate(0, 0, -width / 2);
  // Rotate so shape +X maps to world +Z (car front) and extrusion maps to world X (car width)
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

let _cbpdDoorTex = null;
function getCBPDDoorTexture() {
  if (_cbpdDoorTex) return _cbpdDoorTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  // Crisp patrol white door background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle door seam vertical divider & handle
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 248);
  ctx.beginPath();
  ctx.moveTo(262, 6);
  ctx.lineTo(262, 250);
  ctx.stroke();

  // Tactical diagonal cyan + coral speed stripes along lower half
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 174, 512, 34);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(0, 166, 512, 12);
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(0, 206, 512, 9);

  // Diagonal tactical chevrons on rear quarter
  ctx.fillStyle = '#38bdf8';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(410 + i * 26, 174);
    ctx.lineTo(426 + i * 26, 174);
    ctx.lineTo(412 + i * 26, 208);
    ctx.lineTo(396 + i * 26, 208);
    ctx.closePath();
    ctx.fill();
  }

  // Golden CBPD Star Shield Badge
  const bx = 92;
  const by = 92;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(bx, by, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const r = i % 2 === 0 ? 27 : 12;
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const px = bx + Math.cos(a) * r;
    const py = by + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Bold CBPD lettering
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 74px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CBPD', 152, 84);

  ctx.fillStyle = '#334155';
  ctx.font = '800 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORALINA BAY POLICE', 154, 134);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('INTERCEPTOR · 911', 28, 193);

  _cbpdDoorTex = new THREE.CanvasTexture(c);
  _cbpdDoorTex.colorSpace = THREE.SRGBColorSpace;
  _cbpdDoorTex.anisotropy = 4;
  return _cbpdDoorTex;
}

let _heroTopStripeTex = null;
function getHeroTopStripeTexture() {
  if (_heroTopStripeTex) return _heroTopStripeTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 512);

  // Twin matte-carbon racing stripes with gold pinstripes
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(80, 0, 36, 512);
  ctx.fillRect(140, 0, 36, 512);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(72, 0, 5, 512);
  ctx.fillRect(179, 0, 5, 512);

  // Subtle hood & deck panel seams
  ctx.strokeStyle = 'rgba(10, 14, 24, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, 128); ctx.lineTo(240, 128);
  ctx.moveTo(16, 384); ctx.lineTo(240, 384);
  ctx.stroke();

  _heroTopStripeTex = new THREE.CanvasTexture(c);
  _heroTopStripeTex.colorSpace = THREE.SRGBColorSpace;
  return _heroTopStripeTex;
}

let _heroSideSeamTex = null;
function getHeroSideSeamTexture() {
  if (_heroSideSeamTex) return _heroSideSeamTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);

  // Crisp door panel seam & sculpted side aero intake
  ctx.strokeStyle = 'rgba(10, 14, 24, 0.62)';
  ctx.lineWidth = 4;
  ctx.strokeRect(128, 12, 230, 102);

  // Gold/carbon lower rocker accent stripe
  ctx.fillStyle = '#111827';
  ctx.fillRect(24, 92, 464, 16);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(24, 86, 464, 4);

  // Side aero vent scoop
  ctx.fillStyle = '#0b0f18';
  ctx.beginPath();
  ctx.moveTo(356, 28);
  ctx.lineTo(426, 20);
  ctx.lineTo(418, 76);
  ctx.lineTo(352, 72);
  ctx.closePath();
  ctx.fill();

  // "CORSAIR V12" fender badge
  ctx.fillStyle = '#fde68a';
  ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('V12', 64, 62);

  _heroSideSeamTex = new THREE.CanvasTexture(c);
  _heroSideSeamTex.colorSpace = THREE.SRGBColorSpace;
  return _heroSideSeamTex;
}

export function createVehicleMesh(type = 'hero', bodyColor = 0xf43f5e) {
  const root = new THREE.Group();
  const isPolice = type === 'police';
  const isHero = type === 'hero';

  const paintMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0x0f172a : bodyColor,
    metalness: isHero ? 0.78 : isPolice ? 0.52 : 0.55,
    roughness: isHero ? 0.14 : isPolice ? 0.22 : 0.26,
    envMapIntensity: isHero ? 1.75 : 1.35,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    metalness: 0.48,
    roughness: 0.32,
    envMapIntensity: 1.2,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.28,
    roughness: 0.26,
    envMapIntensity: 1.25,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1f33,
    metalness: 0.94,
    roughness: 0.05,
    envMapIntensity: 2.0,
    transparent: true,
    opacity: 0.56,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
    envMapIntensity: 1.8,
  });

  // Soft contact shadow underneath
  root.add(createContactShadow(3.0, 5.7, 0.78));

  // Sculpted lower body silhouette via ExtrudeGeometry
  const lowerPts = isHero
    ? [
        [-2.32, 0.34],
        [-2.38, 0.84],
        [-1.85, 0.94],
        [-1.12, 0.95],
        [0.92, 0.92],
        [1.92, 0.78],
        [2.42, 0.56],
        [2.38, 0.28],
        [-2.25, 0.28],
      ]
    : [
        [-2.28, 0.34],
        [-2.32, 0.88],
        [-1.45, 0.94],
        [1.1, 0.92],
        [2.18, 0.82],
        [2.36, 0.56],
        [2.3, 0.3],
        [-2.22, 0.3],
      ];

  const lowerMesh = new THREE.Mesh(createExtrudedProfile(lowerPts, 1.94, 0.08), paintMat);
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  root.add(lowerMesh);

  // Sculpted tapered cabin / greenhouse silhouette
  const cabinPts = isHero
    ? [
        [-1.58, 0.9],
        [-0.78, 1.3],
        [0.14, 1.3],
        [1.06, 0.88],
      ]
    : [
        [-1.38, 0.9],
        [-0.86, 1.42],
        [0.34, 1.42],
        [1.04, 0.9],
      ];

  const cabinMesh = new THREE.Mesh(
    createExtrudedProfile(cabinPts, isHero ? 1.44 : 1.54, 0.07),
    isPolice ? whiteMat : paintMat
  );
  cabinMesh.castShadow = true;
  root.add(cabinMesh);

  // Tinted wrap-around windshield + side glass + rear fastback glass
  const glassPts = isHero
    ? [
        [-1.48, 0.92],
        [-0.76, 1.26],
        [0.12, 1.26],
        [0.98, 0.91],
      ]
    : [
        [-1.3, 0.93],
        [-0.82, 1.37],
        [0.32, 1.37],
        [0.98, 0.93],
      ];
  const glassCore = new THREE.Mesh(
    createExtrudedProfile(glassPts, isHero ? 1.5 : 1.6, 0.03),
    glassMat
  );
  root.add(glassCore);

  // Visible Cabin Interior behind tinted glass: sculpted seats, headrests, dashboard, steering wheel & driver silhouette
  const seatMat = new THREE.MeshStandardMaterial({
    color: isHero ? 0x261620 : 0x1e2532,
    roughness: 0.78,
  });
  const trimSeatMat = new THREE.MeshStandardMaterial({
    color: isHero ? 0xfb7185 : 0x334155,
    roughness: 0.65,
  });
  [-0.36, 0.36].forEach((sx) => {
    // Seat backrest + bolster
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.14), seatMat);
    back.position.set(sx, 1.04, -0.32);
    back.rotation.x = -0.2;
    root.add(back);
    // Headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.12), trimSeatMat);
    headrest.position.set(sx, 1.24, -0.38);
    root.add(headrest);
  });
  // Dashboard & steering wheel
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.18, 0.34), carbonMat);
  dash.position.set(0, 0.98, 0.48);
  root.add(dash);
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 14), carbonMat);
  wheelRim.position.set(0.36, 1.04, 0.28);
  wheelRim.rotation.x = 0.35;
  root.add(wheelRim);
  // Driver silhouette head/shoulders inside cabin
  const driverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  driverHead.position.set(0.36, 1.18, -0.14);
  root.add(driverHead);

  // Sculpted wheel-arch flares (4 semi-cylindrical housings)
  const archGeo = new THREE.TorusGeometry(0.46, 0.09, 8, 14, Math.PI);
  const archPositions = [
    [-1.02, 0.42, 1.38],
    [1.02, 0.42, 1.38],
    [-1.02, 0.42, -1.36],
    [1.02, 0.42, -1.36],
  ];
  archPositions.forEach(([ax, ay, az]) => {
    const arch = new THREE.Mesh(archGeo, isHero ? carbonMat : paintMat);
    arch.rotation.y = Math.PI / 2;
    arch.position.set(ax, ay, az);
    root.add(arch);
  });

  // Side skirts & front splitter
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.08, 0.34), carbonMat);
  splitter.position.set(0, 0.28, 2.34);
  root.add(splitter);

  [-1.03, 1.03].forEach((sx) => {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 2.0), carbonMat);
    skirt.position.set(sx, 0.32, 0.02);
    root.add(skirt);

    // Side mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.14), isPolice ? whiteMat : paintMat);
    mirror.position.set(sx * 0.95, 1.0, 0.62);
    root.add(mirror);
  });

  // Front air intake grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.2, 0.08), carbonMat);
  grille.position.set(0, 0.44, 2.43);
  root.add(grille);

  // Rear diffuser + quad exhaust tips
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.22, 0.14), carbonMat);
  diffuser.position.set(0, 0.36, -2.38);
  root.add(diffuser);

  const exhaustXs = isHero ? [-0.58, -0.42, 0.42, 0.58] : [-0.56, 0.56];
  exhaustXs.forEach((ex) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.2, 10), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.34, -2.44);
    root.add(pipe);
  });

  // Hero sports car exclusive: racing stripes, panel seams, sculpted hood vent, GT wing & blue-orange Nitro flames
  let nitroGroup = null;
  if (isHero) {
    // Hood & roof twin racing stripe decals
    const stripeMat = new THREE.MeshStandardMaterial({
      map: getHeroTopStripeTexture(),
      transparent: true,
      roughness: 0.25,
      metalness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const hoodStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.38), stripeMat);
    hoodStripe.rotation.x = -Math.PI / 2 + 0.14;
    hoodStripe.position.set(0, 0.94, 1.38);
    root.add(hoodStripe);

    const roofStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.94), stripeMat);
    roofStripe.rotation.x = -Math.PI / 2;
    roofStripe.position.set(0, 1.39, -0.32);
    root.add(roofStripe);

    const deckStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.78), stripeMat);
    deckStripe.rotation.x = -Math.PI / 2 - 0.1;
    deckStripe.position.set(0, 0.99, -1.78);
    root.add(deckStripe);

    // Side door seams & V12 aero vents (both flanks)
    const sideMat = new THREE.MeshStandardMaterial({
      map: getHeroSideSeamTexture(),
      transparent: true,
      roughness: 0.28,
      metalness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    [-1, 1].forEach((side) => {
      const sideDecal = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.56), sideMat);
      sideDecal.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      sideDecal.position.set(side * 1.058, 0.64, -0.02);
      root.add(sideDecal);
    });

    const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.85), carbonMat);
    hoodVent.position.set(0, 0.91, 1.32);
    hoodVent.rotation.x = 0.14;
    root.add(hoodVent);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.065, 0.36), carbonMat);
    wing.position.set(0, 1.22, -2.14);
    wing.rotation.x = 0.14;
    wing.castShadow = true;
    root.add(wing);

    [-1.02, 1.02].forEach((ex) => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.42), paintMat);
      endplate.position.set(ex, 1.2, -2.14);
      root.add(endplate);
    });

    [-0.58, 0.58].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.18), carbonMat);
      strut.position.set(sx, 1.04, -2.08);
      root.add(strut);
    });

    // Quad Blue-Orange Nitro Exhaust Flames (toggled during cover chase & nitro surge)
    nitroGroup = new THREE.Group();
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff6b1a,
      transparent: true,
      opacity: 0.84,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    [-0.58, -0.42, 0.42, 0.58].forEach((ex, idx) => {
      const len = idx === 0 || idx === 3 ? 1.25 : 1.62;
      const outerCone = new THREE.Mesh(new THREE.ConeGeometry(0.088, len, 10, 1, true), outerFlameMat);
      outerCone.rotation.x = -Math.PI / 2;
      outerCone.position.set(ex, 0.34, -2.52 - len * 0.48);
      nitroGroup.add(outerCone);

      const innerCone = new THREE.Mesh(new THREE.ConeGeometry(0.052, len * 0.72, 10, 1, true), innerFlameMat);
      innerCone.rotation.x = -Math.PI / 2;
      innerCone.position.set(ex, 0.34, -2.5 - len * 0.34);
      nitroGroup.add(innerCone);
    });
    [-0.5, 0.5].forEach((ex) => {
      const blueBloom = createGlowSprite(0x0ea5e9, 0.95, 0.72);
      blueBloom.position.set(ex, 0.34, -2.72);
      nitroGroup.add(blueBloom);
      const orangeBloom = createGlowSprite(0xff6b1a, 1.35, 0.52);
      orangeBloom.position.set(ex, 0.34, -3.22);
      nitroGroup.add(orangeBloom);
    });
    nitroGroup.visible = false;
    root.add(nitroGroup);
  }

  // Police Interceptor exclusive: procedural CBPD livery doors, ramming pushbar, glowing LED lightbar
  let redGlow = null;
  let blueGlow = null;
  if (isPolice) {
    const doorLiveryMat = new THREE.MeshStandardMaterial({
      map: getCBPDDoorTexture(),
      roughness: 0.24,
      metalness: 0.32,
      envMapIntensity: 1.35,
    });
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.13, 0.54, 1.92),
      [doorLiveryMat, doorLiveryMat, whiteMat, whiteMat, whiteMat, whiteMat]
    );
    doorPanel.position.set(0, 0.63, -0.02);
    root.add(doorPanel);

    // Subtle coral/cyan CBPD side bumper trim
    const sideStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.06, 2.28),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    sideStripe.position.set(0, 0.43, -0.02);
    root.add(sideStripe);

    // Heavy tactical push bumper
    const pushCross = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.1, 0.14), carbonMat);
    pushCross.position.set(0, 0.58, 2.48);
    root.add(pushCross);
    [-0.56, 0.56].forEach((px) => {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 0.2), carbonMat);
      upright.position.set(px, 0.52, 2.46);
      root.add(upright);
    });

    // Sleek roof lightbar
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.09, 0.26), carbonMat);
    barBase.position.set(0, 1.49, -0.18);
    root.add(barBase);

    const redLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.12, 0.24),
      new THREE.MeshBasicMaterial({ color: 0xff2244 })
    );
    redLamp.position.set(-0.34, 1.54, -0.18);
    root.add(redLamp);

    const blueLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.12, 0.24),
      new THREE.MeshBasicMaterial({ color: 0x1e90ff })
    );
    blueLamp.position.set(0.34, 1.54, -0.18);
    root.add(blueLamp);

    const centerStrobe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    centerStrobe.position.set(0, 1.54, -0.18);
    root.add(centerStrobe);

    redGlow = createGlowSprite(0xff2848, 3.6, 0.96);
    redGlow.position.set(-0.42, 1.65, -0.18);
    blueGlow = createGlowSprite(0x2299ff, 3.6, 0.96);
    blueGlow.position.set(0.42, 1.65, -0.18);
    root.add(redGlow, blueGlow);
  }

  // Headlights with LED strips & bloom sprites
  [-0.7, 0.7].forEach((hx) => {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.11, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xfff7e0 })
    );
    hl.position.set(hx, 0.64, 2.38);
    root.add(hl);

    const hGlow = createGlowSprite(0xfff1c9, 2.0, 0.78);
    hGlow.position.set(hx, 0.64, 2.48);
    root.add(hGlow);
  });

  // Full-width LED taillight bar (hero) or dual taillights (cruiser/civ) with bloom
  if (isHero) {
    const tailBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.09, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff1e3c })
    );
    tailBar.position.set(0, 0.78, -2.41);
    root.add(tailBar);

    [-0.72, 0, 0.72].forEach((tx, idx) => {
      const tGlow = createGlowSprite(0xff2244, idx === 1 ? 1.5 : 2.1, 0.85);
      tGlow.position.set(tx, 0.78, -2.5);
      root.add(tGlow);
    });
  } else {
    [-0.72, 0.72].forEach((tx) => {
      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.12, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xff2438 })
      );
      tl.position.set(tx, 0.74, -2.35);
      root.add(tl);

      const tGlow = createGlowSprite(0xff2438, 1.75, 0.78);
      tGlow.position.set(tx, 0.74, -2.45);
      root.add(tGlow);
    });
  }

  // 4 sculpted wheels
  const wheels = [];
  [
    [-0.98, 1.38],
    [0.98, 1.38],
    [-0.98, -1.36],
    [0.98, -1.36],
  ].forEach(([wx, wz]) => {
    const w = createWheel(0.39, 0.28, isHero);
    w.position.set(wx, 0.39, wz);
    root.add(w);
    wheels.push(w);
  });

  return { mesh: root, wheels, redGlow, blueGlow, paintMat, nitroGroup };
}

// Attach a non-boxy CBPD tactical officer leaning out of a cruiser's side window firing a carbine
export function createWindowShooter(side = 1) {
  const g = new THREE.Group();
  const copMat = new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.65 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55, metalness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca984, roughness: 0.6 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.25 });

  // Sculpted torso + tactical vest leaning out window
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.24, 6, 12), copMat);
  torso.position.set(side * 0.14, 0.08, 0);
  torso.rotation.z = -side * 0.32;
  g.add(torso);

  const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.165, 0.28, 10), vestMat);
  vest.position.set(side * 0.15, 0.1, 0);
  vest.rotation.z = -side * 0.32;
  g.add(vest);

  // Smooth sphere head + dome tactical helmet + ballistic visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), skinMat);
  head.scale.set(0.95, 1.08, 1.0);
  head.position.set(side * 0.24, 0.37, 0.02);
  g.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.152, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    vestMat
  );
  helmet.position.set(side * 0.24, 0.39, 0.02);
  g.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.148, 0.148, 0.075, 12, 1, true, -0.9, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x0c2438, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide })
  );
  visor.position.set(side * 0.25, 0.37, 0.03);
  visor.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  g.add(visor);

  // Cylindrical/capsule arm aiming outward toward the player
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.42, 5, 10), copMat);
  arm.rotation.z = Math.PI / 2;
  arm.rotation.y = -side * 0.22;
  arm.position.set(side * 0.45, 0.18, 0.12);
  g.add(arm);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.09), gunMat);
  gun.position.set(side * 0.72, 0.2, 0.18);
  gun.rotation.y = -side * 0.22;
  g.add(gun);

  // Bright multi-layer muzzle flash
  const coreFlash = createGlowSprite(0xfff7d6, 1.9, 0.98);
  coreFlash.position.set(side * 1.12, 0.21, 0.25);
  g.add(coreFlash);

  const outerFlash = createGlowSprite(0xff7b29, 3.2, 0.88);
  outerFlash.position.set(side * 1.12, 0.21, 0.25);
  g.add(outerFlash);

  g.position.set(side * 0.86, 1.12, 0.18);
  return { group: g, muzzlePosLocal: new THREE.Vector3(side * 1.15, 0.21, 0.25) };
}

// Charred burning & exploding wrecked vehicle with flying debris, sharp embers, layered fire core & wind-blown smoke
export function createBurningWreck() {
  const root = new THREE.Group();
  const base = createVehicleMesh('police');
  // Char the hull dark soot
  base.mesh.traverse((obj) => {
    if (obj.isMesh && obj.material && obj.material.color) {
      obj.material = obj.material.clone();
      obj.material.color.multiplyScalar(0.24);
      if (obj.material.roughness !== undefined) obj.material.roughness = 0.94;
    }
  });
  if (base.redGlow) base.redGlow.visible = false;
  if (base.blueGlow) base.blueGlow.visible = false;

  // Tilted, crashed posture
  base.mesh.rotation.z = 0.22;
  base.mesh.rotation.x = -0.07;
  base.mesh.position.y = 0.08;
  root.add(base.mesh);

  // 3D Sculpted layered flame tongues rising from hood & cabin
  const flameConeSpecs = [
    { pos: [0.0, 1.35, 1.02], r: 0.48, h: 1.55, col: 0xfff3b0, op: 0.92 },
    { pos: [0.22, 1.55, 0.82], r: 0.65, h: 2.15, col: 0xff7b1c, op: 0.78 },
    { pos: [-0.28, 1.48, 1.15], r: 0.56, h: 1.9, col: 0xef4444, op: 0.74 },
    { pos: [0.08, 1.75, 0.45], r: 0.52, h: 1.85, col: 0xff5a1f, op: 0.72 },
  ];
  flameConeSpecs.forEach((fc, idx) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(fc.r, fc.h, 8),
      new THREE.MeshBasicMaterial({
        color: fc.col,
        transparent: true,
        opacity: fc.op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    cone.position.set(fc.pos[0], fc.pos[1], fc.pos[2]);
    cone.rotation.z = -0.18 + (idx % 2 === 0 ? 0.06 : -0.08);
    root.add(cone);
  });

  // Layered roaring fire core sprites
  const fireSpecs = [
    { pos: [0, 1.12, 1.05], col: 0xfff8d6, scale: 2.35, op: 0.96 },
    { pos: [0.3, 1.48, 0.76], col: 0xff7b1c, scale: 3.4, op: 0.86 },
    { pos: [-0.36, 1.25, 1.12], col: 0xe11d48, scale: 3.1, op: 0.82 },
    { pos: [0.12, 2.02, 0.52], col: 0xff5a1f, scale: 2.9, op: 0.76 },
  ];
  fireSpecs.forEach((f) => {
    const s = createGlowSprite(f.col, f.scale, f.op);
    s.position.set(f.pos[0], f.pos[1], f.pos[2]);
    root.add(s);
  });

  // Flying charred debris & metal shrapnel chunks + detached wheel on asphalt
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.88, metalness: 0.45 });
  const scorchedMat = new THREE.MeshStandardMaterial({
    color: 0x1c1716,
    emissive: 0xc2410c,
    emissiveIntensity: 0.28,
    roughness: 0.85,
  });
  const debrisChunks = [
    { pos: [-1.1, 2.05, 1.35], size: [0.62, 0.06, 0.42], rot: [0.6, 0.4, 0.8], mat: scorchedMat },
    { pos: [1.15, 1.75, 1.05], size: [0.48, 0.1, 0.22], rot: [0.3, 1.1, -0.5], mat: debrisMat },
    { pos: [-0.85, 2.55, 0.55], size: [0.32, 0.07, 0.26], rot: [1.2, 0.5, 0.4], mat: scorchedMat },
    { pos: [0.95, 2.35, 0.35], size: [0.28, 0.08, 0.22], rot: [0.8, -0.6, 1.1], mat: debrisMat },
    { pos: [-1.45, 0.1, 1.65], size: [0.55, 0.08, 0.34], rot: [0.05, 0.9, 0.04], mat: debrisMat },
    { pos: [1.45, 0.1, 1.45], size: [0.42, 0.09, 0.28], rot: [0.04, -0.4, 0.06], mat: scorchedMat },
  ];
  debrisChunks.forEach((d) => {
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(d.size[0], d.size[1], d.size[2]), d.mat);
    chunk.position.set(d.pos[0], d.pos[1], d.pos[2]);
    chunk.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
    chunk.castShadow = true;
    root.add(chunk);
  });
  // Detached burning wheel resting flat on asphalt near front fender
  const looseWheel = createWheel(0.36, 0.26, false);
  looseWheel.position.set(1.55, 0.15, 1.65);
  looseWheel.rotation.set(Math.PI / 2 - 0.05, 0.3, 0.1);
  root.add(looseWheel);

  // Sharp glowing ember streaks blasting outward from the fire core
  const emberMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let e = 0; e < 18; e++) {
    const ang = (e / 18) * Math.PI * 2 + (e % 3) * 0.22;
    const dist = 1.05 + (e % 4) * 0.55;
    const h = 1.3 + (e % 5) * 0.52;
    const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.028, 0.42 + (e % 3) * 0.18, 5), emberMat);
    streak.position.set(Math.cos(ang) * dist, h, 0.85 + Math.sin(ang) * dist * 0.75);
    streak.rotation.set((e % 2 === 0 ? 1 : -1) * 0.65, ang, -0.55);
    root.add(streak);
  }

  // Dense wind-blown dark smoke column rising & curving with coastal wind
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const smokeCol = i < 2 ? 0x5c2c1d : i < 4 ? 0x2a2120 : 0x161a24;
    const smoke = createGlowSprite(smokeCol, 2.3 + i * 0.62, 0.78 - t * 0.34);
    smoke.material.blending = THREE.NormalBlending;
    // Wind drifts column smoothly toward +X and -Z
    smoke.position.set(
      0.15 + Math.pow(t, 1.35) * 3.8 + (i % 2 === 0 ? 0.25 : -0.22),
      2.05 + i * 0.95,
      0.75 - Math.pow(t, 1.25) * 2.4
    );
    root.add(smoke);
  }

  // Warm fire point light illuminating nearby asphalt & cars
  const fireLight = new THREE.PointLight(0xff6b22, 24, 26, 1.45);
  fireLight.position.set(0, 2.3, 0.9);
  root.add(fireLight);

  return root;
}

export function createPoliceHelicopter() {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x263b59, metalness: 0.45, roughness: 0.28 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.38 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x12324d,
    metalness: 0.88,
    roughness: 0.1,
    transparent: true,
    opacity: 0.86,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.72, 4.7), bodyMat);
  body.castShadow = true;
  root.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.16, 16, 12), glassMat);
  nose.scale.set(0.92, 0.78, 1.38);
  nose.position.set(0, -0.05, 2.15);
  root.add(nose);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.24, 3.6), stripeMat);
  stripe.position.set(0, -0.18, 0.1);
  root.add(stripe);

  const coralTrim = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.08, 3.6), accentMat);
  coralTrim.position.set(0, -0.34, 0.1);
  root.add(coralTrim);

  // Tail boom & fin
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 5.2, 8), bodyMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.25, -4.4);
  root.add(boom);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.9), stripeMat);
  fin.position.set(0, 0.65, -6.7);
  root.add(fin);

  // Landing skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.28 });
  [-1.05, 1.05].forEach((sx) => {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 8), skidMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, -1.35, 0.2);
    root.add(skid);
  });

  // Main rotor + blur disc
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 1.35, 0.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.7, 8), skidMat);
  mast.position.y = -0.25;
  rotorGroup.add(mast);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.05, 0.28), bladeMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 9.8), bladeMat);
  rotorGroup.add(b1, b2);

  const blurDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.9, 32),
    new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.19,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  blurDisc.rotation.x = -Math.PI / 2;
  blurDisc.position.y = 0.03;
  rotorGroup.add(blurDisc);
  root.add(rotorGroup);

  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.14), bladeMat);
  tailRotor.position.set(0.2, 0.65, -6.8);
  root.add(tailRotor);

  // Clean translucent downward searchlight cone
  const coneGeo = new THREE.ConeGeometry(5.4, 28, 24, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xe0f5ff,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const searchCone = new THREE.Mesh(coneGeo, coneMat);
  searchCone.position.set(0, -14.0, 2.2);
  searchCone.rotation.x = -0.2;
  root.add(searchCone);

  const lampGlow = createGlowSprite(0xe0f2fe, 3.2, 0.96);
  lampGlow.position.set(0, -0.75, 2.25);
  root.add(lampGlow);

  return { mesh: root, rotorGroup, tailRotor, searchCone };
}

export function createPatrolBoat() {
  const g = new THREE.Group();
  const hullPts = [
    [-4.2, 0.1],
    [-4.2, 1.05],
    [2.6, 1.12],
    [4.6, 1.25],
    [3.5, 0.1],
  ];
  const hull = new THREE.Mesh(
    createExtrudedProfile(hullPts, 2.9, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.15 })
  );
  g.add(hull);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.25, 3.0),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5 })
  );
  cabin.position.set(0, 1.65, -0.4);
  g.add(cabin);

  const beacon = createGlowSprite(0x22d3ee, 3.0, 0.92);
  beacon.position.set(0, 2.55, -0.4);
  g.add(beacon);
  return g;
}

// Luxury Marina Yacht for Coralina Bay ocean depth
export function createYacht(scale = 1.0) {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.18 });
  const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0c2438, metalness: 0.9, roughness: 0.1 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0xb68b5c, roughness: 0.78 });

  const hullPts = [
    [-6.2, 0.0],
    [-6.4, 1.55],
    [4.4, 1.75],
    [7.2, 2.1],
    [5.2, 0.0],
  ];
  const hull = new THREE.Mesh(createExtrudedProfile(hullPts, 3.8, 0.12), whiteMat);
  hull.castShadow = true;
  g.add(hull);

  // Navy waterline stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.06, 0.28, 11.4), navyMat);
  stripe.position.set(0, 0.65, -0.2);
  g.add(stripe);

  // Teak aft deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 4.2), teakMat);
  deck.position.set(0, 1.62, -3.8);
  g.add(deck);

  // Sleek salon & flybridge
  const salon = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.25, 5.4), whiteMat);
  salon.position.set(0, 2.25, -0.1);
  g.add(salon);

  const bridgeGlass = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.55, 3.6), glassMat);
  bridgeGlass.position.set(0, 2.35, 0.85);
  g.add(bridgeGlass);

  // Radar arch & warm mast light
  const arch = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 0.5), whiteMat);
  arch.position.set(0, 3.75, -0.8);
  g.add(arch);
  [-1.25, 1.25].forEach((ax) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.35), whiteMat);
    pillar.position.set(ax, 3.3, -0.8);
    g.add(pillar);
  });

  const mastLight = createGlowSprite(0xffd89b, 2.2, 0.85);
  mastLight.position.set(0, 4.15, -0.8);
  g.add(mastLight);

  g.scale.setScalar(scale);
  return g;
}

// Articulated non-boxy character (player, CBPD SWAT officer, or tropical sidewalk pedestrian)
export function createCharacter(role = 'player', pedStyleIdx = 0) {
  const root = new THREE.Group();
  const isCop = role === 'cop';
  const isPlayer = role === 'player';
  const isPed = role === 'ped';

  const pedPalettes = [
    { jacket: 0xfb7185, shirt: 0xffffff, pants: 0x334155, skin: 0xdca782, hair: 0x1e1512 },
    { jacket: 0x14b8a6, shirt: 0xfef08a, pants: 0x1e293b, skin: 0xc68a63, hair: 0x2a1c14 },
    { jacket: 0xf59e0b, shirt: 0xf8fafc, pants: 0x475569, skin: 0xe2b796, hair: 0x4a2f1d },
    { jacket: 0x8b5cf6, shirt: 0xfda4af, pants: 0x1f2937, skin: 0xb97c56, hair: 0x111827 },
    { jacket: 0x38bdf8, shirt: 0xfef3c7, pants: 0x374151, skin: 0xd9a27c, hair: 0x3b2416 },
  ];
  const pp = pedPalettes[pedStyleIdx % pedPalettes.length];

  const jacketColor = isPlayer ? 0x1a1f2e : isCop ? 0x132043 : pp.jacket;
  const shirtColor = isPlayer ? 0xfb7185 : isCop ? 0x22d3ee : pp.shirt;
  const pantsColor = isPlayer ? 0x1f2430 : isCop ? 0x0f172a : pp.pants;
  const skinColor = isPlayer ? 0xd8a47f : isCop ? 0xe0b592 : pp.skin;

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.68, metalness: 0.08 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.58 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.65, metalness: 0.15 });
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.52, metalness: 0.28 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.82, roughness: 0.25 });

  const shadow = createContactShadow(1.15, 1.15, 0.58);
  root.add(shadow);

  const rig = new THREE.Group();
  root.add(rig);

  const hips = new THREE.Group();
  hips.position.set(0, 0.94, 0);
  rig.add(hips);

  // Pelvis / belt base
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.165, 0.16, 12), pantsMat);
  pelvis.scale.set(1.18, 1, 0.72);
  pelvis.position.y = 0.02;
  hips.add(pelvis);

  // Sculpted rounded torso (tapered capsule/cylinder, non-boxy)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.175, 0.5, 14), jacketMat);
  torso.scale.set(1.1, 1, 0.66);
  torso.position.y = 0.3;
  torso.castShadow = true;
  hips.add(torso);

  // Collar / inner shirt strip (player & peds) or CBPD SWAT tactical plate carrier vest + pouches + belt
  if (isCop) {
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.205, 0.39, 12), gearMat);
    vest.scale.set(1.1, 1, 0.74);
    vest.position.y = 0.32;
    vest.castShadow = true;
    hips.add(vest);

    // Front tactical mag pouches & CBPD cyan chest patch
    [-0.09, 0, 0.09].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.05), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 }));
      pouch.position.set(px, 0.23, 0.17);
      hips.add(pouch);
    });
    const badgePatch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    badgePatch.position.set(0, 0.42, 0.175);
    hips.add(badgePatch);

    // Tactical utility belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.065, 12), gearMat);
    belt.scale.set(1.15, 1, 0.76);
    belt.position.y = 0.09;
    hips.add(belt);
  } else {
    const innerShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.46, 10), shirtMat);
    innerShirt.scale.set(0.95, 1, 0.72);
    innerShirt.position.set(0, 0.3, 0.055);
    hips.add(innerShirt);

    if (isPlayer) {
      // Stylish open jacket lapel collar
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.032, 8, 14, Math.PI * 1.4), jacketMat);
      collar.rotation.x = Math.PI / 2;
      collar.rotation.z = -Math.PI * 0.2;
      collar.position.set(0, 0.54, -0.01);
      hips.add(collar);
    }
  }

  // Smooth neck & sphere/capsule head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.11, 10), skinMat);
  neck.position.y = 0.59;
  hips.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), skinMat);
  head.scale.set(0.94, 1.08, 0.98);
  head.position.y = 0.73;
  head.castShadow = true;
  hips.add(head);

  if (isCop) {
    // Ballistic dome SWAT tactical helmet + curved visor + comms headset
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      gearMat
    );
    helmet.position.set(0, 0.75, -0.005);
    helmet.castShadow = true;
    hips.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.156, 0.156, 0.075, 14, 1, true, -0.85, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0x0b253d,
        metalness: 0.92,
        roughness: 0.08,
        envMapIntensity: 1.6,
        side: THREE.DoubleSide,
      })
    );
    visor.position.set(0, 0.735, 0.015);
    hips.add(visor);
  } else {
    // Sculpted layered hair crown
    const hairMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x141218 : pp.hair,
      roughness: 0.78,
    });
    const hairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.154, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairDome.scale.set(0.98, 1.05, 1.04);
    hairDome.position.set(0, 0.755, -0.015);
    hips.add(hairDome);

    if (isPlayer) {
      // Sleek sunset aviator shades on player
      const shades = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.045, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.12 })
      );
      shades.position.set(0, 0.74, 0.125);
      hips.add(shades);
    }
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.275, 0.5, 0);
    hips.add(shoulder);

    // Smooth spherical shoulder joint / SWAT shoulder pad
    const shJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isCop ? 0.088 : 0.072, 10, 8),
      isCop ? gearMat : jacketMat
    );
    shoulder.add(shJoint);

    // Smooth capsule upper arm
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.19, 6, 10), jacketMat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.28, 0);
    shoulder.add(elbow);

    // Smooth elbow joint
    const elJoint = new THREE.Mesh(new THREE.SphereGeometry(0.056, 8, 8), isCop ? gearMat : jacketMat);
    elbow.add(elJoint);

    // Smooth capsule forearm + rounded hand
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.18, 6, 10), isCop ? jacketMat : skinMat);
    forearm.position.y = -0.13;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), isCop ? gearMat : skinMat);
    hand.position.y = -0.26;
    elbow.add(hand);

    return { shoulder, elbow };
  }

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0, -0.27, 0.12);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.115, 0.5), gunMat);
  receiver.position.set(0, 0, 0.18);
  weaponGroup.add(receiver);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.08), gunMat);
  mag.position.set(0, -0.1, 0.22);
  mag.rotation.x = 0.2;
  weaponGroup.add(mag);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.52);
  weaponGroup.add(barrel);

  const muzzleFlash = createGlowSprite(0xffb84d, 1.55, 0.0);
  muzzleFlash.position.set(0, 0.02, 0.78);
  weaponGroup.add(muzzleFlash);
  if (!isPed) {
    rightArm.elbow.add(weaponGroup);
  }

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125, -0.02, 0);
    hips.add(hip);

    // Smooth capsule thigh
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.28, 6, 10), pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    hip.add(thigh);

    // Tactical drop-leg pistol holster on CBPD SWAT right thigh
    if (isCop && side === 1) {
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.045, 10), gearMat);
      strap.position.y = -0.18;
      hip.add(strap);
      const holster = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.17, 0.095), gearMat);
      holster.position.set(0.085, -0.19, 0.02);
      hip.add(holster);
    }

    const knee = new THREE.Group();
    knee.position.set(0, -0.43, 0);
    hip.add(knee);

    // Smooth knee joint / SWAT kneepad
    const knJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isCop ? 0.072 : 0.064, 8, 8),
      isCop ? gearMat : pantsMat
    );
    knee.add(knJoint);

    // Smooth capsule shin + tactical boot
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.28, 6, 10), pantsMat);
    shin.position.y = -0.21;
    shin.castShadow = true;
    knee.add(shin);

    const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.11, 6, 8), bootMat);
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, -0.42, 0.045);
    knee.add(boot);

    return { hip, knee };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const charObj = {
    mesh: root,
    rig,
    hips,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponGroup,
    muzzleFlash,
    flashTimer: 0,
    pose: 'idle',
    setPose(pose, time = 0) {
      this.pose = pose;
      rig.position.set(0, 0, 0);
      rig.rotation.set(0, 0, 0);
      hips.position.y = 0.94;
      hips.rotation.set(0, 0, 0);

      if (pose === 'aim') {
        hips.rotation.y = -0.22;
        rightArm.shoulder.rotation.set(-1.38, -0.15, -0.1);
        rightArm.elbow.rotation.set(-0.32, 0, 0);
        leftArm.shoulder.rotation.set(-1.26, 0.56, 0.18);
        leftArm.elbow.rotation.set(-0.62, 0.25, 0);
        weaponGroup.rotation.set(1.52, 0, 0);
        leftLeg.hip.rotation.set(-0.24, 0, 0.08);
        leftLeg.knee.rotation.set(0.32, 0, 0);
        rightLeg.hip.rotation.set(0.22, 0, -0.08);
        rightLeg.knee.rotation.set(0.24, 0, 0);
        hips.position.y = 0.88;
      } else if (pose === 'crouch') {
        hips.position.y = 0.62;
        hips.rotation.x = 0.18;
        rightArm.shoulder.rotation.set(-1.42, -0.15, -0.08);
        rightArm.elbow.rotation.set(-0.35, 0, 0);
        leftArm.shoulder.rotation.set(-1.28, 0.52, 0.16);
        leftArm.elbow.rotation.set(-0.68, 0.2, 0);
        weaponGroup.rotation.set(1.52, 0, 0);
        leftLeg.hip.rotation.set(-0.95, 0, 0.08);
        leftLeg.knee.rotation.set(1.45, 0, 0);
        rightLeg.hip.rotation.set(-0.45, 0, -0.08);
        rightLeg.knee.rotation.set(1.25, 0, 0);
      } else if (pose === 'run') {
        const s = Math.sin(time * 10);
        hips.position.y = 0.92 + Math.abs(s) * 0.05;
        hips.rotation.x = 0.12;
        leftLeg.hip.rotation.set(s * 0.68, 0, 0);
        leftLeg.knee.rotation.set(Math.max(0, -s * 0.85), 0, 0);
        rightLeg.hip.rotation.set(-s * 0.68, 0, 0);
        rightLeg.knee.rotation.set(Math.max(0, s * 0.85), 0, 0);
        leftArm.shoulder.rotation.set(-s * 0.55, 0, 0.1);
        leftArm.elbow.rotation.set(-0.65, 0, 0);
        rightArm.shoulder.rotation.set(s * 0.45 - 0.35, 0, -0.1);
        rightArm.elbow.rotation.set(-0.75, 0, 0);
        weaponGroup.rotation.set(1.1, 0, 0);
      } else if (pose === 'walk') {
        const s = Math.sin(time * 4.5);
        hips.position.y = 0.93 + Math.abs(s) * 0.02;
        leftLeg.hip.rotation.set(s * 0.36, 0, 0);
        leftLeg.knee.rotation.set(Math.max(0, -s * 0.4), 0, 0);
        rightLeg.hip.rotation.set(-s * 0.36, 0, 0);
        rightLeg.knee.rotation.set(Math.max(0, s * 0.4), 0, 0);
        leftArm.shoulder.rotation.set(-s * 0.3, 0, 0.1);
        leftArm.elbow.rotation.set(-0.25, 0, 0);
        rightArm.shoulder.rotation.set(s * 0.3, 0, -0.1);
        rightArm.elbow.rotation.set(-0.25, 0, 0);
      } else if (pose === 'downed') {
        rig.position.set(0, 0.2, 0);
        rig.rotation.set(-Math.PI / 2, 0, 0.35);
        leftArm.shoulder.rotation.set(-0.45, 0, 0.65);
        leftArm.elbow.rotation.set(-0.7, 0, 0);
        rightArm.shoulder.rotation.set(-0.85, 0, -0.45);
        rightArm.elbow.rotation.set(-0.55, 0, 0);
        leftLeg.hip.rotation.set(0.25, 0, 0.22);
        leftLeg.knee.rotation.set(0.65, 0, 0);
        rightLeg.hip.rotation.set(-0.18, 0, -0.15);
        rightLeg.knee.rotation.set(0.45, 0, 0);
      } else {
        leftArm.shoulder.rotation.set(0.08, 0, 0.12);
        leftArm.elbow.rotation.set(-0.28, 0, 0);
        rightArm.shoulder.rotation.set(0.12, 0, -0.12);
        rightArm.elbow.rotation.set(-0.35, 0, 0);
        weaponGroup.rotation.set(1.15, 0, 0);
        leftLeg.hip.rotation.set(0, 0, 0.04);
        leftLeg.knee.rotation.set(0.06, 0, 0);
        rightLeg.hip.rotation.set(0, 0, -0.04);
        rightLeg.knee.rotation.set(0.06, 0, 0);
      }
    },
    triggerMuzzleFlash(duration = 0.08) {
      this.flashTimer = duration;
      this.muzzleFlash.material.opacity = 0.98;
    },
    getMuzzleWorldPos(target = new THREE.Vector3()) {
      this.mesh.updateMatrixWorld(true);
      return this.muzzleFlash.getWorldPosition(target);
    },
  };

  charObj.setPose('idle', 0);
  return charObj;
}

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  spawnSmoke(pos, scale = 0.9, life = 0.75, color = 0xdbe2ea) {
    const sprite = createGlowSprite(color, scale, 0.48);
    sprite.material.blending = THREE.NormalBlending;
    sprite.position.copy(pos);
    this.scene.add(sprite);
    this.items.push({
      mesh: sprite,
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.6),
      grow: 1.9,
      life,
      maxLife: life,
      type: 'smoke',
    });
  }

  spawnSparks(pos, count = 8) {
    for (let i = 0; i < count; i++) {
      const s = createGlowSprite(i % 2 === 0 ? 0xffd166 : 0xff6b29, 0.55 + Math.random() * 0.48, 0.96);
      s.position.copy(pos);
      this.scene.add(s);
      this.items.push({
        mesh: s,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          2.2 + Math.random() * 4.5,
          (Math.random() - 0.5) * 9
        ),
        grow: -0.6,
        life: 0.38 + Math.random() * 0.22,
        maxLife: 0.55,
        type: 'spark',
      });
    }
  }

  spawnCasings(pos, count = 4, frozen = false) {
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.22,
    });
    for (let i = 0; i < count; i++) {
      const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.085, 6), brassMat);
      casing.position.copy(pos).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * (frozen ? 0.85 : 0.16),
          (Math.random() - 0.3) * (frozen ? 0.55 : 0.12),
          (Math.random() - 0.5) * (frozen ? 0.85 : 0.16)
        )
      );
      casing.rotation.set(Math.random() * 3.14, Math.random() * 3.14, Math.random() * 3.14);
      this.scene.add(casing);
      this.items.push({
        mesh: casing,
        vel: new THREE.Vector3((Math.random() - 0.5) * 3.2, 2.2 + Math.random() * 2.0, (Math.random() - 0.5) * 3.2),
        grow: 0,
        life: frozen ? 99 : 1.1 + Math.random() * 0.5,
        maxLife: frozen ? 99 : 1.5,
        type: 'casing',
      });
    }
  }

  spawnTracer(from, to, life = 0.14, color = 0xffffff) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = Math.max(0.2, dir.length());
    const geo = new THREE.CylinderGeometry(0.028, 0.028, len, 5);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    this.scene.add(mesh);
    this.items.push({
      mesh,
      vel: new THREE.Vector3(),
      grow: 0,
      life,
      maxLife: life,
      type: 'tracer',
    });
  }

  clear() {
    for (const it of this.items) {
      this.scene.remove(it.mesh);
      if (it.mesh.geometry) it.mesh.geometry.dispose();
    }
    this.items = [];
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.life <= 0) {
        this.scene.remove(it.mesh);
        if (it.mesh.geometry) it.mesh.geometry.dispose();
        this.items.splice(i, 1);
        continue;
      }
      const ratio = it.life / it.maxLife;
      it.mesh.position.addScaledVector(it.vel, dt);
      if (it.type === 'spark') {
        it.vel.y -= 14 * dt;
      } else if (it.type === 'casing') {
        it.vel.y -= 12 * dt;
        it.mesh.rotation.x += dt * 11;
        it.mesh.rotation.z += dt * 9;
        if (it.mesh.position.y < 0.04) {
          it.mesh.position.y = 0.04;
          it.vel.y *= -0.35;
          it.vel.x *= 0.65;
          it.vel.z *= 0.65;
        }
      }
      if (it.grow !== 0) {
        const s = Math.max(0.1, it.mesh.scale.x + it.grow * dt);
        it.mesh.scale.set(s, s, 1);
      }
      if (it.mesh.material && it.type !== 'casing') {
        it.mesh.material.opacity = ratio * (it.type === 'smoke' ? 0.45 : 0.95);
      }
    }
  }
}
