// Coralina Bay: Sunset Syndicate — Sculpted Vehicles, Driving Physics & Vehicle Stealing
import * as THREE from 'three';
import { WORLD_BOUNDS } from './config.js';
import {
  createContactShadow,
  createGlowSprite,
  getCBPDDoorTexture,
  getFireSpriteTexture,
  getHeroSideSeamTexture,
  getHeroTopStripeTexture,
  getSmokeSpriteTexture,
} from './textures.js';

function createWheel(radius = 0.39, width = 0.28, isHero = false) {
  const g = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 0.9, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: isHero ? 0xf8fafc : 0xdbe4f0,
    metalness: 0.92,
    roughness: 0.16,
  });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.78, roughness: 0.3 });

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 24), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  g.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.015, 20), rimMat);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);

  // Multi-spoke alloy spokes (6 spokes)
  const spokeMat = new THREE.MeshStandardMaterial({ color: isHero ? 0xe2e8f0 : 0x94a3b8, metalness: 0.88, roughness: 0.22 });
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(width + 0.028, radius * 1.16, 0.042), spokeMat);
    spoke.rotation.x = (i * Math.PI) / 6;
    g.add(spoke);
  }

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width + 0.036, 12), hubMat);
  hub.rotation.z = Math.PI / 2;
  g.add(hub);

  // Sport brake caliper visible inside the wheel
  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.65, radius * 0.36, radius * 0.26),
    new THREE.MeshStandardMaterial({
      color: isHero ? 0xf43f5e : 0xf59e0b,
      roughness: 0.35,
      metalness: 0.6,
    })
  );
  caliper.position.set(0, 0.02, radius * 0.38);
  g.add(caliper);

  return g;
}

function createExtrudedProfile(points, width, bevel = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.1, width - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 8,
  });
  geom.translate(0, 0, -(width - bevel * 2) / 2);
  geom.rotateY(-Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

export function createVehicleMesh(type = 'hero', bodyColor = 0xf43f5e) {
  const root = new THREE.Group();
  const isPolice = type === 'police';
  const isHero = type === 'hero';
  const isExotic = type === 'exotic';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0x0f172a : bodyColor,
    roughness: isHero || isExotic ? 0.14 : isPolice ? 0.22 : 0.28,
    metalness: isHero || isExotic ? 0.84 : isPolice ? 0.66 : 0.54,
    envMapIntensity: isHero || isExotic ? 1.85 : 1.35,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.24,
    metalness: 0.26,
    envMapIntensity: 1.2,
  });
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x0b111d, roughness: 0.52, metalness: 0.42 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x102038,
    roughness: 0.05,
    metalness: 0.94,
    envMapIntensity: 2.1,
    transparent: true,
    opacity: 0.72,
  });
  const cabinIntMat = new THREE.MeshStandardMaterial({ color: 0x151b26, roughness: 0.82 });

  const W = isHero || isExotic ? 2.08 : 1.98;
  const L = isHero || isExotic ? 4.78 : isPolice ? 4.86 : 4.55;

  // Sculpted lower chassis using beveled ExtrudeGeometry
  const lowerProfile = isHero || isExotic
    ? [
        [-2.36, 0.28], [-2.22, 0.78], [-1.52, 0.90], [-0.55, 0.92],
        [0.85, 0.90], [1.75, 0.78], [2.36, 0.56], [2.40, 0.28],
      ]
    : [
        [-2.38, 0.30], [-2.28, 0.86], [-1.35, 0.94], [1.15, 0.92],
        [2.28, 0.82], [2.40, 0.52], [2.42, 0.30],
      ];
  const lowerMesh = new THREE.Mesh(createExtrudedProfile(lowerProfile, W, 0.09), bodyMat);
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  root.add(lowerMesh);

  // Sloped greenhouse cabin
  const cabinProfile = isHero || isExotic
    ? [[-1.38, 0.86], [-0.72, 1.32], [0.46, 1.32], [1.12, 0.86]]
    : [[-1.42, 0.88], [-0.94, 1.46], [0.68, 1.46], [1.26, 0.88]];
  const cabinMat = isPolice ? whiteMat : bodyMat;
  const cabinMesh = new THREE.Mesh(createExtrudedProfile(cabinProfile, W * 0.82, 0.07), cabinMat);
  cabinMesh.castShadow = true;
  root.add(cabinMesh);

  // Recessed interior seats visible through tinted windows
  const interior = new THREE.Mesh(new THREE.BoxGeometry(W * 0.68, 0.42, 1.65), cabinIntMat);
  interior.position.set(0, 1.06, -0.08);
  root.add(interior);

  // Sloped front windshield + rear glass + side windows
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.74, isHero || isExotic ? 0.84 : 0.78), glassMat);
  frontGlass.position.set(0, isHero || isExotic ? 1.12 : 1.21, isHero || isExotic ? 0.80 : 0.98);
  frontGlass.rotation.x = isHero || isExotic ? -0.92 : -0.76;
  root.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.72, 0.78), glassMat);
  rearGlass.position.set(0, isHero || isExotic ? 1.12 : 1.20, isHero || isExotic ? -1.04 : -1.16);
  rearGlass.rotation.y = Math.PI;
  rearGlass.rotation.x = isHero || isExotic ? -0.94 : -0.74;
  root.add(rearGlass);

  for (const side of [-1, 1]) {
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.52, isHero || isExotic ? 0.36 : 0.44), glassMat);
    sideGlass.position.set(side * (W * 0.415), isHero || isExotic ? 1.12 : 1.21, -0.08);
    sideGlass.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    root.add(sideGlass);

    // Sculpted side wing mirrors
    const mirrorStem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.08), darkTrim);
    mirrorStem.position.set(side * (W * 0.51), 0.94, 0.62);
    const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.14), bodyMat);
    mirrorCap.position.set(side * (W * 0.58), 0.96, 0.58);
    root.add(mirrorStem, mirrorCap);
  }

  // Sculpted fender wheel arches (flared trim around all 4 wheels)
  const wheelPositions = [
    [-W * 0.49, 0.39, 1.44],
    [W * 0.49, 0.39, 1.44],
    [-W * 0.49, 0.39, -1.42],
    [W * 0.49, 0.39, -1.42],
  ];
  const wheels = [];
  const archGeom = new THREE.TorusGeometry(0.45, 0.055, 8, 16, Math.PI);
  for (const [wx, wy, wz] of wheelPositions) {
    const w = createWheel(0.39, isHero || isExotic ? 0.31 : 0.27, isHero || isExotic);
    w.position.set(wx, wy, wz);
    root.add(w);
    wheels.push(w);

    const arch = new THREE.Mesh(archGeom, darkTrim);
    arch.rotation.y = Math.PI / 2;
    arch.position.set(wx + (wx > 0 ? 0.06 : -0.06), wy + 0.02, wz);
    root.add(arch);
  }

  // Front grille, splitter, rear diffuser & twin chrome exhausts
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, 0.22, 0.14), darkTrim);
  grille.position.set(0, 0.48, L * 0.495);
  root.add(grille);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(W * 0.84, 0.2, 0.18), darkTrim);
  diffuser.position.set(0, 0.34, -L * 0.495);
  root.add(diffuser);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.14 });
  for (const ex of [-0.48, 0.48]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.22, 12), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.34, -L * 0.51);
    root.add(pipe);
  }

  // LED Headlights & Taillights with soft glow halos
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e3c });
  for (const sx of [-0.66, 0.66]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.12), headMat);
    hl.position.set(sx, 0.64, L * 0.49);
    root.add(hl);
    const hlGlow = createGlowSprite(0xfff4cc, 1.15, 0.55);
    hlGlow.position.set(sx, 0.64, L * 0.53);
    root.add(hlGlow);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.12), tailMat);
    tl.position.set(sx, 0.68, -L * 0.49);
    root.add(tl);
    const tlGlow = createGlowSprite(0xff2244, 1.35, 0.68);
    tlGlow.position.set(sx, 0.68, -L * 0.54);
    root.add(tlGlow);
  }

  // Full-width LED taillight bar on Hero / Exotic
  if (isHero || isExotic) {
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.055, 0.09), tailMat);
    ledBar.position.set(0, 0.72, -L * 0.495);
    root.add(ledBar);
  }

  let nitroGroup = null;
  if (isHero || isExotic) {
    // Racing top stripes + side livery
    const stripePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 0.76, 1.65),
      new THREE.MeshBasicMaterial({ map: getHeroTopStripeTexture(), transparent: true, depthWrite: false })
    );
    stripePlane.rotation.x = -Math.PI / 2;
    stripePlane.position.set(0, 0.95, 1.35);
    root.add(stripePlane);

    for (const side of [-1, 1]) {
      const sideDecal = new THREE.Mesh(
        new THREE.PlaneGeometry(3.3, 0.62),
        new THREE.MeshBasicMaterial({ map: getHeroSideSeamTexture(), transparent: true, depthWrite: false })
      );
      sideDecal.position.set(side * (W * 0.506), 0.58, -0.02);
      sideDecal.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(sideDecal);
    }

    // GT Carbon Rear Wing
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.06, 0.32), darkTrim);
    wingBlade.position.set(0, 1.18, -2.08);
    wingBlade.rotation.x = 0.12;
    root.add(wingBlade);
    for (const sx of [-0.62, 0.62]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.2), darkTrim);
      strut.position.set(sx, 1.0, -2.06);
      root.add(strut);
    }

    // Volumetric Twin Nitro Afterburner Flames
    nitroGroup = new THREE.Group();
    for (const ex of [-0.48, 0.48]) {
      const outer = createGlowSprite(0xff7b22, 1.45, 0.88);
      outer.position.set(ex, 0.36, -L * 0.57);
      const core = createGlowSprite(0x38e8ff, 0.95, 0.96);
      core.position.set(ex, 0.36, -L * 0.54);
      nitroGroup.add(outer, core);
    }
    nitroGroup.visible = false;
    root.add(nitroGroup);
  }

  let redGlow = null;
  let blueGlow = null;
  if (isPolice) {
    // Police push-bar bumper
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 0.16), darkTrim);
    pushBar.position.set(0, 0.56, L * 0.52);
    root.add(pushBar);

    // CBPD side door panels with badge livery
    const doorTex = getCBPDDoorTexture();
    for (const side of [-1, 1]) {
      const doorPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(3.65, 0.62),
        new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.26, metalness: 0.35 })
      );
      doorPanel.position.set(side * (W * 0.506), 0.62, 0.0);
      doorPanel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(doorPanel);
    }

    // LED Roof Lightbar
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 0.28), darkTrim);
    barBase.position.set(0, 1.50, -0.06);
    const redBar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.11, 0.24), new THREE.MeshBasicMaterial({ color: 0xff2244 }));
    redBar.position.set(-0.30, 1.56, -0.06);
    const blueBar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.11, 0.24), new THREE.MeshBasicMaterial({ color: 0x22aaff }));
    blueBar.position.set(0.30, 1.56, -0.06);
    root.add(barBase, redBar, blueBar);

    redGlow = createGlowSprite(0xff2a55, 2.5, 0.92);
    redGlow.position.set(-0.36, 1.66, -0.06);
    blueGlow = createGlowSprite(0x22b8ff, 2.5, 0.92);
    blueGlow.position.set(0.36, 1.66, -0.06);
    root.add(redGlow, blueGlow);
  }

  // Soft contact shadow grounded beneath chassis
  const shadow = createContactShadow(W * 1.38, L * 1.24, 0.74);
  root.add(shadow);

  return { mesh: root, bodyMat, wheels, redGlow, blueGlow, nitroGroup };
}

export function createScooterMesh(bodyColor = 0x22d3ee) {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.22, metalness: 0.68 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 1.42), bodyMat);
  deck.position.set(0, 0.34, 0);
  const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.34), bodyMat);
  cowl.position.set(0, 0.74, 0.56);
  cowl.rotation.x = -0.18;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.76), darkMat);
  seat.position.set(0, 0.76, -0.22);
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), darkMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.12, 0.48);

  const wFront = createWheel(0.26, 0.14, false);
  wFront.position.set(0, 0.26, 0.64);
  const wRear = createWheel(0.26, 0.16, false);
  wRear.position.set(0, 0.26, -0.58);

  root.add(deck, cowl, seat, handlebar, wFront, wRear, createContactShadow(0.95, 1.95, 0.6));
  return { mesh: root, bodyMat, wheels: [wFront, wRear], isScooter: true };
}

export function createWindowShooter(side = 1) {
  const g = new THREE.Group();
  const uniMat = new THREE.MeshStandardMaterial({ color: 0x162442, roughness: 0.72 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdba784, roughness: 0.65 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.25 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.26), uniMat);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
  head.position.set(0, 0.30, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.12), uniMat);
  arm.position.set(side * 0.38, 0.10, 0.08);
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.08), gunMat);
  rifle.position.set(side * 0.78, 0.14, 0.12);
  const flash = createGlowSprite(0xffdf80, 1.3, 0.92);
  flash.position.set(side * 1.16, 0.16, 0.14);

  g.add(torso, head, arm, rifle, flash);
  return { group: g, muzzlePosLocal: new THREE.Vector3(side * 1.15, 0.16, 0.14) };
}

// Upgraded Volumetric Burning Wreck — soft radial-gradient fire, glow & rising smoke plumes (zero blocky cones/cubes!)
export function createBurningWreck() {
  const root = new THREE.Group();
  const base = createVehicleMesh('police');
  base.mesh.traverse((obj) => {
    if (obj.isMesh && obj.material && obj.material.color) {
      obj.material = obj.material.clone();
      obj.material.color.multiplyScalar(0.26);
      if (obj.material.roughness !== undefined) obj.material.roughness = 0.92;
    }
  });
  if (base.redGlow) base.redGlow.visible = false;
  if (base.blueGlow) base.blueGlow.visible = false;

  base.mesh.rotation.z = 0.18;
  base.mesh.rotation.x = -0.06;
  base.mesh.position.y = 0.06;
  root.add(base.mesh);

  // Detached wheel resting on asphalt
  const looseWheel = createWheel(0.36, 0.26, false);
  looseWheel.position.set(1.52, 0.14, 1.55);
  looseWheel.rotation.set(Math.PI / 2 - 0.05, 0.3, 0.1);
  root.add(looseWheel);

  // Layered soft volumetric radial-gradient fire sprites
  const fireTex = getFireSpriteTexture();
  const fireLayers = [
    { pos: [0.0, 1.35, 1.05], sx: 2.8, sy: 3.2, op: 0.96 },
    { pos: [0.32, 1.75, 0.82], sx: 3.3, sy: 3.8, op: 0.88 },
    { pos: [-0.34, 1.52, 1.12], sx: 3.0, sy: 3.4, op: 0.84 },
    { pos: [0.12, 2.25, 0.65], sx: 2.6, sy: 3.1, op: 0.74 },
  ];
  for (const f of fireLayers) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: fireTex,
        transparent: true,
        opacity: f.op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    s.position.set(f.pos[0], f.pos[1], f.pos[2]);
    s.scale.set(f.sx, f.sy, 1);
    root.add(s);
  }

  // Soft warm ambient glow halo over the hood
  const hoodGlow = createGlowSprite(0xff6b22, 4.4, 0.56);
  hoodGlow.position.set(0.05, 1.45, 0.95);
  root.add(hoodGlow);

  // Volumetric wind-drifting dark smoke column using soft multi-lobe smoke sprites
  const smokeTex = getSmokeSpriteTexture();
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const smokeCol = i < 2 ? 0x5c2e1c : i < 4 ? 0x2c2424 : 0x181c26;
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: smokeTex,
        color: smokeCol,
        transparent: true,
        opacity: 0.74 - t * 0.36,
        depthWrite: false,
      })
    );
    const sc = 2.2 + i * 0.58;
    s.scale.set(sc, sc * 0.92, 1);
    s.position.set(
      0.15 + Math.pow(t, 1.3) * 3.4 + (i % 2 === 0 ? 0.22 : -0.18),
      1.95 + i * 0.88,
      0.75 - Math.pow(t, 1.2) * 2.1
    );
    root.add(s);
  }

  const fireLight = new THREE.PointLight(0xff6b22, 22, 24, 1.5);
  fireLight.position.set(0, 2.2, 0.9);
  root.add(fireLight);

  return root;
}

export function createPoliceHelicopter() {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.34, metalness: 0.62 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.78 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.75, 5.4), hullMat);
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.18, 16, 12), glassMat);
  nose.scale.set(0.95, 0.75, 1.2);
  nose.position.set(0, -0.06, 2.6);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.24, 4.4), stripeMat);
  stripe.position.set(0, -0.22, 0.1);
  const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 5.2), hullMat);
  tailBoom.position.set(0, 0.25, -4.9);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.55, 0.9), hullMat);
  tailFin.position.set(0, 0.65, -7.2);

  // Landing skids
  for (const sx of [-1.05, 1.05]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), hullMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, -1.35, 0.3);
    g.add(skid);
  }

  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 1.15, 0.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.55, 10), hullMat);
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.05, 0.28), hullMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 10.8), hullMat);
  rotorGroup.add(mast, blade1, blade2);

  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.16), hullMat);
  tailRotor.position.set(0.28, 0.55, -7.3);

  // Volumetric Spotlight Cone
  const spotCone = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 18.5, 22, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff8dc,
      transparent: true,
      opacity: 0.19,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  spotCone.position.set(0, -9.8, 2.2);
  spotCone.rotation.x = 0.08;
  const spotLamp = createGlowSprite(0xffffff, 2.4, 0.92);
  spotLamp.position.set(0, -0.78, 2.45);

  g.add(body, nose, stripe, tailBoom, tailFin, rotorGroup, tailRotor, spotCone, spotLamp);
  return { mesh: g, rotorGroup, tailRotor, spotCone };
}

export function createPatrolBoat() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.1, 8.8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  hull.position.y = 0.5;
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.26, 0.28, 8.85),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  stripe.position.y = 0.72;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.25, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.5 })
  );
  cabin.position.set(0, 1.55, -0.4);
  const beacon = createGlowSprite(0x22d3ee, 2.1, 0.9);
  beacon.position.set(0, 2.45, -0.4);
  g.add(hull, stripe, cabin, beacon);
  return g;
}

export function createYacht(scale = 1.0) {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafcff, roughness: 0.24, metalness: 0.18 });
  const navyMat = new THREE.MeshStandardMaterial({ color: 0x0e2a47, roughness: 0.26, metalness: 0.4 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0xb6814c, roughness: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x143352, roughness: 0.08, metalness: 0.9 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.9, 16.5), whiteMat);
  hull.position.y = 0.95;
  const hullBand = new THREE.Mesh(new THREE.BoxGeometry(5.26, 0.45, 16.56), navyMat);
  hullBand.position.y = 0.55;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.16, 15.2), teakMat);
  deck.position.y = 1.95;
  const lowerCabin = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.75, 8.6), whiteMat);
  lowerCabin.position.set(0, 2.85, -1.2);
  const winStrip = new THREE.Mesh(new THREE.BoxGeometry(4.18, 0.65, 7.6), glassMat);
  winStrip.position.set(0, 3.05, -1.0);
  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.25, 5.2), whiteMat);
  upperDeck.position.set(0, 4.35, -1.8);
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.2, 8), whiteMat);
  radarMast.position.set(0, 5.8, -2.0);

  g.add(hull, hullBand, deck, lowerCabin, winStrip, upperDeck, radarMast);
  g.scale.setScalar(scale);
  return g;
}

// Player vehicle driving physics
export function updatePlayerVehicle(game, dt, boosting) {
  game.nearbyVehicle = null;
  const v = game.currentVehicle;
  const baseAccel = game.input.w ? 28 : game.input.s ? -22 : 0;
  const accel = baseAccel + (boosting ? 14 : 0);
  v.speed += accel * dt;
  if (baseAccel === 0 && !boosting) v.speed *= Math.pow(0.28, dt);
  if (game.input.space) {
    v.speed *= Math.pow(0.18, dt);
    if (Math.abs(v.speed) > 8 && Math.random() < 0.45) {
      game.vfx.spawnSmoke(v.mesh.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 1.0, 0.7);
    }
  }
  const topSpeed = boosting ? Math.max(56, v.maxSpeed) : v.maxSpeed;
  v.speed = Math.max(-14, Math.min(topSpeed, v.speed));

  const steerDir = ((game.input.a || game.input.arrowLeft) ? 1 : 0) - ((game.input.d || game.input.arrowRight) ? 1 : 0);
  if (Math.abs(v.speed) > 0.6) {
    v.heading += steerDir * (v.isScooter ? 2.5 : 2.15) * dt * Math.sign(v.speed);
  }

  const nx = v.mesh.position.x + Math.sin(v.heading) * v.speed * dt;
  const nz = v.mesh.position.z + Math.cos(v.heading) * v.speed * dt;
  if (!game.collidesBuilding(nx, nz, v.radius || 1.8)) {
    v.mesh.position.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, nx));
    v.mesh.position.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, nz));
  } else {
    v.speed *= -0.35;
    v.damagePct = Math.min(95, v.damagePct + 4);
    game.vfx.spawnSparks(v.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 6);
    game.sound.playImpact(true);
  }
  v.mesh.rotation.y = v.heading;
  v.wheels.forEach((w) => { w.rotation.x += v.speed * dt * 2.2; });

  if (v.damagePct > 55 && Math.random() < dt * 8.5) {
    const hoodDist = v.isScooter ? 0.55 : 1.45;
    const hoodPos = v.mesh.position.clone().add(
      new THREE.Vector3(Math.sin(v.heading) * hoodDist, 0.92, Math.cos(v.heading) * hoodDist)
    );
    game.vfx.spawnSmoke(hoodPos, 1.15, 1.05, 0x334155);
  }

  const kmh = Math.round(Math.abs(v.speed) * 3.6);
  if (kmh > game.career.topSpeedKmh) game.career.topSpeedKmh = kmh;
}

// Enter or steal nearby vehicle ([F])
export function togglePlayerVehicle(game) {
  if (game.inVehicle && game.currentVehicle) {
    game.inVehicle = false;
    const v = game.currentVehicle;
    v.speed *= 0.2;
    game.playerChar.mesh.visible = true;
    game.playerChar.mesh.position.set(
      v.mesh.position.x - Math.cos(v.heading) * 2.25,
      0,
      v.mesh.position.z + Math.sin(v.heading) * 2.25
    );
    game.playerChar.mesh.rotation.y = v.heading;
    game.cameraCtrl.onExitVehicle(v.heading);
    game.sound.playClick();
    return;
  }

  const pPos = game.playerChar.mesh.position;
  let nearest = null;
  let nearestDist = 7.2;
  for (const v of game.vehicles) {
    if (!v.mesh.visible) continue;
    const d = Math.hypot(v.mesh.position.x - pPos.x, v.mesh.position.z - pPos.z);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = v;
    }
  }
  if (!nearest) return;

  const stealingNew = nearest !== game.heroVehicle;
  game.currentVehicle = nearest;
  game.inVehicle = true;
  game.playerChar.mesh.visible = false;
  game.cameraCtrl.onEnterVehicle(nearest.heading);

  if (stealingNew) {
    game.career.vehiclesBoosted += 1;
    game.wantedStars = Math.max(game.wantedStars, nearest.type === 'police' ? 2 : 1);
    game.dialogue = {
      speaker: 'VALERIA REYES',
      role: 'broker',
      text: `Nice boost — ${nearest.name} is yours. Keep moving before CBPD locks the street!`,
      timer: 6,
    };
  }
  game.sound.playClick();
}
