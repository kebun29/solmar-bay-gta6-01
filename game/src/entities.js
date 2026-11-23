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

export function createVehicleMesh(type = 'hero', bodyColor = 0xf43f5e) {
  const root = new THREE.Group();
  const isPolice = type === 'police';
  const isHero = type === 'hero';

  const paintMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0x0f172a : bodyColor,
    metalness: isHero ? 0.68 : isPolice ? 0.45 : 0.48,
    roughness: isHero ? 0.18 : isPolice ? 0.28 : 0.3,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    metalness: 0.42,
    roughness: 0.36,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.22,
    roughness: 0.34,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1c2e,
    metalness: 0.92,
    roughness: 0.08,
    transparent: true,
    opacity: 0.88,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    metalness: 0.9,
    roughness: 0.16,
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

  // Hero sports car exclusive: sculpted carbon hood vent, side intakes & GT wing spoiler
  if (isHero) {
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
  }

  // Police Interceptor exclusive: white livery doors, ramming pushbar, glowing LED lightbar
  let redGlow = null;
  let blueGlow = null;
  if (isPolice) {
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.52, 1.72), whiteMat);
    doorPanel.position.set(0, 0.63, -0.02);
    root.add(doorPanel);

    // Subtle coral/cyan CBPD side stripe
    const sideStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.14, 0.08, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    sideStripe.position.set(0, 0.55, -0.02);
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

  return { mesh: root, wheels, redGlow, blueGlow };
}

// Attach a CBPD officer leaning out of a cruiser's side window firing a carbine
export function createWindowShooter(side = 1) {
  const g = new THREE.Group();
  const copMat = new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca984, roughness: 0.65 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.28 });

  // Torso leaning out window
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.24), copMat);
  torso.position.set(side * 0.14, 0.08, 0);
  torso.rotation.z = -side * 0.32;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat);
  head.position.set(side * 0.24, 0.36, 0.02);
  g.add(head);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.09, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
  );
  cap.position.set(side * 0.24, 0.49, 0.04);
  g.add(cap);

  // Arms aiming outward toward the player
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 0.13), copMat);
  arm.position.set(side * 0.46, 0.18, 0.12);
  arm.rotation.y = -side * 0.22;
  g.add(arm);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.09), gunMat);
  gun.position.set(side * 0.72, 0.2, 0.18);
  gun.rotation.y = -side * 0.22;
  g.add(gun);

  // Bright multi-layer muzzle flash
  const coreFlash = createGlowSprite(0xfff7d6, 1.8, 0.98);
  coreFlash.position.set(side * 1.12, 0.21, 0.25);
  g.add(coreFlash);

  const outerFlash = createGlowSprite(0xff7b29, 3.1, 0.86);
  outerFlash.position.set(side * 1.12, 0.21, 0.25);
  g.add(outerFlash);

  g.position.set(side * 0.86, 1.12, 0.18);
  return { group: g, muzzlePosLocal: new THREE.Vector3(side * 1.15, 0.21, 0.25) };
}

// Charred burning & exploding wrecked vehicle for dramatic highway chaos
export function createBurningWreck() {
  const root = new THREE.Group();
  const base = createVehicleMesh('police');
  // Char the hull dark soot
  base.mesh.traverse((obj) => {
    if (obj.isMesh && obj.material && obj.material.color) {
      obj.material = obj.material.clone();
      obj.material.color.multiplyScalar(0.28);
      if (obj.material.roughness !== undefined) obj.material.roughness = 0.92;
    }
  });
  if (base.redGlow) base.redGlow.visible = false;
  if (base.blueGlow) base.blueGlow.visible = false;

  // Tilted, crashed posture
  base.mesh.rotation.z = 0.18;
  base.mesh.rotation.x = -0.06;
  base.mesh.position.y = 0.08;
  root.add(base.mesh);

  // Roaring multi-layered fire core & explosion bloom (balanced so wreck hull reads clearly)
  const fireSpecs = [
    { pos: [0, 1.05, 1.05], col: 0xffe89e, scale: 2.2, op: 0.92 },
    { pos: [0.28, 1.38, 0.78], col: 0xff6d1c, scale: 3.2, op: 0.82 },
    { pos: [-0.38, 1.2, 1.15], col: 0xff3b1f, scale: 2.9, op: 0.78 },
    { pos: [0.05, 1.85, 0.55], col: 0xff5a1f, scale: 2.7, op: 0.72 },
  ];
  fireSpecs.forEach((f) => {
    const s = createGlowSprite(f.col, f.scale, f.op);
    s.position.set(f.pos[0], f.pos[1], f.pos[2]);
    root.add(s);
  });

  // Billowing dark smoke column rising above the wreck
  for (let i = 0; i < 7; i++) {
    const smoke = createGlowSprite(i < 2 ? 0x3b2c26 : 0x1c212b, 2.5 + i * 0.65, 0.72 - i * 0.05);
    smoke.material.blending = THREE.NormalBlending;
    smoke.position.set(
      (i % 2 === 0 ? 1 : -1) * 0.3 + i * 0.22,
      2.1 + i * 1.1,
      0.5 - i * 0.25
    );
    root.add(smoke);
  }

  // Warm fire point light illuminating nearby asphalt & cars
  const fireLight = new THREE.PointLight(0xff6b22, 18, 22, 1.5);
  fireLight.position.set(0, 2.2, 0.8);
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

// Articulated character (player, CBPD officer, or tropical sidewalk pedestrian)
export function createCharacter(role = 'player', pedStyleIdx = 0) {
  const root = new THREE.Group();
  const isCop = role === 'cop';
  const isPlayer = role === 'player';
  const isPed = role === 'ped';

  const pedPalettes = [
    { jacket: 0xfb7185, shirt: 0xffffff, pants: 0x334155, skin: 0xdca782 },
    { jacket: 0x14b8a6, shirt: 0xfef08a, pants: 0x1e293b, skin: 0xc68a63 },
    { jacket: 0xf59e0b, shirt: 0xf8fafc, pants: 0x475569, skin: 0xe2b796 },
    { jacket: 0x8b5cf6, shirt: 0xfda4af, pants: 0x1f2937, skin: 0xb97c56 },
    { jacket: 0x38bdf8, shirt: 0xfef3c7, pants: 0x374151, skin: 0xd9a27c },
  ];
  const pp = pedPalettes[pedStyleIdx % pedPalettes.length];

  const jacketColor = isPlayer ? 0x181c28 : isCop ? 0x132043 : pp.jacket;
  const shirtColor = isPlayer ? 0xfb7185 : isCop ? 0x22d3ee : pp.shirt;
  const pantsColor = isPlayer ? 0x1f2430 : isCop ? 0x0f172a : pp.pants;
  const skinColor = isPlayer ? 0xd8a47f : isCop ? 0xe0b592 : pp.skin;

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.75, roughness: 0.3 });

  const shadow = createContactShadow(1.15, 1.15, 0.56);
  root.add(shadow);

  const rig = new THREE.Group();
  root.add(rig);

  const hips = new THREE.Group();
  hips.position.set(0, 0.94, 0);
  rig.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.25), jacketMat);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add(torso);

  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.265), shirtMat);
  innerShirt.position.set(0, 0.28, 0.005);
  hips.add(innerShirt);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), skinMat);
  head.position.y = 0.72;
  head.castShadow = true;
  hips.add(head);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.1, 0.3),
    new THREE.MeshStandardMaterial({ color: isCop ? 0x0f172a : 0x1c1917, roughness: 0.8 })
  );
  cap.position.set(0, 0.86, 0.02);
  hips.add(cap);

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.31, 0.5, 0);
    hips.add(shoulder);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), jacketMat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.29, 0);
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), skinMat);
    forearm.position.y = -0.14;
    forearm.castShadow = true;
    elbow.add(forearm);

    return { shoulder, elbow };
  }

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0, -0.28, 0.12);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.52), gunMat);
  receiver.position.set(0, 0, 0.18);
  weaponGroup.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.54);
  weaponGroup.add(barrel);

  const muzzleFlash = createGlowSprite(0xffb84d, 1.45, 0.0);
  muzzleFlash.position.set(0, 0.02, 0.78);
  weaponGroup.add(muzzleFlash);
  if (!isPed) {
    rightArm.elbow.add(weaponGroup);
  }

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.13, 0, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.16), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.45, 0);
    hip.add(knee);

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.15), pantsMat);
    shin.position.y = -0.22;
    shin.castShadow = true;
    knee.add(shin);

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
      const s = createGlowSprite(i % 2 === 0 ? 0xffd166 : 0xff6b29, 0.6 + Math.random() * 0.45, 0.96);
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
      }
      if (it.grow !== 0) {
        const s = Math.max(0.1, it.mesh.scale.x + it.grow * dt);
        it.mesh.scale.set(s, s, 1);
      }
      if (it.mesh.material) {
        it.mesh.material.opacity = ratio * (it.type === 'smoke' ? 0.45 : 0.95);
      }
    }
  }
}
