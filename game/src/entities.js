import * as THREE from 'three';
import { createContactShadow, createGlowSprite } from './world.js';

function createWheel(radius = 0.38, width = 0.28) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 16),
    new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.85 })
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  g.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 10),
    new THREE.MeshStandardMaterial({ color: 0xd8e0e8, metalness: 0.78, roughness: 0.25 })
  );
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  return g;
}

export function createVehicleMesh(type = 'hero', bodyColor = 0xe84a38) {
  const root = new THREE.Group();
  const isPolice = type === 'police';
  const isHero = type === 'hero';

  const paintMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0x111827 : bodyColor,
    metalness: isHero ? 0.55 : 0.35,
    roughness: isHero ? 0.22 : 0.38,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0xf8fafc : 0x181c24,
    metalness: 0.25,
    roughness: 0.4,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x102235,
    metalness: 0.85,
    roughness: 0.12,
    transparent: true,
    opacity: 0.86,
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });

  // Contact shadow underneath
  root.add(createContactShadow(2.9, 5.6, 0.74));

  // Lower chassis skirt
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.44, 4.55), paintMat);
  lower.position.set(0, 0.56, 0);
  lower.castShadow = true;
  lower.receiveShadow = true;
  root.add(lower);

  // Police white doors side panel
  if (isPolice) {
    const doors = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.46, 1.9), accentMat);
    doors.position.set(0, 0.58, 0.05);
    root.add(doors);
  }

  // Sloped hood (front is +Z)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 1.55), isHero ? accentMat : paintMat);
  hood.position.set(0, 0.82, 1.38);
  hood.rotation.x = 0.14;
  hood.castShadow = true;
  root.add(hood);

  // Rear deck
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.24, 1.15), paintMat);
  trunk.position.set(0, 0.84, -1.55);
  trunk.rotation.x = -0.07;
  trunk.castShadow = true;
  root.add(trunk);

  // Cabin roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, 0.48, 1.65),
    isPolice ? accentMat : paintMat
  );
  roof.position.set(0, 1.16, -0.15);
  roof.castShadow = true;
  root.add(roof);

  // Angled windshield (front)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.56, 0.08), glassMat);
  windshield.position.set(0, 1.08, 0.82);
  windshield.rotation.x = -0.68;
  root.add(windshield);

  // Angled rear window
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.52, 0.08), glassMat);
  rearGlass.position.set(0, 1.08, -1.1);
  rearGlass.rotation.x = 0.62;
  root.add(rearGlass);

  // Side windows
  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.38, 1.48), glassMat);
  sideGlass.position.set(0, 1.14, -0.15);
  root.add(sideGlass);

  // Sculpted wheel-arch fenders
  const fenderGeo = new THREE.BoxGeometry(0.18, 0.34, 1.02);
  [[-1.02, 1.32], [1.02, 1.32], [-1.02, -1.32], [1.02, -1.32]].forEach(([fx, fz]) => {
    const fender = new THREE.Mesh(fenderGeo, paintMat);
    fender.position.set(fx, 0.62, fz);
    root.add(fender);
  });

  // Hero sports car rear spoiler & twin exhaust
  if (isHero) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.07, 0.34), accentMat);
    wing.position.set(0, 1.14, -2.06);
    wing.rotation.x = 0.12;
    wing.castShadow = true;
    root.add(wing);

    [-0.64, 0.64].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.16), accentMat);
      strut.position.set(sx, 0.99, -2.02);
      root.add(strut);
    });
  }

  // Police push bumper & lightbar with soft radial additive glow sprites
  let redGlow = null;
  let blueGlow = null;
  if (isPolice) {
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.34, 0.16), chromeMat);
    pushBar.position.set(0, 0.56, 2.34);
    root.add(pushBar);

    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.12, 0.24), accentMat);
    barBase.position.set(0, 1.45, -0.08);
    root.add(barBase);

    const redLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.11, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xff2b3a })
    );
    redLamp.position.set(-0.32, 1.47, -0.08);
    root.add(redLamp);

    const blueLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.11, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x2b8cff })
    );
    blueLamp.position.set(0.32, 1.47, -0.08);
    root.add(blueLamp);

    redGlow = createGlowSprite(0xff2b3a, 2.9, 0.92);
    redGlow.position.set(-0.35, 1.56, -0.08);
    blueGlow = createGlowSprite(0x2b8cff, 2.9, 0.92);
    blueGlow.position.set(0.35, 1.56, -0.08);
    root.add(redGlow, blueGlow);
  }

  // Headlights & taillights with soft radial glow sprites
  [-0.72, 0.72].forEach((hx) => {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.14, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xfff4d6 })
    );
    hl.position.set(hx, 0.66, 2.28);
    root.add(hl);

    const hGlow = createGlowSprite(0xfff1c9, 1.65, 0.72);
    hGlow.position.set(hx, 0.66, 2.36);
    root.add(hGlow);

    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff2828 })
    );
    tl.position.set(hx, 0.68, -2.28);
    root.add(tl);

    const tGlow = createGlowSprite(0xff2424, 1.45, 0.68);
    tGlow.position.set(hx, 0.68, -2.36);
    root.add(tGlow);
  });

  // 4 wheels
  const wheels = [];
  [[-0.98, 1.32], [0.98, 1.32], [-0.98, -1.32], [0.98, -1.32]].forEach(([wx, wz]) => {
    const w = createWheel(0.38, 0.28);
    w.position.set(wx, 0.38, wz);
    root.add(w);
    wheels.push(w);
  });

  return { mesh: root, wheels, redGlow, blueGlow };
}

export function createPoliceHelicopter() {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x24334d, metalness: 0.42, roughness: 0.34 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x163854,
    metalness: 0.85,
    roughness: 0.12,
    transparent: true,
    opacity: 0.85,
  });

  // Fuselage
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.75, 4.8), bodyMat);
  body.castShadow = true;
  root.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10), glassMat);
  nose.scale.set(0.92, 0.78, 1.35);
  nose.position.set(0, -0.05, 2.15);
  root.add(nose);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.26, 3.6), stripeMat);
  stripe.position.set(0, -0.2, 0.1);
  root.add(stripe);

  // Tail boom & vertical fin
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 5.2, 8), bodyMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.25, -4.4);
  root.add(boom);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.9), stripeMat);
  fin.position.set(0, 0.65, -6.7);
  root.add(fin);

  // Landing skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
  [-1.05, 1.05].forEach((sx) => {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 8), skidMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, -1.35, 0.2);
    root.add(skid);
  });

  // Main rotor mast + blades + semi-transparent spinning rotor blur disc
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 1.35, 0.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.7, 8), skidMat);
  mast.position.y = -0.25;
  rotorGroup.add(mast);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.05, 0.28), bladeMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 9.6), bladeMat);
  rotorGroup.add(b1, b2);

  // Semi-transparent rotor blur disc
  const blurDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  blurDisc.rotation.x = -Math.PI / 2;
  blurDisc.position.y = 0.03;
  rotorGroup.add(blurDisc);
  root.add(rotorGroup);

  // Tail rotor
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.14), bladeMat);
  tailRotor.position.set(0.2, 0.65, -6.8);
  root.add(tailRotor);

  // Translucent downward searchlight cone
  const coneGeo = new THREE.ConeGeometry(5.6, 26, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xd8f1ff,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const searchCone = new THREE.Mesh(coneGeo, coneMat);
  searchCone.position.set(0, -13.2, 2.2);
  searchCone.rotation.x = -0.24;
  root.add(searchCone);

  const lampGlow = createGlowSprite(0xe0f2fe, 3.0, 0.95);
  lampGlow.position.set(0, -0.75, 2.25);
  root.add(lampGlow);

  return { mesh: root, rotorGroup, tailRotor, searchCone };
}

export function createPatrolBoat() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.1, 8.4),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
  );
  hull.position.y = 0.45;
  g.add(hull);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.3, 3.0),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 })
  );
  cabin.position.set(0, 1.5, -0.4);
  g.add(cabin);

  const beacon = createGlowSprite(0x38bdf8, 2.8, 0.9);
  beacon.position.set(0, 2.4, -0.4);
  g.add(beacon);
  return g;
}

// Articulated character with bent-elbow two-handed aiming stances and natural downed poses
export function createCharacter(role = 'player') {
  const root = new THREE.Group();
  const isCop = role === 'cop';
  const isPlayer = role === 'player';

  const jacketColor = isPlayer ? 0x1e293b : isCop ? 0x172554 : 0x6b21a8;
  const shirtColor = isPlayer ? 0xf97316 : isCop ? 0x38bdf8 : 0xe2e8f0;
  const pantsColor = isPlayer ? 0x27272a : isCop ? 0x0f172a : 0x334155;
  const skinColor = isPlayer ? 0xd8a47f : isCop ? 0xe0b592 : 0xc68e68;

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.75, roughness: 0.3 });

  const shadow = createContactShadow(1.15, 1.15, 0.56);
  root.add(shadow);

  const rig = new THREE.Group();
  root.add(rig);

  // Hips / pelvis
  const hips = new THREE.Group();
  hips.position.set(0, 0.94, 0);
  rig.add(hips);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.25), jacketMat);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add(torso);

  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.265), shirtMat);
  innerShirt.position.set(0, 0.28, 0.005);
  hips.add(innerShirt);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), skinMat);
  head.position.y = 0.72;
  head.castShadow = true;
  hips.add(head);

  // Hair or SBPD tactical cap
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.1, 0.3),
    new THREE.MeshStandardMaterial({ color: isCop ? 0x0f172a : 0x1c1917, roughness: 0.8 })
  );
  cap.position.set(0, 0.86, 0.02);
  hips.add(cap);

  // Articulated arms (upper + forearm with elbow pivot)
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

  // Weapon attached to right forearm
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0, -0.28, 0.12);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.52), gunMat);
  receiver.position.set(0, 0, 0.18);
  weaponGroup.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.54);
  weaponGroup.add(barrel);

  const muzzleFlash = createGlowSprite(0xffb84d, 1.35, 0.0);
  muzzleFlash.position.set(0, 0.02, 0.78);
  weaponGroup.add(muzzleFlash);
  rightArm.elbow.add(weaponGroup);

  // Articulated legs (thigh + shin with knee pivot)
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
      // Reset rig transforms
      rig.position.set(0, 0, 0);
      rig.rotation.set(0, 0, 0);
      hips.position.y = 0.94;
      hips.rotation.set(0, 0, 0);

      if (pose === 'aim') {
        // Bent-elbow two-handed combat aiming stance
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
      } else if (pose === 'downed') {
        // Natural collapsed pose on ground
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
        // Natural idle (relaxed bent elbows, zero T-pose)
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
    const sprite = createGlowSprite(color, scale, 0.44);
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
      const s = createGlowSprite(i % 2 === 0 ? 0xffd166 : 0xff7b29, 0.55 + Math.random() * 0.4, 0.95);
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
    const geo = new THREE.CylinderGeometry(0.025, 0.025, len, 5);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
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
